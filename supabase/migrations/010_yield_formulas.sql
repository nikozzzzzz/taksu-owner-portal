-- Create yield_formulas table
CREATE TABLE IF NOT EXISTS public.yield_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.yield_formulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_formulas" ON public.yield_formulas
  FOR ALL
  USING (
    current_owner_id() IN (
      SELECT id FROM owners WHERE role IN ('root', 'admin')
    )
  );

CREATE POLICY "accountant_view_formulas" ON public.yield_formulas
  FOR SELECT
  USING (
    auth_user_role() = 'accountant'
  );

-- Insert Default Formulas
INSERT INTO public.yield_formulas (id, name, description, rules) VALUES
  (
    '00000000-0000-0000-0000-000000000001', 
    'Equal Share', 
    'Net profit is split equally among all villas in the pool.',
    '[{"weight": 100, "method": "equal_share"}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002', 
    'Revenue Weighted', 
    'Net profit is split proportionally based on the gross revenue of each villa.',
    '[{"weight": 100, "method": "proportional", "metric": "revenue"}]'::jsonb
  );

-- Update pools table to use the new formula reference
-- We use a generic UUID column to link to yield_formulas
ALTER TABLE public.pools ADD COLUMN yield_formula_id UUID REFERENCES public.yield_formulas(id);

-- Migrate existing pools to use the default formulas
UPDATE public.pools
SET yield_formula_id = '00000000-0000-0000-0000-000000000001'
WHERE yield_formula = 'equal_share';

UPDATE public.pools
SET yield_formula_id = '00000000-0000-0000-0000-000000000002'
WHERE yield_formula = 'revenue_weighted';

-- Set default for new pools to Equal Share
ALTER TABLE public.pools ALTER COLUMN yield_formula_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Make it NOT NULL after setting the data
ALTER TABLE public.pools ALTER COLUMN yield_formula_id SET NOT NULL;

-- Drop the old yield_formula column (and its enum type eventually, but keeping it safe to just drop column)
ALTER TABLE public.pools DROP COLUMN yield_formula;

-- Drop the enum type if possible
DROP TYPE IF EXISTS yield_formula_enum CASCADE;

-- Trigger to update timestamp
CREATE TRIGGER update_yield_formulas_updated_at 
  BEFORE UPDATE ON public.yield_formulas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
