/*
# Service Requests, Feedback, Notifications Tables

## Summary
Creates the service and notification tables:
- `service_requests` — maintenance, IT, administrative, academic requests
- `request_history` — tracks status changes for each request (Open → In Progress → Resolved → Closed)
- `feedback` — user feedback, complaints, suggestions
- `feedback_responses` — staff/admin responses to feedback
- `notifications` — in-app notifications for announcements, events, requests, feedback, alerts, account

## Tables

### service_requests
- id, title, description, category, status (open/in_progress/resolved/closed)
- priority (low/medium/high), location, photo_url
- user_id (owner), assigned_to → profiles(id), rating, created_at, updated_at

### request_history
- id, request_id → service_requests(id), status, note, changed_by → auth.users(id), created_at

### feedback
- id, type (feedback/complaint/suggestion), subject, message, category
- rating, photo_url, user_id, status (open/responded/closed), created_at, updated_at

### feedback_responses
- id, feedback_id → feedback(id), message, responder_id → profiles(id), created_at

### notifications
- id, user_id, type (announcement/event/service_request/feedback/alert/account)
- title, body, data (jsonb), is_read, related_id, created_at

## Security
- RLS enabled on all tables.
- Users CRUD their own service_requests, feedback, notifications.
- request_history: users can read history for their own requests; insert allowed (for status changes).
- feedback_responses: read for feedback owner; insert for any authenticated (staff/admin respond).
- All owner columns default to auth.uid().

## Notes
1. Request status lifecycle: open → in_progress → resolved → closed.
2. Notifications include a jsonb `data` column for flexible payload (e.g. announcement_id, event_id).
3. Feedback type covers feedback/complaint/suggestion as required.
*/
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'maintenance',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  location text,
  photo_url text,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rating int CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_requests TO authenticated;

DROP POLICY IF EXISTS "read_own_requests" ON service_requests;
CREATE POLICY "read_own_requests" ON service_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_requests" ON service_requests;
CREATE POLICY "insert_own_requests" ON service_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_requests" ON service_requests;
CREATE POLICY "update_own_requests" ON service_requests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_requests" ON service_requests;
CREATE POLICY "delete_own_requests" ON service_requests FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- request_history
CREATE TABLE IF NOT EXISTS request_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE request_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON request_history TO authenticated;

DROP POLICY IF EXISTS "read_own_request_history" ON request_history;
CREATE POLICY "read_own_request_history" ON request_history FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM service_requests sr WHERE sr.id = request_history.request_id AND sr.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_request_history" ON request_history;
CREATE POLICY "insert_request_history" ON request_history FOR INSERT
  TO authenticated WITH CHECK (true);

-- feedback
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'feedback' CHECK (type IN ('feedback','complaint','suggestion')),
  subject text NOT NULL,
  message text NOT NULL,
  category text,
  rating int CHECK (rating >= 1 AND rating <= 5),
  photo_url text,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','responded','closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON feedback TO authenticated;

DROP POLICY IF EXISTS "read_own_feedback" ON feedback;
CREATE POLICY "read_own_feedback" ON feedback FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_feedback" ON feedback;
CREATE POLICY "insert_own_feedback" ON feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_feedback" ON feedback;
CREATE POLICY "update_own_feedback" ON feedback FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_feedback" ON feedback;
CREATE POLICY "delete_own_feedback" ON feedback FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- feedback_responses
CREATE TABLE IF NOT EXISTS feedback_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  message text NOT NULL,
  responder_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON feedback_responses TO authenticated;

DROP POLICY IF EXISTS "read_own_feedback_responses" ON feedback_responses;
CREATE POLICY "read_own_feedback_responses" ON feedback_responses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM feedback f WHERE f.id = feedback_responses.feedback_id AND f.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_feedback_response" ON feedback_responses;
CREATE POLICY "insert_feedback_response" ON feedback_responses FOR INSERT
  TO authenticated WITH CHECK (true);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'announcement' CHECK (type IN ('announcement','event','service_request','feedback','alert','account')),
  title text NOT NULL,
  body text,
  data jsonb,
  is_read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

DROP POLICY IF EXISTS "read_own_notifications" ON notifications;
CREATE POLICY "read_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- updated_at triggers
DROP TRIGGER IF EXISTS service_requests_updated_at ON service_requests;
CREATE TRIGGER service_requests_updated_at BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS feedback_updated_at ON feedback;
CREATE TRIGGER feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- indexes
CREATE INDEX IF NOT EXISTS idx_service_requests_user ON service_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests (status);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_history_request ON request_history (request_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_feedback ON feedback_responses (feedback_id);
