-- Create yield_formula enum
CREATE TYPE yield_formula_type AS ENUM ('equal_share', 'revenue_weighted');

-- Add yield_formula to pools table
ALTER TABLE public.pools
  ADD COLUMN yield_formula yield_formula_type DEFAULT 'equal_share';

-- Update existing pools to have equal_share
UPDATE public.pools SET yield_formula = 'equal_share' WHERE yield_formula IS NULL;
