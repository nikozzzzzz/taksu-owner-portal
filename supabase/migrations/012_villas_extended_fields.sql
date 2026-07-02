-- Add missing financial parameters to villas

ALTER TABLE public.villas
  ADD COLUMN IF NOT EXISTS individual_deviations TEXT,
  ADD COLUMN IF NOT EXISTS payout_day INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS owner_holds TEXT;
