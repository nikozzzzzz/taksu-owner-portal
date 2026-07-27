-- 018_villa_last_synced.sql

ALTER TABLE villas
ADD COLUMN last_synced_at TIMESTAMPTZ;
