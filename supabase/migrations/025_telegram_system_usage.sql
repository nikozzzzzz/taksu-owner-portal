-- 025_telegram_system_usage.sql
ALTER TABLE telegram_bot_settings ADD COLUMN IF NOT EXISTS report_system_usage_hourly BOOLEAN DEFAULT FALSE;
