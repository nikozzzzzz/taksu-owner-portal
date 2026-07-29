-- 023_telegram_bot_settings.sql

CREATE TABLE IF NOT EXISTS telegram_bot_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    bot_token TEXT,
    bot_name TEXT,
    chat_id TEXT,
    acl JSONB DEFAULT '[]'::jsonb, -- Access control list of allowed Telegram user IDs
    is_enabled BOOLEAN DEFAULT FALSE,
    health_status TEXT DEFAULT 'unknown', -- 'healthy' | 'unhealthy' | 'unknown'
    last_health_check TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE telegram_bot_settings ENABLE ROW LEVEL SECURITY;

-- Admin/Root check policy
CREATE POLICY "Admins can view and manage Telegram settings"
ON telegram_bot_settings
FOR ALL
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM owners WHERE role IN ('admin', 'root')
  )
);
