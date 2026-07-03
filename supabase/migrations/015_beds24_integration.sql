-- 015_beds24_integration.sql
-- Integrates Taksu with Beds24 (PMS Two-Way Sync)

-- 1. Extend villas table
ALTER TABLE villas 
  ADD COLUMN beds24_property_id BIGINT,
  ADD COLUMN beds24_room_id BIGINT;

-- 2. Extend bookings table
ALTER TABLE bookings
  ADD COLUMN beds24_booking_id BIGINT UNIQUE,
  ADD COLUMN beds24_status TEXT DEFAULT 'new';

-- 3. Create beds24_credentials table
CREATE TABLE beds24_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT,
  token TEXT,
  refresh_token TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: we assume a single global Beds24 account for the management company,
-- so this table should only ever have one row.

-- Enable RLS on credentials
ALTER TABLE beds24_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins and root can view/edit credentials
CREATE POLICY "beds24_credentials_admin_all"
  ON beds24_credentials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM owners 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'root')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_beds24_credentials_modtime
BEFORE UPDATE ON beds24_credentials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
