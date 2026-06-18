-- ========================================================
-- 001_initial_schema.sql
-- Taksu Owner Portal — Initial Database Schema
-- ========================================================

-- ========== ENABLE EXTENSIONS ==========
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== ENUMS ==========
CREATE TYPE owner_status AS ENUM ('active', 'suspended', 'closed');
CREATE TYPE dgt1_status AS ENUM ('valid', 'expired', 'pending_review', 'none');
CREATE TYPE payout_currency AS ENUM ('USD', 'EUR', 'AUD', 'GBP', 'SGD');
CREATE TYPE statement_status AS ENUM ('draft', 'awaiting_admin_approval', 'approved', 'sent_to_owner', 'paid', 'disputed');
CREATE TYPE booking_channel AS ENUM ('airbnb', 'booking', 'agoda', 'expedia', 'direct', 'other');
CREATE TYPE request_category AS ENUM (
  'personal_stay', 'maintenance_request', 'amenity_addition',
  'pricing_inquiry', 'payout_inquiry', 'document_request',
  'contract_inquiry', 'general'
);
CREATE TYPE request_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'completed', 'cancelled');
CREATE TYPE request_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE document_type AS ENUM (
  'management_agreement', 'dgt1', 'bukti_potong_pph26',
  'monthly_statement', 'annual_tax_summary', 'property_insurance',
  'leasehold_agreement', 'pbg_certificate', 'slf_certificate',
  'tdup_license', 'other'
);
CREATE TYPE villa_type AS ENUM ('studio', '1br', '2br', '3br');
CREATE TYPE villa_status AS ENUM ('pre_launch', 'active', 'maintenance', 'paused', 'closed');

-- ========== OWNERS TABLE ==========
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Auth (synced with Supabase Auth)
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Identity
  full_name TEXT NOT NULL,
  passport_number TEXT,
  passport_country TEXT,
  date_of_birth DATE,
  
  -- Residency
  country_of_residence TEXT NOT NULL,
  tax_residency_country TEXT NOT NULL,
  npwp_indonesia TEXT,
  
  -- DGT-1
  dgt1_status dgt1_status DEFAULT 'none',
  dgt1_valid_until DATE,
  dgt1_document_url TEXT,
  dgt1_uploaded_at TIMESTAMPTZ,
  dgt1_verified_at TIMESTAMPTZ,
  dgt1_verified_by_id UUID,
  pph26_effective_rate DECIMAL(5,4) DEFAULT 0.20,
  
  -- Banking
  bank_name TEXT,
  bank_account_iban TEXT,
  bank_account_swift TEXT,
  bank_account_holder TEXT,
  bank_address TEXT,
  payout_currency payout_currency DEFAULT 'USD',
  banking_last_changed_at TIMESTAMPTZ,
  banking_last_changed_by_id UUID,
  
  -- Preferences
  preferred_language TEXT DEFAULT 'en',
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- Contract
  management_agreement_signed_at TIMESTAMPTZ,
  management_agreement_expires_at TIMESTAMPTZ,
  management_agreement_document_url TEXT,
  
  -- Tracking
  last_login_at TIMESTAMPTZ,
  total_logins INT DEFAULT 0,
  
  -- System
  status owner_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_owners_email ON owners(email);
CREATE INDEX idx_owners_auth_user ON owners(auth_user_id);
CREATE INDEX idx_owners_dgt1_expiry ON owners(dgt1_valid_until) WHERE dgt1_status = 'valid';

-- ========== POOLS TABLE ==========
CREATE TABLE pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  villa_type villa_type NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== VILLAS TABLE ==========
CREATE TABLE villas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  
  -- Type
  villa_type villa_type NOT NULL,
  bedrooms INT NOT NULL,
  bathrooms INT NOT NULL,
  max_guests INT NOT NULL,
  has_private_pool BOOLEAN DEFAULT FALSE,
  view_type TEXT,
  square_meters DECIMAL(8,2),
  
  -- Phase
  phase INT NOT NULL CHECK (phase IN (1, 2, 3)),
  ownership_type TEXT NOT NULL CHECK (ownership_type IN ('investor_owned', 'pt_owned')),
  owner_id UUID REFERENCES owners(id),
  
  -- Pool
  pool_id UUID REFERENCES pools(id),
  
  -- Integration
  hostaway_listing_id INT UNIQUE,
  
  -- Pricing
  base_price_usd DECIMAL(10,2),
  premium_multiplier DECIMAL(5,4) DEFAULT 0,
  
  -- Financial
  estimated_market_value_usd DECIMAL(12,2),
  estimated_capex_usd DECIMAL(12,2),
  
  -- Status
  status villa_status DEFAULT 'pre_launch',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_villas_owner ON villas(owner_id);
CREATE INDEX idx_villas_pool ON villas(pool_id);

-- ========== BOOKINGS TABLE ==========
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostaway_reservation_id TEXT UNIQUE,
  villa_id UUID NOT NULL REFERENCES villas(id),
  pool_id UUID REFERENCES pools(id),
  
  -- Pool assignment
  pool_assignment_method TEXT,
  pool_assignment_score DECIMAL(10,4),
  
  -- Dates
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  nights INT GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
  
  -- Guest (anonymized for investor view)
  guest_full_name TEXT NOT NULL,
  guest_initials TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN guest_full_name IS NOT NULL THEN
        UPPER(LEFT(SPLIT_PART(guest_full_name, ' ', 1), 1) || 
              '.' || 
              LEFT(SPLIT_PART(guest_full_name, ' ', 2), 1) || '.')
      ELSE 'N/A'
    END
  ) STORED,
  guest_country TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guests_count INT NOT NULL DEFAULT 1,
  
  -- Channel
  channel booking_channel NOT NULL,
  channel_reservation_code TEXT,
  
  -- Financial
  total_paid_by_guest_usd DECIMAL(12,2) NOT NULL,
  channel_commission_usd DECIMAL(12,2) DEFAULT 0,
  phr_tax_usd DECIMAL(12,2) DEFAULT 0,
  net_to_villa_usd DECIMAL(12,2) GENERATED ALWAYS AS 
    (total_paid_by_guest_usd - channel_commission_usd - phr_tax_usd) STORED,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed',
  
  booked_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_villa_dates ON bookings(villa_id, check_in_date, check_out_date);
CREATE INDEX idx_bookings_pool ON bookings(pool_id);

-- ========== MONTHLY STATEMENTS ==========
CREATE TABLE monthly_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id),
  owner_id UUID NOT NULL REFERENCES owners(id),
  billing_month DATE NOT NULL,
  
  -- Revenue
  gross_revenue_usd DECIMAL(12,2) NOT NULL,
  revenue_by_channel JSONB NOT NULL DEFAULT '{}',
  channel_commission_usd DECIMAL(12,2) NOT NULL DEFAULT 0,
  phr_tax_usd DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_revenue_usd DECIMAL(12,2) NOT NULL,
  
  -- Expenses
  total_opex_usd DECIMAL(12,2) NOT NULL DEFAULT 0,
  opex_breakdown JSONB NOT NULL DEFAULT '{}',
  
  -- Calculation
  net_profit_usd DECIMAL(12,2) NOT NULL,
  management_fee_usd DECIMAL(12,2) NOT NULL,
  management_fee_rate DECIMAL(5,4) DEFAULT 0.20,
  owner_gross_payout_usd DECIMAL(12,2) NOT NULL,
  
  -- Tax withholding
  pph26_rate DECIMAL(5,4) NOT NULL,
  pph26_amount_usd DECIMAL(12,2) NOT NULL,
  owner_net_payout_usd DECIMAL(12,2) NOT NULL,
  
  -- Stay stats
  bookings_count INT NOT NULL DEFAULT 0,
  occupied_nights INT NOT NULL DEFAULT 0,
  available_nights INT NOT NULL DEFAULT 30,
  occupancy_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  adr_usd DECIMAL(12,2),
  revpar_usd DECIMAL(12,2),
  
  -- Documents
  statement_pdf_url TEXT,
  bukti_potong_pdf_url TEXT,
  excel_export_url TEXT,
  
  -- Status
  status statement_status DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  approved_by_id UUID,
  sent_to_owner_at TIMESTAMPTZ,
  
  -- Payment
  payment_scheduled_at DATE,
  payment_sent_at TIMESTAMPTZ,
  payment_reference TEXT,
  payment_proof_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(villa_id, billing_month)
);

CREATE INDEX idx_statements_owner_month ON monthly_statements(owner_id, billing_month DESC);
CREATE INDEX idx_statements_villa_month ON monthly_statements(villa_id, billing_month DESC);

-- ========== OPERATING EXPENSES ==========
CREATE TABLE operating_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id),
  statement_id UUID REFERENCES monthly_statements(id),
  
  -- Categorization
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  
  -- Financial
  amount_usd DECIMAL(12,2) NOT NULL,
  amount_idr DECIMAL(14,2),
  fx_rate DECIMAL(10,4),
  
  -- Documentation
  receipt_urls TEXT[] DEFAULT '{}',
  vendor_name TEXT,
  invoice_number TEXT,
  
  -- Approval
  added_by_id UUID NOT NULL,
  approval_status TEXT DEFAULT 'auto_approved',
  
  -- Dates
  expense_date DATE NOT NULL,
  billing_month DATE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opex_villa_month ON operating_expenses(villa_id, billing_month);
CREATE INDEX idx_opex_statement ON operating_expenses(statement_id);

-- ========== OWNER REQUESTS ==========
CREATE TABLE owner_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(id),
  villa_id UUID REFERENCES villas(id),
  
  category request_category NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_dates_start DATE,
  preferred_dates_end DATE,
  attachments TEXT[] DEFAULT '{}',
  
  status request_status DEFAULT 'pending',
  priority request_priority DEFAULT 'normal',
  
  assigned_to_id UUID,
  assigned_at TIMESTAMPTZ,
  
  admin_response TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requests_owner_status ON owner_requests(owner_id, status);

-- ========== REQUEST COMMENTS ==========
CREATE TABLE request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES owner_requests(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('owner', 'admin')),
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== OWNER DOCUMENTS ==========
CREATE TABLE owner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(id),
  villa_id UUID REFERENCES villas(id),
  
  document_type document_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_mime_type TEXT,
  
  valid_from DATE,
  valid_until DATE,
  
  download_count INT DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  
  visible_to_owner BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_owner_type ON owner_documents(owner_id, document_type);

-- ========== POOL ROTATION STATE ==========
CREATE TABLE pool_rotation_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES pools(id),
  villa_id UUID NOT NULL REFERENCES villas(id),
  
  revenue_last_90_days_usd DECIMAL(12,2) NOT NULL DEFAULT 0,
  nights_booked_last_90_days INT NOT NULL DEFAULT 0,
  priority_score DECIMAL(10,4) NOT NULL DEFAULT 0,
  fair_share_metric DECIMAL(5,4) NOT NULL DEFAULT 1.0,
  
  last_booking_at TIMESTAMPTZ,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(pool_id, villa_id)
);

-- ========== AUDIT LOGS ==========
CREATE TABLE owner_portal_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(id),
  
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  
  ip_address INET,
  user_agent TEXT,
  
  changes JSONB,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_owner ON owner_portal_audit(owner_id, created_at DESC);

-- ========== TIMESTAMP UPDATE TRIGGER ==========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_villas_updated_at BEFORE UPDATE ON villas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_statements_updated_at BEFORE UPDATE ON monthly_statements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON owner_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opex_updated_at BEFORE UPDATE ON operating_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON owner_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
