-- 026_ai_pricing_settings.sql
ALTER TABLE owners
ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'anthropic',
ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'claude-3-5-sonnet-20240620',
ADD COLUMN IF NOT EXISTS ai_api_key TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_pricing_prompt TEXT DEFAULT 'You are a helpful AI pricing assistant for a luxury villa in Bali. Analyze the occupancy, existing bookings, current prices, and provide thoughtful pricing optimization advice. Take into account any holidays, market trends, and length-of-stay strategies.';
