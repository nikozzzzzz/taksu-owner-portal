-- 024_system_events.sql
-- System-wide event log for health monitoring, cron runs, sync activity, errors.
-- Displayed in the admin System Status Bar (ProxMox-style bottom panel).

CREATE TABLE IF NOT EXISTS system_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category    TEXT NOT NULL CHECK (category IN ('beds24', 'system', 'cron', 'auth', 'sync')),
  level       TEXT NOT NULL CHECK (level IN ('info', 'success', 'warning', 'error')),
  title       TEXT NOT NULL,
  body        TEXT,
  metadata    JSONB
);

-- Admins only
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_events_admin_read"
  ON system_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM owners
      WHERE auth_user_id = auth.uid()
        AND role IN ('admin', 'root')
    )
  );

-- Backend inserts via service role (no frontend INSERT needed)
CREATE POLICY "system_events_service_insert"
  ON system_events FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_system_events_created ON system_events (created_at DESC);
CREATE INDEX idx_system_events_category ON system_events (category, created_at DESC);
CREATE INDEX idx_system_events_level ON system_events (level, created_at DESC);

-- Auto-prune: keep only last 1000 rows (triggered on insert)
CREATE OR REPLACE FUNCTION prune_system_events()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM system_events
  WHERE id IN (
    SELECT id FROM system_events
    ORDER BY created_at DESC
    OFFSET 1000
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prune_system_events
  AFTER INSERT ON system_events
  FOR EACH ROW EXECUTE FUNCTION prune_system_events();
