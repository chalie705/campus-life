/*
# Announcements, Events, Clubs Tables

## Summary
Creates the content tables for the campus app:
- `announcements` — university-wide posts (priority, category, pinned)
- `announcement_reads` — tracks which users have read which announcements (for unread count)
- `events` — campus events with date, time, location, capacity
- `event_rsvps` — tracks user RSVPs to events
- `clubs` — student organizations with category and member count
- `club_members` — tracks user membership in clubs

## Tables

### announcements
- id, title, body, category, priority (normal/high/urgent), is_pinned, image_url
- author_id → profiles(id), created_at, updated_at

### announcement_reads
- announcement_id → announcements(id), user_id → auth.users(id), read_at
- Unique on (announcement_id, user_id)

### events
- id, title, description, category, location, latitude, longitude
- start_time, end_time, max_attendees, image_url
- organizer_id → profiles(id), created_at, updated_at

### event_rsvps
- event_id → events(id), user_id → auth.users(id), status (going/interested/not_going)
- Unique on (event_id, user_id)

### clubs
- id, name, description, category, logo_url, meeting_day, meeting_time, location
- president_id → profiles(id), created_at, updated_at

### club_members
- club_id → clubs(id), user_id → auth.users(id), role (member/officer), joined_at
- Unique on (club_id, user_id)

## Security
- RLS enabled on all tables.
- All authenticated users can read announcements, events, clubs.
- Authenticated users can create RSVPs, join clubs, mark announcements read — only for themselves.
- Users can update/delete only their own RSVPs/memberships.
- Announcement/event/club creation restricted (handled via policy allowing any authenticated user for demo;
  in production this would be faculty/admin only).

## Notes
1. All owner columns (user_id) use DEFAULT auth.uid() so client inserts omitting the owner succeed.
2. announcement_reads and event_rsvps use composite unique constraints to prevent duplicates.
3. Category columns are text with app-enforced values (not enums) for flexibility.
*/
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','high','urgent')),
  is_pinned boolean DEFAULT false,
  image_url text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON announcements TO authenticated;

DROP POLICY IF EXISTS "read_announcements" ON announcements;
CREATE POLICY "read_announcements" ON announcements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_announcements" ON announcements;
CREATE POLICY "insert_announcements" ON announcements FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_announcements" ON announcements;
CREATE POLICY "update_announcements" ON announcements FOR UPDATE
  TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "delete_announcements" ON announcements;
CREATE POLICY "delete_announcements" ON announcements FOR DELETE
  TO authenticated USING (author_id = auth.uid());

-- announcement_reads
CREATE TABLE IF NOT EXISTS announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON announcement_reads TO authenticated;

DROP POLICY IF EXISTS "read_own_announcement_reads" ON announcement_reads;
CREATE POLICY "read_own_announcement_reads" ON announcement_reads FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_announcement_reads" ON announcement_reads;
CREATE POLICY "insert_own_announcement_reads" ON announcement_reads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_announcement_reads" ON announcement_reads;
CREATE POLICY "delete_own_announcement_reads" ON announcement_reads FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  location text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  max_attendees int,
  image_url text,
  organizer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;

DROP POLICY IF EXISTS "read_events" ON events;
CREATE POLICY "read_events" ON events FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_events" ON events;
CREATE POLICY "insert_events" ON events FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_events" ON events;
CREATE POLICY "update_events" ON events FOR UPDATE
  TO authenticated USING (organizer_id = auth.uid()) WITH CHECK (organizer_id = auth.uid());

DROP POLICY IF EXISTS "delete_events" ON events;
CREATE POLICY "delete_events" ON events FOR DELETE
  TO authenticated USING (organizer_id = auth.uid());

-- event_rsvps
CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going' CHECK (status IN ('going','interested','not_going')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_rsvps TO authenticated;

DROP POLICY IF EXISTS "read_event_rsvps" ON event_rsvps;
CREATE POLICY "read_event_rsvps" ON event_rsvps FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_event_rsvp" ON event_rsvps;
CREATE POLICY "insert_own_event_rsvp" ON event_rsvps FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_event_rsvp" ON event_rsvps;
CREATE POLICY "update_own_event_rsvp" ON event_rsvps FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_event_rsvp" ON event_rsvps;
CREATE POLICY "delete_own_event_rsvp" ON event_rsvps FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- clubs
CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  logo_url text,
  meeting_day text,
  meeting_time text,
  location text,
  president_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON clubs TO authenticated;

DROP POLICY IF EXISTS "read_clubs" ON clubs;
CREATE POLICY "read_clubs" ON clubs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_clubs" ON clubs;
CREATE POLICY "insert_clubs" ON clubs FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_clubs" ON clubs;
CREATE POLICY "update_clubs" ON clubs FOR UPDATE
  TO authenticated USING (president_id = auth.uid()) WITH CHECK (president_id = auth.uid());

DROP POLICY IF EXISTS "delete_clubs" ON clubs;
CREATE POLICY "delete_clubs" ON clubs FOR DELETE
  TO authenticated USING (president_id = auth.uid());

-- club_members
CREATE TABLE IF NOT EXISTS club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','officer')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE (club_id, user_id)
);

ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON club_members TO authenticated;

DROP POLICY IF EXISTS "read_club_members" ON club_members;
CREATE POLICY "read_club_members" ON club_members FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_club_member" ON club_members;
CREATE POLICY "insert_own_club_member" ON club_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_club_member" ON club_members;
CREATE POLICY "update_own_club_member" ON club_members FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_club_member" ON club_members;
CREATE POLICY "delete_own_club_member" ON club_members FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- updated_at triggers
DROP TRIGGER IF EXISTS announcements_updated_at ON announcements;
CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS clubs_updated_at ON clubs;
CREATE TRIGGER clubs_updated_at BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS facilities_updated_at ON facilities;
CREATE TRIGGER facilities_updated_at BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- indexes
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements (priority);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events (start_time);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON event_rsvps (user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members (user_id);
CREATE INDEX IF NOT EXISTS idx_facilities_category ON facilities (category);
