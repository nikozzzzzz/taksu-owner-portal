-- Migration: Quick Replies
CREATE TABLE quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

-- Allow full access to authenticated admins
CREATE POLICY "Admins can manage quick replies" ON quick_replies
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'admin' OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin' OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
