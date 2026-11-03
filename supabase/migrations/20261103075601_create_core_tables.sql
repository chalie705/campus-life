/*
# Core Tables: Departments, Profiles, Facilities, Emergency Contacts

## Summary
Creates the foundational tables for the University Campus Life app:
- `departments` — university departments (reference data)
- `profiles` — extends Supabase auth.users with campus-specific fields (role, university ID, department, avatar)
- `facilities` — campus buildings and services (library, cafeteria, health center, labs, sports, admin, emergency)
- `emergency_contacts` — campus emergency phone numbers and procedures

Also creates a trigger that auto-creates a `profiles` row (and a `notification_preferences` row)
whenever a new auth user signs up, so the app never sees a logged-in user without a profile.

## Tables

### departments
- id (uuid PK)
- name, code, description, created_at

### profiles
- id (uuid PK → auth.users.id, ON DELETE CASCADE)
- email, full_name, role (student/faculty/staff/admin/guest), university_id, phone, avatar_url, bio
- department_id → departments(id)
- created_at, updated_at

### facilities
- id, name, category, description, building, floor, latitude, longitude
- opening_time, closing_time, is_open_weekends, phone, image_url, created_at, updated_at

### emergency_contacts
- id, name, type, phone, description, available_24h, location, created_at

## Security
- RLS enabled on all tables.
- profiles: users can read all profiles (directory) but only update their own (excluding role).
- departments, emergency_contacts: public read for authenticated.
- facilities: public read for authenticated.
- All tables granted to `authenticated` role (app requires sign-in).

## Notes
1. `profiles` is the single source of truth for user role/department — NOT user_metadata.
2. The handle_new_user trigger fires on auth.users INSERT and creates the profile row
   using the email from the auth record and default role 'student'.
3. notification_preferences table is created here so the trigger can reference it.
*/

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON departments TO authenticated;

DROP POLICY IF EXISTS "auth_read_departments" ON departments;
CREATE POLICY "auth_read_departments" ON departments FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- FACILITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  building text,
  floor text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  opening_time time,
  closing_time time,
  is_open_weekends boolean DEFAULT false,
  phone text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON facilities TO authenticated;

DROP POLICY IF EXISTS "auth_read_facilities" ON facilities;
CREATE POLICY "auth_read_facilities" ON facilities FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- EMERGENCY CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'other',
  phone text NOT NULL,
  description text,
  available_24h boolean DEFAULT true,
  location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON emergency_contacts TO authenticated;

DROP POLICY IF EXISTS "auth_read_emergency_contacts" ON emergency_contacts;
CREATE POLICY "auth_read_emergency_contacts" ON emergency_contacts FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- NOTIFICATION PREFERENCES (needed for the trigger)
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  announcements boolean DEFAULT true,
  events boolean DEFAULT true,
  service_requests boolean DEFAULT true,
  feedback boolean DEFAULT true,
  alerts boolean DEFAULT true,
  account boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON notification_preferences TO authenticated;

DROP POLICY IF EXISTS "read_own_prefs" ON notification_preferences;
CREATE POLICY "read_own_prefs" ON notification_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_prefs" ON notification_preferences;
CREATE POLICY "update_own_prefs" ON notification_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','faculty','staff','admin','guest')),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  university_id text,
  phone text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (full_name, university_id, phone, avatar_url, bio, department_id, updated_at) ON profiles TO authenticated;

DROP POLICY IF EXISTS "read_all_profiles" ON profiles;
CREATE POLICY "read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- AUTO-CREATE PROFILE + NOTIFICATION PREFERENCES ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'student')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- ============================================================
-- UPDATED_AT TRIGGER FOR PROFILES
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
