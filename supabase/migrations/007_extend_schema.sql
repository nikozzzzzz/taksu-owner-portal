-- Add new enum values to villa_type
ALTER TYPE villa_type ADD VALUE IF NOT EXISTS '1br_l';
ALTER TYPE villa_type ADD VALUE IF NOT EXISTS '1br_xl';
ALTER TYPE villa_type ADD VALUE IF NOT EXISTS '2br_l';
ALTER TYPE villa_type ADD VALUE IF NOT EXISTS '2br_xl';
ALTER TYPE villa_type ADD VALUE IF NOT EXISTS '4br';

-- Create new Enums
CREATE TYPE slf_status AS ENUM ('received', 'in_progress', 'not_submitted');
CREATE TYPE payout_type AS ENUM ('net_profit_share', 'gross');
CREATE TYPE agreement_status AS ENUM ('active', 'expired', 'terminated');
CREATE TYPE report_frequency AS ENUM ('monthly', 'quarterly');

-- Extend owners table
ALTER TABLE public.owners
  ADD COLUMN citizenship VARCHAR(3),
  ADD COLUMN passport_issue_date DATE,
  ADD COLUMN passport_expiry_date DATE,
  ADD COLUMN passport_document_url TEXT,
  ADD COLUMN npwp_document_url TEXT,
  ADD COLUMN tin_number VARCHAR(100),
  ADD COLUMN tin_document_url TEXT,
  ADD COLUMN registration_address TEXT,
  ADD COLUMN actual_address TEXT,
  ADD COLUMN phone_whatsapp VARCHAR(50),
  ADD COLUMN phone_telegram VARCHAR(50),
  ADD COLUMN dgt1_issue_date DATE,
  ADD COLUMN p3b_treaty_number VARCHAR(100),
  ADD COLUMN p3b_document_url TEXT,
  ADD COLUMN bank_country VARCHAR(3),
  ADD COLUMN intermediary_bank_details JSONB,
  ADD COLUMN alternative_payment_details JSONB,
  ADD COLUMN crypto_wallet_address VARCHAR(255),
  ADD COLUMN crypto_network VARCHAR(50),
  ADD COLUMN statement_email VARCHAR(255),
  ADD COLUMN report_frequency report_frequency DEFAULT 'monthly',
  ADD COLUMN statement_language VARCHAR(2) DEFAULT 'en',
  ADD COLUMN booking_notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN dgt1_notifications_enabled BOOLEAN DEFAULT true;

-- Add constraints for owners
ALTER TABLE public.owners
  ADD CONSTRAINT chk_passport_dates CHECK (passport_expiry_date > passport_issue_date);

-- Extend villas table
ALTER TABLE public.villas
  ADD COLUMN land_area_sqm NUMERIC,
  ADD COLUMN build_year INT,
  ADD COLUMN physical_address TEXT,
  ADD COLUMN google_maps_url TEXT,
  ADD COLUMN photo_urls JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN amenities JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN smart_lock_id VARCHAR(100),
  ADD COLUMN cadastral_number VARCHAR(100),
  ADD COLUMN pbg_number VARCHAR(100),
  ADD COLUMN pbg_document_url TEXT,
  ADD COLUMN slf_number VARCHAR(100),
  ADD COLUMN slf_status slf_status DEFAULT 'not_submitted',
  ADD COLUMN slf_issue_date DATE,
  ADD COLUMN slf_expiry_date DATE,
  ADD COLUMN slf_document_url TEXT,
  ADD COLUMN pln_id VARCHAR(100),
  ADD COLUMN pln_tariff VARCHAR(50),
  ADD COLUMN pdam_id VARCHAR(100),
  ADD COLUMN water_source VARCHAR(100),
  ADD COLUMN pricelabs_id VARCHAR(100),
  ADD COLUMN turno_id VARCHAR(100),
  ADD COLUMN airbnb_id VARCHAR(100),
  ADD COLUMN booking_com_id VARCHAR(100),
  ADD COLUMN wifi_network VARCHAR(100),
  ADD COLUMN wifi_password VARCHAR(100),
  ADD COLUMN default_management_fee_rate NUMERIC CHECK (default_management_fee_rate >= 0 AND default_management_fee_rate <= 100),
  ADD COLUMN min_payout_threshold_usd NUMERIC DEFAULT 0,
  ADD COLUMN owner_nights_limit_per_year INT DEFAULT 21,
  ADD COLUMN start_float_usd NUMERIC DEFAULT 0,
  ADD COLUMN payout_type payout_type DEFAULT 'net_profit_share';

-- Add constraints for villas
ALTER TABLE public.villas
  ADD CONSTRAINT chk_slf_dates CHECK (slf_expiry_date > slf_issue_date);

-- Create villa_agreements table
CREATE TABLE public.villa_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES public.villas(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  hak_sewa_number VARCHAR(100),
  hak_sewa_start_date DATE,
  hak_sewa_end_date DATE,
  hak_sewa_document_url TEXT,
  hak_sewa_extension_terms TEXT,
  annual_rent_amount NUMERIC,
  management_agreement_number VARCHAR(100),
  ma_signed_date DATE,
  ma_document_url TEXT,
  ma_term_months INT,
  pbb_tax_amount NUMERIC,
  status agreement_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_hak_sewa_dates CHECK (hak_sewa_end_date > hak_sewa_start_date)
);

CREATE INDEX idx_villa_agreements_villa_id ON public.villa_agreements(villa_id);
CREATE INDEX idx_villa_agreements_owner_id ON public.villa_agreements(owner_id);

-- Enable RLS for villa_agreements
ALTER TABLE public.villa_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own agreements" 
ON public.villa_agreements FOR SELECT 
USING (owner_id = current_owner_id() OR current_owner_id() IN (
    SELECT id FROM public.owners WHERE role IN ('root', 'admin')
));

CREATE POLICY "Admins can manage all agreements" 
ON public.villa_agreements FOR ALL
USING (current_owner_id() IN (
    SELECT id FROM public.owners WHERE role IN ('root', 'admin')
));
