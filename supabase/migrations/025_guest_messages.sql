-- Migration: Guest Messages Integration
CREATE TABLE guest_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  beds24_message_id TEXT UNIQUE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('guest', 'host')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE guest_messages ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated admins
CREATE POLICY "Admins can view all guest messages" ON guest_messages
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin' OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Allow insert access to authenticated admins
CREATE POLICY "Admins can insert guest messages" ON guest_messages
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin' OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Allow updates (like marking as read)
CREATE POLICY "Admins can update guest messages" ON guest_messages
  FOR UPDATE USING (
    (auth.jwt() ->> 'role') = 'admin' OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE guest_messages;
