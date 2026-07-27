-- 019_api_logs.sql

CREATE TYPE api_direction AS ENUM ('inbound', 'outbound');

CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    service TEXT NOT NULL,
    direction api_direction NOT NULL,
    endpoint TEXT NOT NULL,
    payload JSONB,
    response_status INT,
    response_body TEXT,
    error_message TEXT
);

-- Ensure only authenticated admins can read it (via RLS or we just query via service role in server actions).
-- Since the frontend can use Supabase real-time or just an API endpoint with 5s refresh, we'll probably use server action or an API endpoint.
-- Enable RLS
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view API logs" 
ON api_logs 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM owners WHERE role IN ('admin', 'root')
  )
);

CREATE POLICY "Allow all inserts to API logs" 
ON api_logs 
FOR INSERT 
WITH CHECK (true);


-- We only insert from the backend using service_role, so no insert policy is needed for the frontend.
