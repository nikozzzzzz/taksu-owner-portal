-- 021_add_villa_sync_fields.sql
ALTER TABLE villas
ADD COLUMN IF NOT EXISTS prices_last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS prices_next_sync_at TIMESTAMPTZ;
