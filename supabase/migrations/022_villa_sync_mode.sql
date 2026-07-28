-- Migration: Add sync mode to villas
ALTER TABLE villas ADD COLUMN beds24_sync_mode text NOT NULL DEFAULT 'read_only';
