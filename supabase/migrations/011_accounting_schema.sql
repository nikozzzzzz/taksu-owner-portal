-- ========================================================
-- 011_accounting_schema.sql
-- Taksu Owner Portal — Accounting Module
-- ========================================================

-- ========== ACCOUNTING CATEGORIES ==========
CREATE TABLE IF NOT EXISTS public.accounting_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.accounting_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_accounting_categories" ON public.accounting_categories
  FOR ALL USING (auth_user_role() IN ('root', 'admin'));

CREATE POLICY "accountant_all_accounting_categories" ON public.accounting_categories
  FOR ALL USING (auth_user_role() = 'accountant');

CREATE POLICY "investor_view_accounting_categories" ON public.accounting_categories
  FOR SELECT USING (auth_user_role() IN ('investor', 'service'));

-- ========== ACCOUNTING INVOICES ==========
-- Created before transactions so transaction can FK to invoice
CREATE TABLE IF NOT EXISTS public.accounting_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,

  -- Issuer (always MC)
  issuer_name TEXT NOT NULL DEFAULT 'PT Taksu Living Management',

  -- Client
  client_name TEXT NOT NULL,
  client_address TEXT,
  client_tax_id TEXT,
  client_email TEXT,

  -- Details
  title TEXT NOT NULL,
  description TEXT,
  issue_date DATE NOT NULL,
  due_date DATE,

  -- Financial
  subtotal_usd DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  tax_amount_usd DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_usd DECIMAL(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'IDR', 'EUR')),

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,

  -- Documents
  pdf_url TEXT,
  closing_document_url TEXT,

  -- Entity
  entity_type TEXT NOT NULL CHECK (entity_type IN ('villa', 'management_company')),
  villa_id UUID REFERENCES public.villas(id) ON DELETE SET NULL,

  created_by_id UUID REFERENCES public.owners(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_entity ON public.accounting_invoices(entity_type, villa_id);
CREATE INDEX idx_invoices_status ON public.accounting_invoices(status);
CREATE INDEX idx_invoices_date ON public.accounting_invoices(issue_date DESC);

ALTER TABLE public.accounting_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_accounting_invoices" ON public.accounting_invoices
  FOR ALL USING (auth_user_role() IN ('root', 'admin'));

CREATE POLICY "accountant_all_accounting_invoices" ON public.accounting_invoices
  FOR ALL USING (auth_user_role() = 'accountant');

-- ========== ACCOUNTING INVOICE ITEMS ==========
CREATE TABLE IF NOT EXISTS public.accounting_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.accounting_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price_usd DECIMAL(14,2) NOT NULL,
  total_usd DECIMAL(14,2) GENERATED ALWAYS AS (quantity * unit_price_usd) STORED,
  sort_order INT DEFAULT 0
);

ALTER TABLE public.accounting_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_invoice_items" ON public.accounting_invoice_items
  FOR ALL USING (auth_user_role() IN ('root', 'admin'));

CREATE POLICY "accountant_all_invoice_items" ON public.accounting_invoice_items
  FOR ALL USING (auth_user_role() = 'accountant');

-- ========== ACCOUNTING TRANSACTIONS ==========
CREATE TABLE IF NOT EXISTS public.accounting_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity
  entity_type TEXT NOT NULL CHECK (entity_type IN ('villa', 'management_company')),
  villa_id UUID REFERENCES public.villas(id) ON DELETE SET NULL,

  -- Type
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),

  -- Classification
  category_id UUID NOT NULL REFERENCES public.accounting_categories(id),

  -- Financial
  title TEXT NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'IDR', 'EUR')),
  amount_usd DECIMAL(14,2),
  fx_rate DECIMAL(10,4) DEFAULT 1.0,

  -- Date
  transaction_date DATE NOT NULL,
  period_month DATE,

  -- Details
  description TEXT,
  comment TEXT,
  vendor_name TEXT,
  invoice_number TEXT,
  responsible_owner_id UUID REFERENCES public.owners(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed', 'cancelled')),

  -- Attachments
  attachment_urls TEXT[] DEFAULT '{}',

  -- Invoice linkage
  invoice_id UUID REFERENCES public.accounting_invoices(id) ON DELETE SET NULL,

  -- Audit
  created_by_id UUID REFERENCES public.owners(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_acctx_entity ON public.accounting_transactions(entity_type, villa_id, transaction_date DESC);
CREATE INDEX idx_acctx_period ON public.accounting_transactions(period_month DESC);
CREATE INDEX idx_acctx_category ON public.accounting_transactions(category_id);
CREATE INDEX idx_acctx_type ON public.accounting_transactions(transaction_type);

ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_accounting_transactions" ON public.accounting_transactions
  FOR ALL USING (auth_user_role() IN ('root', 'admin'));

CREATE POLICY "accountant_all_accounting_transactions" ON public.accounting_transactions
  FOR ALL USING (auth_user_role() = 'accountant');

-- ========== TRIGGERS ==========
CREATE TRIGGER update_accounting_categories_updated_at
  BEFORE UPDATE ON public.accounting_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounting_transactions_updated_at
  BEFORE UPDATE ON public.accounting_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounting_invoices_updated_at
  BEFORE UPDATE ON public.accounting_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== SEED DEFAULT CATEGORIES ==========
INSERT INTO public.accounting_categories (name, type, description, color, sort_order) VALUES
  -- Income categories
  ('Booking Revenue', 'income', 'Revenue from villa bookings', '#10B981', 1),
  ('Pool Revenue Share', 'income', 'Revenue from pool profit sharing', '#059669', 2),
  ('Management Fee Income', 'income', 'Management fees received', '#047857', 3),
  ('Other Income', 'income', 'Miscellaneous income', '#6EE7B7', 4),

  -- Expense categories
  ('Staff Salaries', 'expense', 'Salaries and wages for staff', '#EF4444', 10),
  ('Maintenance & Repairs', 'expense', 'Property maintenance and repairs', '#F97316', 11),
  ('Utilities', 'expense', 'Electricity, water, internet', '#F59E0B', 12),
  ('Cleaning & Laundry', 'expense', 'Housekeeping and laundry costs', '#EAB308', 13),
  ('Supplies & Consumables', 'expense', 'Guest amenities and operational supplies', '#84CC16', 14),
  ('Marketing & Advertising', 'expense', 'Listing fees, ads, promotions', '#06B6D4', 15),
  ('OTA Commissions', 'expense', 'Airbnb, Booking.com channel commissions', '#3B82F6', 16),
  ('Insurance', 'expense', 'Property insurance premiums', '#8B5CF6', 17),
  ('Taxes', 'expense', 'Government taxes (PPN, PPh, PBB)', '#EC4899', 18),
  ('Legal & Professional', 'expense', 'Legal fees, accounting, consulting', '#F43F5E', 19),
  ('Bank & Payment Fees', 'expense', 'Wire transfer and payment processing fees', '#64748B', 20),
  ('Office & Admin', 'expense', 'Office supplies and administrative costs', '#78716C', 21),
  ('Other Expenses', 'expense', 'Miscellaneous expenses', '#9CA3AF', 22)
ON CONFLICT DO NOTHING;
