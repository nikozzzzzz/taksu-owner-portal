-- 016_beds24_sync_log.sql
-- Tracks every Beds24 full-sync run (triggered manually or via cron).

CREATE TABLE beds24_sync_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by  TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'webhook' | 'cron'
  status        TEXT NOT NULL DEFAULT 'running', -- 'running' | 'success' | 'error'

  -- Counters
  properties_found  INT NOT NULL DEFAULT 0,
  bookings_fetched  INT NOT NULL DEFAULT 0,
  bookings_created  INT NOT NULL DEFAULT 0,
  bookings_updated  INT NOT NULL DEFAULT 0,
  bookings_skipped  INT NOT NULL DEFAULT 0,

  error_message TEXT,

  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ
);

-- Admins only
ALTER TABLE beds24_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beds24_sync_log_admin_all"
  ON beds24_sync_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM owners
      WHERE auth_user_id = auth.uid()
        AND role IN ('admin', 'root')
    )
  );

CREATE INDEX idx_beds24_sync_log_started ON beds24_sync_log(started_at DESC);
