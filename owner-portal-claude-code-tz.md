# Owner Portal MVP — Technical Specification for Claude Code
## PT Taksu Living Management

> **Этот документ — полное ТЗ для разработки Owner Portal MVP с помощью Claude Code.**
> Структурирован так, чтобы Claude Code мог работать итеративно, по фазам, с чёткими acceptance criteria.

---

## 0. HOW TO USE THIS DOCUMENT WITH CLAUDE CODE

### Setup instructions

```bash
# 1. Create project directory
mkdir taksu-owner-portal
cd taksu-owner-portal

# 2. Initialize Claude Code
claude

# 3. Paste this entire document to Claude with context:
# "I'm building Owner Portal for PT Taksu Living Management 
#  according to this specification. Read it fully, then we'll 
#  work phase by phase. Start with Phase 1."
```

### Working approach

This spec is organized into **8 sequential phases**. Each phase:
- Has clear deliverables
- Builds on previous phase
- Includes acceptance criteria
- Is testable independently

**Recommended workflow with Claude Code:**
1. Read full spec first (Claude reads sections 0-3 для context)
2. Execute Phase 1 → verify → commit
3. Execute Phase 2 → verify → commit
4. Continue through Phase 8
5. After each phase, run acceptance tests

**Estimated total time:** 60-100 hours of focused work over 4-6 weeks.

---

## 1. PROJECT OVERVIEW

### What we're building

A web-based Owner Portal for PT Taksu Living Management — a boutique villa management company in Penestanan, Ubud, Bali. The portal lets foreign individual investors (who own villas managed by us) access:

- **Financial statements** (monthly с PPh 26 withholding logic)
- **Booking calendar** (anonymized guest data)
- **Performance analytics** (RevPAR, ADR, occupancy + market benchmark)
- **Pool position** (fair share metric для identical-villa pools)
- **Tax documents** (DGT-1 management, bukti potong PPh 26)
- **Requests system** (owner-initiated requests к management team)
- **Profile & settings** (banking, notifications)

### Business context (critical to understand)

- **PT Taksu Living Management** is a local Indonesian PT
- Manages 8-26 villas in Penestanan, Ubud over 3 years
- **Investors** are foreign individuals (EU, AU, Asia) who own villas via Hak Sewa (leasehold)
- Each investor signs Management Agreement with PT
- **Management fee:** 20% of net profit (operating expenses are pass-through to investor)
- **Critical tax mechanism:** PT must withhold PPh 26 (10-20% depending on DGT-1) before paying investor

### Why this portal is critical

This portal is **the main investor retention product**. Without it:
- Profit share model causes constant disputes
- Investors don't trust the numbers
- No competitive differentiation vs other Bali villa managers

The portal is the **single most important investor-facing differentiator**.

---

## 2. TECH STACK & ARCHITECTURE

### Mandatory stack

```
Frontend:
- Next.js 14 (App Router, NOT Pages Router)
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui (component library)
- React Hook Form + Zod (forms validation)
- Recharts (analytics charts)
- TanStack Table v8 (data tables)
- date-fns (date handling)
- Lucide React (icons)
- Framer Motion (subtle animations only)

Backend:
- Next.js API routes (Server Actions where possible)
- Supabase (PostgreSQL + Auth + Storage)
- @supabase/ssr (server-side Supabase)
- React-PDF / @react-pdf/renderer (PDF generation)
- exceljs (Excel export)
- Resend (transactional emails)
- Zod (server-side validation)

Dev tooling:
- pnpm (package manager — faster than npm)
- ESLint + Prettier
- TypeScript strict
- Husky (pre-commit hooks)

Hosting:
- Vercel (production)
- Supabase Cloud (database + auth)
```

### Why these choices (don't deviate)

- **Next.js App Router:** Server Components reduce bundle size, better для SEO not needed but better DX
- **Supabase:** All-in-one (DB + Auth + Storage), saves $$$ vs separate tools
- **shadcn/ui:** Not a library — generates code into your project, full control, no version conflicts
- **React-PDF:** Type-safe PDF generation, server-side rendering possible

### Project structure (create this exactly)

```
taksu-owner-portal/
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Template with vars (committed)
├── README.md
├── package.json
├── pnpm-lock.yaml
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── components.json               # shadcn/ui config
│
├── app/
│   ├── layout.tsx                # Root layout (Tailwind, fonts)
│   ├── page.tsx                  # Landing redirect → /login or /dashboard
│   ├── globals.css               # Tailwind + custom CSS variables
│   │
│   ├── (auth)/                   # Auth pages (no header)
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── setup-account/        # First-time setup from invitation
│   │       └── page.tsx
│   │
│   ├── (portal)/                 # Owner-facing portal (с header/sidebar)
│   │   ├── layout.tsx            # Authenticated layout
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── statements/
│   │   │   ├── page.tsx          # List
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Detail
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── pool-position/
│   │   │   └── page.tsx
│   │   ├── tax-documents/
│   │   │   ├── page.tsx
│   │   │   └── upload-dgt1/
│   │   │       └── page.tsx
│   │   ├── requests/
│   │   │   ├── page.tsx          # List
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # Create form
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Detail
│   │   ├── documents/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx          # Profile
│   │       ├── banking/
│   │       │   └── page.tsx
│   │       └── notifications/
│   │           └── page.tsx
│   │
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── callback/route.ts
│       ├── statements/
│       │   ├── route.ts          # GET list
│       │   └── [id]/
│       │       ├── route.ts      # GET detail
│       │       ├── pdf/route.ts  # GET PDF
│       │       └── excel/route.ts
│       ├── tax/
│       │   ├── dgt1/
│       │   │   ├── upload/route.ts
│       │   │   └── status/route.ts
│       │   └── bukti-potong/
│       │       └── [id]/pdf/route.ts
│       └── requests/
│           ├── route.ts
│           └── [id]/route.ts
│
├── components/
│   ├── ui/                       # shadcn/ui generated components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── ... (etc)
│   │
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── reset-password-form.tsx
│   │
│   ├── layout/
│   │   ├── portal-sidebar.tsx
│   │   ├── portal-header.tsx
│   │   ├── language-switcher.tsx (placeholder для Phase 2)
│   │   └── user-menu.tsx
│   │
│   ├── dashboard/
│   │   ├── current-month-card.tsx
│   │   ├── ytd-summary.tsx
│   │   ├── dgt1-alert.tsx
│   │   ├── pool-position-mini.tsx
│   │   ├── recent-booking-card.tsx
│   │   ├── tax-documents-mini.tsx
│   │   ├── performance-summary.tsx
│   │   └── recent-activity.tsx
│   │
│   ├── statements/
│   │   ├── statement-list.tsx
│   │   ├── statement-detail.tsx
│   │   ├── expense-category.tsx
│   │   ├── receipt-viewer.tsx
│   │   └── statement-download-buttons.tsx
│   │
│   ├── calendar/
│   │   ├── month-calendar.tsx
│   │   ├── booking-event.tsx
│   │   ├── booking-modal.tsx
│   │   └── channel-legend.tsx
│   │
│   ├── analytics/
│   │   ├── revenue-trend-chart.tsx
│   │   ├── channel-mix.tsx
│   │   ├── kpi-tiles.tsx
│   │   ├── market-benchmark.tsx
│   │   └── seasonality-view.tsx
│   │
│   ├── pool/
│   │   ├── fair-share-explanation.tsx
│   │   ├── pool-position-detail.tsx
│   │   └── rotation-history-chart.tsx
│   │
│   ├── tax/
│   │   ├── dgt1-status-card.tsx
│   │   ├── dgt1-upload-flow.tsx
│   │   ├── bukti-potong-table.tsx
│   │   └── annual-summary.tsx
│   │
│   ├── requests/
│   │   ├── request-list.tsx
│   │   ├── request-detail.tsx
│   │   ├── new-request-form.tsx
│   │   └── request-status-badge.tsx
│   │
│   └── shared/
│       ├── loading-spinner.tsx
│       ├── empty-state.tsx
│       ├── error-boundary.tsx
│       └── confirm-dialog.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (RSC)
│   │   ├── middleware.ts         # Session refresh
│   │   └── types.ts              # Generated types
│   │
│   ├── auth/
│   │   ├── actions.ts            # Server actions for auth
│   │   └── middleware.ts         # Auth checks
│   │
│   ├── pdf/
│   │   ├── statement-pdf.tsx     # Statement PDF template
│   │   ├── bukti-potong-pdf.tsx
│   │   └── generators.ts         # PDF generation helpers
│   │
│   ├── excel/
│   │   └── statement-excel.ts    # Excel export logic
│   │
│   ├── calculations/
│   │   ├── statement-calc.ts     # Net profit, management fee, PPh 26
│   │   ├── pph26-rates.ts        # DTA rates by country
│   │   └── analytics-calc.ts     # RevPAR, ADR, etc.
│   │
│   ├── email/
│   │   ├── client.ts             # Resend client
│   │   ├── templates/
│   │   │   ├── statement-ready.tsx
│   │   │   ├── dgt1-expiry-warning.tsx
│   │   │   ├── request-update.tsx
│   │   │   └── welcome.tsx
│   │   └── send.ts
│   │
│   ├── utils/
│   │   ├── currency.ts           # Format USD/EUR/etc
│   │   ├── dates.ts              # Date formatting
│   │   ├── i18n.ts               # Future-proof, EN only now
│   │   └── cn.ts                 # className helper
│   │
│   └── constants/
│       ├── countries.ts          # ISO country list
│       ├── languages.ts
│       └── pph26-rates.ts        # DTA rates per country
│
├── hooks/
│   ├── use-owner.ts              # Current owner data
│   ├── use-villa.ts              # Current villa data
│   ├── use-statements.ts         # Statements queries
│   └── use-realtime.ts           # Supabase Realtime
│
├── styles/
│   └── globals.css               # CSS variables for Wellness Bali theme
│
├── public/
│   ├── images/
│   │   ├── logo.svg              # Taksu Living logo
│   │   ├── login-bg.jpg          # Login background
│   │   └── villa-placeholder.jpg
│   └── fonts/                    # Cormorant Garamond + Inter
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_functions.sql
│   │   └── 004_seed_data.sql     # Dev seed data
│   ├── seed.sql
│   └── config.toml
│
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── statements.spec.ts
│   │   └── tax-documents.spec.ts
│   └── unit/
│       └── calculations.test.ts
│
└── docs/
    ├── DEPLOYMENT.md
    ├── DATABASE.md
    └── CONTRIBUTING.md
```

### Design system

**Theme name:** "Wellness Bali"

**Color palette** (define в Tailwind config):
```typescript
// tailwind.config.ts
colors: {
  taksu: {
    forest: '#2C3E2C',       // Deep forest — text dark
    jungle: '#4A6B3A',       // Primary green — buttons, accents
    sage: '#6B7B6B',         // Muted green — secondary text
    sand: '#D4C5A0',         // Rice straw — secondary backgrounds
    terracotta: '#B85C38',   // Bali earth — alerts, highlights
    cream: '#FAF8F3',        // Off-white — main background
    parchment: '#F2EDE0',    // Card backgrounds
    bamboo: '#A8B89E',       // Subtle accent
  }
}
```

**Typography:**
- Headings: Cormorant Garamond (serif, boutique)
- Body: Inter (clean, readable)
- Numbers/monetary: Inter Tabular Numbers

**Spacing:** Standard Tailwind scale, prefer generous padding (p-6 default, p-8 for cards)

**Border radius:** Soft (rounded-lg для cards, rounded-md для inputs)

**Shadows:** Subtle (shadow-sm default, shadow-md для elevated cards)

---

## 3. DATABASE SCHEMA

### Supabase migrations (Phase 1 will create these)

```sql
-- supabase/migrations/001_initial_schema.sql

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
  
  -- Auth (synced с Supabase Auth)
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
  internal_code TEXT UNIQUE NOT NULL,  -- "T2BR-04"
  display_name TEXT NOT NULL,           -- "Taksu Bambu Villa"
  
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
  
  -- Guest (anonymized для investor view)
  guest_full_name TEXT NOT NULL,  -- shown to admin only
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
  guest_email TEXT,  -- shown to admin only
  guest_phone TEXT,  -- shown to admin only
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
  category TEXT NOT NULL,  -- 'housekeeping_salary', 'utilities', etc.
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

-- ========== REQUEST COMMENTS (для thread) ==========
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
```

### RLS Policies (Phase 1)

```sql
-- supabase/migrations/002_rls_policies.sql

-- ========== ENABLE RLS ==========
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_rotation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_portal_audit ENABLE ROW LEVEL SECURITY;

-- ========== HELPER FUNCTION ==========
CREATE OR REPLACE FUNCTION current_owner_id()
RETURNS UUID AS $$
  SELECT id FROM owners WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ========== OWNERS POLICIES ==========
CREATE POLICY "owners_view_own"
  ON owners FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "owners_update_own"
  ON owners FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ========== VILLAS POLICIES ==========
CREATE POLICY "villas_view_owned"
  ON villas FOR SELECT
  USING (owner_id = current_owner_id());

-- ========== BOOKINGS POLICIES ==========
-- Owners see bookings для their villas (с anonymized guest)
CREATE POLICY "bookings_view_own_villa"
  ON bookings FOR SELECT
  USING (villa_id IN (
    SELECT id FROM villas WHERE owner_id = current_owner_id()
  ));

-- ========== STATEMENTS POLICIES ==========
CREATE POLICY "statements_view_own"
  ON monthly_statements FOR SELECT
  USING (
    owner_id = current_owner_id()
    AND status IN ('sent_to_owner', 'paid', 'disputed')
  );

-- ========== EXPENSES POLICIES ==========
CREATE POLICY "expenses_view_own_villa"
  ON operating_expenses FOR SELECT
  USING (villa_id IN (
    SELECT id FROM villas WHERE owner_id = current_owner_id()
  ));

-- ========== REQUESTS POLICIES ==========
CREATE POLICY "requests_view_own"
  ON owner_requests FOR SELECT
  USING (owner_id = current_owner_id());

CREATE POLICY "requests_create_own"
  ON owner_requests FOR INSERT
  WITH CHECK (owner_id = current_owner_id());

CREATE POLICY "requests_update_own"
  ON owner_requests FOR UPDATE
  USING (
    owner_id = current_owner_id()
    AND status IN ('pending', 'in_review')
  );

-- ========== REQUEST COMMENTS POLICIES ==========
CREATE POLICY "comments_view_own_requests"
  ON request_comments FOR SELECT
  USING (request_id IN (
    SELECT id FROM owner_requests WHERE owner_id = current_owner_id()
  ));

CREATE POLICY "comments_create_own_requests"
  ON request_comments FOR INSERT
  WITH CHECK (
    author_type = 'owner'
    AND request_id IN (
      SELECT id FROM owner_requests WHERE owner_id = current_owner_id()
    )
  );

-- ========== DOCUMENTS POLICIES ==========
CREATE POLICY "documents_view_own"
  ON owner_documents FOR SELECT
  USING (
    owner_id = current_owner_id()
    AND visible_to_owner = TRUE
  );

-- ========== POOL STATE POLICIES ==========
CREATE POLICY "pool_state_view_own"
  ON pool_rotation_state FOR SELECT
  USING (villa_id IN (
    SELECT id FROM villas WHERE owner_id = current_owner_id()
  ));

-- ========== AUDIT POLICIES ==========
CREATE POLICY "audit_view_own"
  ON owner_portal_audit FOR SELECT
  USING (owner_id = current_owner_id());
```

### Calculated views & functions

```sql
-- supabase/migrations/003_functions.sql

-- ========== ANONYMIZED BOOKING VIEW (для investor) ==========
CREATE VIEW v_bookings_anonymized AS
SELECT 
  id,
  villa_id,
  pool_id,
  check_in_date,
  check_out_date,
  nights,
  guest_initials,
  guest_country,
  guests_count,
  channel,
  total_paid_by_guest_usd,
  channel_commission_usd,
  phr_tax_usd,
  net_to_villa_usd,
  status,
  booked_at,
  -- Hide: full name, email, phone
  NULL::text AS guest_full_name,
  NULL::text AS guest_email,
  NULL::text AS guest_phone
FROM bookings;

GRANT SELECT ON v_bookings_anonymized TO authenticated;

-- ========== DASHBOARD SUMMARY FUNCTION ==========
CREATE OR REPLACE FUNCTION get_owner_dashboard(p_owner_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_villa_id UUID;
  v_current_month DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
  -- Get owner's villa (assuming one villa per owner для MVP)
  SELECT id INTO v_villa_id FROM villas WHERE owner_id = p_owner_id LIMIT 1;
  
  SELECT json_build_object(
    'current_month', (
      SELECT json_build_object(
        'period', v_current_month,
        'occupancy_rate', COALESCE(occupancy_rate, 0),
        'gross_revenue', COALESCE(gross_revenue_usd, 0),
        'owner_net_payout', COALESCE(owner_net_payout_usd, 0),
        'payout_scheduled_at', payment_scheduled_at
      )
      FROM monthly_statements
      WHERE villa_id = v_villa_id
        AND billing_month = v_current_month - INTERVAL '1 month'
      LIMIT 1
    ),
    'ytd', (
      SELECT json_build_object(
        'gross_revenue', COALESCE(SUM(gross_revenue_usd), 0),
        'owner_net_payout', COALESCE(SUM(owner_net_payout_usd), 0),
        'statements_count', COUNT(*)
      )
      FROM monthly_statements
      WHERE owner_id = p_owner_id
        AND billing_month >= DATE_TRUNC('year', CURRENT_DATE)
    ),
    'dgt1_alert', (
      SELECT json_build_object(
        'status', dgt1_status,
        'valid_until', dgt1_valid_until,
        'days_to_expire', CASE 
          WHEN dgt1_valid_until IS NOT NULL 
          THEN dgt1_valid_until - CURRENT_DATE 
          ELSE NULL 
        END,
        'current_rate', pph26_effective_rate,
        'savings_if_renewed', CASE 
          WHEN pph26_effective_rate = 0.20 THEN
            COALESCE((SELECT AVG(gross_revenue_usd) * 0.10 FROM monthly_statements 
                      WHERE owner_id = p_owner_id 
                      AND billing_month >= CURRENT_DATE - INTERVAL '3 months'), 0)
          ELSE 0
        END
      )
      FROM owners
      WHERE id = p_owner_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Seed data для development

```sql
-- supabase/migrations/004_seed_data.sql
-- Run this only in development (not production)

-- Create test owner
INSERT INTO owners (
  id, email, full_name, passport_number, passport_country,
  country_of_residence, tax_residency_country,
  dgt1_status, dgt1_valid_until, pph26_effective_rate,
  bank_name, bank_account_iban, payout_currency,
  status
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'test.investor@example.com',
  'John Smith',
  'AB1234567',
  'Germany',
  'Germany',
  'Germany',
  'valid',
  '2026-12-31',
  0.10,
  'Deutsche Bank',
  'DE89370400440532013000',
  'EUR',
  'active'
);

-- Create pool
INSERT INTO pools (id, name, villa_type) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '2BR Garden View Pool',
  '2br'
);

-- Create villa
INSERT INTO villas (
  id, internal_code, display_name, villa_type, bedrooms, bathrooms,
  max_guests, has_private_pool, view_type, square_meters,
  phase, ownership_type, owner_id, pool_id,
  base_price_usd, premium_multiplier,
  estimated_market_value_usd, status
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'T2BR-04',
  'Taksu Bambu Villa',
  '2br', 2, 2, 4, TRUE, 'garden', 120,
  1, 'investor_owned',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  185.00, 0.05, 210000.00,
  'active'
);

-- Create sample bookings for past 3 months
INSERT INTO bookings (
  villa_id, hostaway_reservation_id, check_in_date, check_out_date,
  guest_full_name, guest_country, guests_count,
  channel, total_paid_by_guest_usd, channel_commission_usd, phr_tax_usd,
  status, booked_at
) VALUES
('33333333-3333-3333-3333-333333333333', 'HOSTAWAY-001', '2026-08-01', '2026-08-05', 'Maria Schmidt', 'Germany', 2, 'airbnb', 740, 22, 74, 'completed', '2026-07-15'),
('33333333-3333-3333-3333-333333333333', 'HOSTAWAY-002', '2026-08-10', '2026-08-15', 'James Brown', 'Australia', 4, 'booking', 925, 158, 93, 'completed', '2026-07-20'),
('33333333-3333-3333-3333-333333333333', 'HOSTAWAY-003', '2026-08-15', '2026-08-20', 'Hans Mueller', 'Germany', 2, 'booking', 925, 158, 93, 'completed', '2026-07-25'),
('33333333-3333-3333-3333-333333333333', 'HOSTAWAY-004', '2026-08-25', '2026-08-29', 'Sofia Rossi', 'Italy', 2, 'airbnb', 740, 22, 74, 'completed', '2026-08-10');

-- Create sample monthly statement (August 2026)
INSERT INTO monthly_statements (
  villa_id, owner_id, billing_month,
  gross_revenue_usd, revenue_by_channel,
  channel_commission_usd, phr_tax_usd, net_revenue_usd,
  total_opex_usd, opex_breakdown,
  net_profit_usd, management_fee_usd, management_fee_rate,
  owner_gross_payout_usd, pph26_rate, pph26_amount_usd,
  owner_net_payout_usd,
  bookings_count, occupied_nights, available_nights, occupancy_rate,
  adr_usd, revpar_usd,
  status, payment_scheduled_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '2026-08-01',
  3330.00,
  '{"airbnb": 1480, "booking": 1850}'::jsonb,
  360.00, 333.00, 2637.00,
  728.00,
  '{
    "housekeeping": {"amount": 215, "items": 5},
    "linens": {"amount": 72, "items": 3},
    "utilities": {"amount": 185, "items": 3},
    "pool_maintenance": {"amount": 48, "items": 4},
    "garden": {"amount": 35, "items": 1},
    "welcome_basket": {"amount": 75, "items": 5},
    "supplies": {"amount": 58, "items": 2},
    "allocated_staff": {"amount": 40, "items": 1}
  }'::jsonb,
  1909.00, 381.80, 0.20,
  1527.20, 0.10, 152.72,
  1374.48,
  4, 19, 31, 0.6129,
  175.26, 107.40,
  'sent_to_owner',
  '2026-09-15'
);
```

---

## 4. ENVIRONMENT VARIABLES

```bash
# .env.example (commit to repo)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-only, NEVER expose

# Resend (email)
RESEND_API_KEY=
EMAIL_FROM=portal@taksuliving.com

# App
NEXT_PUBLIC_APP_URL=https://portal.taksuliving.com
NEXT_PUBLIC_APP_NAME="Taksu Living Owner Portal"

# Security
SESSION_SECRET=                      # 32+ random chars
RE_AUTH_TIMEOUT_MINUTES=15           # для sensitive actions

# Features flags
NEXT_PUBLIC_FEATURE_AI_CHAT=false    # Phase 2
NEXT_PUBLIC_FEATURE_2FA=false        # Phase 2

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

---

## 5. DEVELOPMENT PHASES

> **For Claude Code: Execute these phases sequentially. After each phase, verify acceptance criteria before moving to next.**

### Phase 1: Foundation Setup (Week 1)

**Goal:** Working Next.js project с Supabase, auth, и базовой layout.

**Tasks:**

1. **Initialize project**
   ```bash
   pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
   pnpm add @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers
   pnpm add date-fns lucide-react clsx tailwind-merge
   pnpm dlx shadcn-ui@latest init
   ```

2. **Configure Tailwind с Wellness Bali theme**
   - Add custom colors к `tailwind.config.ts`
   - Add custom fonts (Cormorant Garamond + Inter)
   - Define spacing, shadows, radius

3. **Setup Supabase project**
   - Create Supabase project
   - Run migration 001 (schema)
   - Run migration 002 (RLS)
   - Run migration 003 (functions)
   - Run migration 004 (seed data в dev only)
   - Generate TypeScript types: `pnpm dlx supabase gen types typescript --project-id YOUR_ID > lib/supabase/types.ts`

4. **Supabase client setup**
   - `lib/supabase/client.ts` (browser)
   - `lib/supabase/server.ts` (server)
   - `lib/supabase/middleware.ts` (session refresh)
   - Middleware для protected routes

5. **Install shadcn/ui base components**
   ```bash
   pnpm dlx shadcn-ui@latest add button card input label form
   pnpm dlx shadcn-ui@latest add dialog dropdown-menu sheet
   pnpm dlx shadcn-ui@latest add table badge alert toast
   pnpm dlx shadcn-ui@latest add tabs select calendar
   ```

6. **Create base layouts**
   - `app/layout.tsx` (root с fonts)
   - `app/(auth)/layout.tsx` (auth pages — centered, image bg)
   - `app/(portal)/layout.tsx` (с sidebar + header)
   - Portal sidebar component
   - Portal header component

**Acceptance Criteria:**
- ✅ Project runs (`pnpm dev`)
- ✅ Supabase connection works
- ✅ Tailwind Wellness Bali theme applied
- ✅ Base layouts rendered
- ✅ Protected routes redirect к /login
- ✅ TypeScript strict mode enabled
- ✅ No console errors

---

### Phase 2: Authentication (Week 2)

**Goal:** Working login flow с session management.

**Tasks:**

1. **Login page** (`app/(auth)/login/page.tsx`)
   - Email + password form
   - "Remember me" checkbox (30 days)
   - "Forgot password" link
   - Error handling
   - Validation с Zod
   - Loading states

2. **Auth actions** (`lib/auth/actions.ts`)
   - `signIn(email, password, rememberMe)` server action
   - `signOut()` server action
   - `resetPasswordRequest(email)` server action
   - `updatePassword(token, newPassword)` server action

3. **Session management**
   - 60-minute idle timeout
   - 30-day max session с "remember me"
   - Auto-refresh tokens
   - Last activity tracking

4. **Reset password flow**
   - `/reset-password` request page
   - Email template (Resend)
   - `/reset-password/confirm` page

5. **Setup account flow** (для invitation)
   - `/setup-account?token=xxx` page
   - Verify invitation token
   - Set password
   - Redirect к dashboard

6. **Re-auth для sensitive actions**
   - Reusable `<ReAuthDialog>` component
   - Server action `verifyReAuth(password)`
   - Use when: banking changes, DGT-1 upload, bulk download

7. **Audit logging**
   - Log every login/logout/failed attempt
   - Include IP, user agent
   - Function `logAuditEvent(action, metadata)`

**Acceptance Criteria:**
- ✅ Test owner может login с seed credentials
- ✅ Wrong password shows error
- ✅ Logged-in user redirected from /login → /dashboard
- ✅ Idle 60 min auto-logout
- ✅ "Remember me" keeps session 30 days
- ✅ Reset password sends email
- ✅ Audit logs created для all auth events

---

### Phase 3: Dashboard (Week 3)

**Goal:** Main dashboard с key metrics и alerts.

**Tasks:**

1. **Dashboard page** (`app/(portal)/dashboard/page.tsx`)
   - Server Component
   - Fetch data via `get_owner_dashboard(owner_id)` RPC
   - Render layout с cards

2. **Components:**
   - `<CurrentMonthCard>` — occupancy, revenue, next payout
   - `<YtdSummary>` — annual progress
   - `<Dgt1Alert>` — conditional, shows if expiry < 90 days OR rate is 20%
   - `<PoolPositionMini>` — fair share metric
   - `<RecentBookingCard>` — latest booking (anonymized)
   - `<TaxDocumentsMini>` — quick access
   - `<PerformanceSummary>` — RevPAR/ADR/Occ vs market
   - `<RecentActivity>` — last 5-10 events

3. **Data fetching utilities**
   - `getCurrentMonthStats(ownerId)`
   - `getYtdSummary(ownerId)`
   - `getDgt1Status(ownerId)`
   - `getPoolPosition(villaId)`
   - `getLatestBookings(villaId, limit=3)`
   - `getRecentActivity(ownerId, limit=10)`

4. **Quick action buttons**
   - View statements
   - Upload DGT-1 (if needed)
   - New request

5. **Empty states**
   - No villa assigned yet
   - No statements yet (new owner)
   - DGT-1 not uploaded

**Acceptance Criteria:**
- ✅ Dashboard loads with seed data
- ✅ All cards render correctly
- ✅ DGT-1 alert shows only when relevant
- ✅ Numbers are formatted as currency
- ✅ Mobile responsive (test 375px width)
- ✅ Loading states работают
- ✅ No data flickering (use Suspense)

---

### Phase 4: Statements (Week 4-5)

**Goal:** View statements list, detail с full breakdown, download PDF/Excel.

**Tasks:**

1. **Statements list page** (`app/(portal)/statements/page.tsx`)
   - Server Component с pagination
   - Table со columns: period, gross revenue, owner net, status
   - Filter by year, status
   - Sort by date
   - Click row → detail page

2. **Statement detail page** (`app/(portal)/statements/[id]/page.tsx`)
   - Full financial breakdown (see wireframe в spec)
   - Expandable expense categories
   - Receipt viewer modal (click to see photos)
   - Download buttons (PDF, Excel, Bukti Potong)

3. **Calculations module** (`lib/calculations/statement-calc.ts`)
   ```typescript
   export function calculateStatement(input: {
     bookings: Booking[];
     expenses: OperatingExpense[];
     channelCommissions: ChannelCommissions;
     phrRate: number;
     managementFeeRate: number;
     pph26Rate: number;
     daysInMonth: number;
   }): StatementCalculation {
     // ... все вычисления
   }
   ```

4. **PDF generation** (`lib/pdf/statement-pdf.tsx`)
   - React-PDF templates
   - Multi-page layout (см. wireframe в spec)
   - Tagged with PT logo, NPWP, contact
   - English only

5. **Excel export** (`lib/excel/statement-excel.ts`)
   - Multi-sheet workbook
   - Sheets: Summary, Bookings, Revenue, Expenses, Calculations
   - Formatting (currency, dates)

6. **Bukti Potong PDF** (`lib/pdf/bukti-potong-pdf.tsx`)
   - Official DGT format
   - Bilingual labels (ID/EN)

7. **API routes**
   - `GET /api/statements?limit&offset&year`
   - `GET /api/statements/:id`
   - `GET /api/statements/:id/pdf` — generate on-demand or serve cached
   - `GET /api/statements/:id/excel`
   - `GET /api/statements/:id/bukti-potong/pdf`

**Acceptance Criteria:**
- ✅ Statements list shows seed data
- ✅ Statement detail shows full breakdown
- ✅ Expense categories expand с item details
- ✅ PDF download works, formats correctly
- ✅ Excel download has all sheets
- ✅ Bukti Potong PDF matches DGT format
- ✅ Re-auth required для bulk downloads (3+)
- ✅ Mobile responsive

---

### Phase 5: Calendar & Analytics (Week 6-7)

**Goal:** Booking calendar + analytics dashboard.

**Tasks:**

1. **Calendar page** (`app/(portal)/calendar/page.tsx`)
   - Month view с booking bars
   - Color-coded by channel
   - Click booking → modal с details (anonymized)
   - Month navigation
   - Today highlight

2. **Calendar components:**
   - `<MonthCalendar>` — main grid
   - `<BookingEvent>` — booking bar overlay
   - `<BookingModal>` — detail popup
   - `<ChannelLegend>` — color key

3. **Analytics page** (`app/(portal)/analytics/page.tsx`)
   - Period selector (12m, YTD, year, custom)
   - Revenue trend chart (line)
   - KPI tiles (RevPAR, ADR, Occupancy)
   - Market benchmark comparison
   - Channel mix breakdown (donut/bar)
   - Seasonality view (heatmap или bars)

4. **Analytics calculations** (`lib/calculations/analytics-calc.ts`)
   ```typescript
   export function calculateAnalytics(input: {
     statements: MonthlyStatement[];
     period: 'ytd' | '12m' | 'year' | 'custom';
   }): AnalyticsData
   ```

5. **Market benchmark data** (hardcoded для MVP)
   ```typescript
   export const UBUD_MARKET_MEDIAN = {
     occupancy: 0.377,
     adr_usd: 113,
     revpar_usd: 46,
   };
   ```

**Acceptance Criteria:**
- ✅ Calendar shows seed bookings correctly
- ✅ Anonymized guest data (initials + country only)
- ✅ Analytics shows all charts
- ✅ Market benchmark comparison clear
- ✅ Period selector works
- ✅ Charts responsive
- ✅ Mobile: charts stack vertically

---

### Phase 6: Tax Documents & DGT-1 (Week 8-9)

**Goal:** Full DGT-1 workflow + bukti potong access.

**Tasks:**

1. **Tax documents page** (`app/(portal)/tax-documents/page.tsx`)
   - DGT-1 status card (current state + expiry)
   - Bukti Potong table (all historical)
   - Download buttons
   - Annual summary (if available)
   - Guide section (how to use bukti potong)

2. **DGT-1 upload flow** (`app/(portal)/tax-documents/upload-dgt1/page.tsx`)
   - Step 1: Explanation (what is DGT-1)
   - Step 2: Upload PDF (drag-drop)
   - Step 3: Enter expiry date
   - Step 4: Confirmation
   - Success page с next steps

3. **Components:**
   - `<Dgt1StatusCard>` — visual status
   - `<Dgt1UploadFlow>` — multi-step
   - `<BuktiPotongTable>` — sortable list
   - `<AnnualSummary>` — year totals

4. **Upload action**
   - Validate PDF (size, format)
   - Upload to Supabase Storage (`dgt1/{owner_id}/{filename}`)
   - Update `owners.dgt1_*` fields
   - Set status to `pending_review`
   - Notify admin (email to GM)
   - Audit log

5. **DGT-1 lifecycle**
   - Display days to expiry
   - Color-coded urgency (green > 90, yellow 30-90, red < 30)
   - Calculate "savings if renewed" estimate
   - Email reminders (will be done in background job, just UI here)

6. **Bukti potong download**
   - Re-auth required
   - Generate on-demand или serve cached
   - Mark as downloaded в audit

**Acceptance Criteria:**
- ✅ DGT-1 status correctly displayed
- ✅ Upload PDF saves to Storage
- ✅ Admin notification triggered
- ✅ All bukti potong listed
- ✅ Download with re-auth works
- ✅ Annual summary available (если year complete)
- ✅ Expiry alerts clearly visible

---

### Phase 7: Pool Position & Requests (Week 10-11)

**Goal:** Pool position visibility + requests system.

**Tasks:**

1. **Pool position page** (`app/(portal)/pool-position/page.tsx`)
   - Fair share explanation section
   - Current fair share metric (visual gauge)
   - Comparison к pool average
   - 6-month trend chart
   - Action: "Submit request" if concerns

2. **Pool components:**
   - `<FairShareExplanation>` — onboarding content
   - `<PoolPositionDetail>` — current state
   - `<RotationHistoryChart>` — trend over time

3. **Requests list page** (`app/(portal)/requests/page.tsx`)
   - List по всех requests
   - Filter by status, category
   - Status badges
   - Click → detail

4. **Request detail page** (`app/(portal)/requests/[id]/page.tsx`)
   - Original request
   - Status timeline
   - Comments thread (owner + admin)
   - Add comment
   - Close request (if status allows)

5. **New request page** (`app/(portal)/requests/new/page.tsx`)
   - Form с category select
   - Subject, description
   - Date picker (для personal stays)
   - File upload (optional)
   - Priority select
   - Submit → confirmation

6. **Comment thread**
   - `<RequestComments>` component
   - Real-time updates через Supabase Realtime
   - Show admin vs owner clearly

**Acceptance Criteria:**
- ✅ Pool position displays correctly
- ✅ Fair share explanation clear
- ✅ Trend chart loads
- ✅ Can submit new request
- ✅ Request appears in list immediately
- ✅ Can add comments
- ✅ Real-time updates work
- ✅ Email notifications для admin (mock в MVP)

---

### Phase 8: Settings & Polish (Week 12)

**Goal:** Profile/settings + final polish + production launch prep.

**Tasks:**

1. **Settings pages:**
   - `/settings` — profile overview
   - `/settings/banking` — wire details (re-auth required)
   - `/settings/notifications` — email preferences

2. **Profile page**
   - Display: name, email, country, language
   - Edit (limited fields)
   - View villa details (read-only)
   - View contract status
   - Last login info

3. **Banking page**
   - Display current banking (masked)
   - Edit form (re-auth required)
   - Change history (audit)
   - Important warnings

4. **Notifications page**
   - Email toggles по типам
   - Save preferences

5. **Polish tasks:**
   - Error boundaries
   - 404 page
   - Loading states everywhere
   - Empty states (no statements yet, no requests, etc.)
   - Mobile responsiveness final check
   - Accessibility (keyboard nav, ARIA labels)
   - Performance optimization (image optimization, code splitting)

6. **Email templates** (`lib/email/templates/`)
   - Welcome email
   - Statement ready
   - DGT-1 expiry warning
   - Request update
   - Banking changed notification (security)

7. **Documentation:**
   - Update README с deployment instructions
   - Document environment variables
   - Architecture decisions
   - Contributing guide

8. **Testing:**
   - E2E tests для critical paths (auth, statement download, request creation)
   - Manual testing on mobile devices
   - Performance audit (Lighthouse)

9. **Deployment:**
   - Vercel project setup
   - Environment variables configured
   - Domain pointed (portal.taksuliving.com)
   - Sentry error monitoring
   - Posthog analytics
   - Production database connected

**Acceptance Criteria:**
- ✅ All settings pages work
- ✅ Banking change requires re-auth
- ✅ All emails sent correctly
- ✅ No console errors
- ✅ Lighthouse score: Performance > 85, Accessibility > 90
- ✅ Mobile responsive on all screens
- ✅ Production deployment successful
- ✅ Sentry catches errors
- ✅ Posthog tracks events

---

## 6. CODING STANDARDS

### TypeScript

- **Strict mode enabled** (no `any` without justification)
- **Explicit return types** для public functions
- **Use Zod for runtime validation** at boundaries (API routes, forms)
- **Branded types** для IDs: `type OwnerId = string & { __brand: 'OwnerId' }`

### React/Next.js

- **Default to Server Components** (only use `'use client'` when needed)
- **Server Actions** for mutations (preferred over API routes for simple cases)
- **Suspense boundaries** для loading states
- **Error boundaries** для error handling
- **No useEffect for data fetching** — use server-side fetching

### Database

- **Always use RLS** — never bypass with service role в user-facing code
- **Use prepared queries** — no string concatenation
- **Transactions** для multi-step operations
- **Indexes** на all WHERE/ORDER BY columns

### Code style

- **Prettier + ESLint** — auto-format on save
- **2-space indentation**
- **Single quotes** для strings
- **Trailing commas** в multi-line
- **camelCase** для variables/functions, **PascalCase** для components/types
- **kebab-case** для files
- **Conventional commits** (`feat:`, `fix:`, `docs:`, etc.)

### Security

- **Never log secrets** (passwords, tokens, full credit cards)
- **Sanitize all user input** (Zod validation)
- **Use parameterized queries**
- **CSRF protection** (Next.js Server Actions handle this)
- **Rate limiting** на API routes (Vercel built-in or upstash)

---

## 7. TESTING STRATEGY

### Unit tests (where critical)

```typescript
// tests/unit/calculations.test.ts
import { calculateStatement } from '@/lib/calculations/statement-calc';

describe('calculateStatement', () => {
  it('correctly calculates net profit and management fee', () => {
    const result = calculateStatement({
      bookings: [...],
      expenses: [...],
      channelCommissions: { airbnb: 0.03, booking: 0.17 },
      phrRate: 0.10,
      managementFeeRate: 0.20,
      pph26Rate: 0.10,
      daysInMonth: 31,
    });
    
    expect(result.grossRevenue).toBe(3330);
    expect(result.managementFee).toBeCloseTo(381.80, 2);
    expect(result.ownerNetPayout).toBeCloseTo(1374.48, 2);
  });
});
```

**What to unit test:**
- Statement calculations
- PPh 26 rate selection by country
- Date utilities
- Currency formatting

**What NOT to unit test:**
- React components (use E2E instead)
- Simple CRUD
- Third-party libraries

### E2E tests (critical user paths)

```typescript
// tests/e2e/auth.spec.ts (using Playwright)
test('owner can login and view dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'test.investor@example.com');
  await page.fill('[name=password]', 'TestPassword123!');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Taksu Bambu Villa')).toBeVisible();
});
```

**Critical E2E paths to test:**
- Login flow (success + failure)
- Statement download (PDF)
- DGT-1 upload
- New request creation
- Banking change (с re-auth)

---

## 8. DEPLOYMENT

### Pre-deployment checklist

- [ ] All environment variables в Vercel
- [ ] Supabase production database migrated
- [ ] RLS policies applied
- [ ] Test owner created
- [ ] Domain DNS configured (portal.taksuliving.com → Vercel)
- [ ] SSL certificate auto-provisioned
- [ ] Sentry project created, DSN added
- [ ] Posthog project created, key added
- [ ] Resend API key valid, sender verified
- [ ] Email templates tested
- [ ] PDF generation tested in production
- [ ] Mobile tested на real devices

### Deployment commands

```bash
# First deployment
vercel link
vercel env pull .env.local
vercel deploy --prod

# Subsequent deployments
git push main  # auto-deploys via Vercel GitHub integration
```

### Post-deployment verification

1. Visit https://portal.taksuliving.com
2. Login с test credentials
3. Verify dashboard loads
4. Download a statement PDF
5. Submit a request
6. Check audit logs в Supabase
7. Verify email arrives (statement notification)
8. Check Sentry для errors
9. Check Posthog для events

---

## 9. POST-LAUNCH SUPPORT

### Monitoring

- **Sentry:** Real-time error alerts
- **Posthog:** User behavior analytics
- **Supabase Dashboard:** Database performance, query analysis
- **Vercel Analytics:** Page load times, Web Vitals

### Maintenance schedule

- **Daily:** Check error rates, slow queries
- **Weekly:** Review usage metrics, owner feedback
- **Monthly:** Performance audit, security review
- **Quarterly:** Feature additions based на feedback

### Known limitations (Phase 1)

- English only (RU coming in Phase 2)
- Web only (mobile apps in Phase 2)
- No 2FA (optional Phase 2)
- No real-time notifications (Phase 2)
- No in-app messaging (Phase 2)
- Manual statement approval by admin (auto-approve в Phase 2 если metrics OK)

---

## 10. QUICK START FOR CLAUDE CODE

When starting this project с Claude Code, paste this prompt:

```
I'm building an Owner Portal MVP for PT Taksu Living Management 
(boutique villa management company in Bali). I have a complete 
technical specification.

I'll share the spec in sections. Read it carefully, ask clarifying 
questions if needed, then we'll execute it phase by phase.

The spec is organized into 8 sequential phases over ~12 weeks of dev work.

For each phase:
1. You read the phase tasks
2. Plan the implementation
3. Execute step by step
4. Verify acceptance criteria
5. Commit changes
6. Move to next phase

Stack: Next.js 14 App Router, TypeScript, Supabase, Tailwind, shadcn/ui.

Ready? Let me share the spec.
```

Then paste sections of this document as needed (start с Sections 0-3 для context, then per-phase as you execute).

### Per-phase prompt template

```
Phase {N}: {Phase Name}

Read Phase {N} tasks from spec. Plan implementation, then execute.

Constraints:
- Use exactly the stack specified
- Follow coding standards in Section 6
- Write tests where indicated
- Verify all acceptance criteria before moving on

Start with planning.
```

---

## 11. APPENDIX: DTA RATES FOR PPh 26

```typescript
// lib/constants/pph26-rates.ts

export const DEFAULT_PPH26_RATE = 0.20; // 20% без DGT-1

export const DTA_RATES_BY_COUNTRY: Record<string, number> = {
  // Western Europe
  'DE': 0.10,  // Germany
  'FR': 0.10,  // France
  'NL': 0.10,  // Netherlands
  'BE': 0.10,  // Belgium
  'IT': 0.15,  // Italy
  'ES': 0.10,  // Spain
  'AT': 0.10,  // Austria
  'CH': 0.10,  // Switzerland
  'SE': 0.15,  // Sweden
  'NO': 0.15,  // Norway
  'DK': 0.15,  // Denmark
  'FI': 0.15,  // Finland
  
  // UK & Ireland
  'GB': 0.15,  // United Kingdom
  'IE': 0.10,  // Ireland
  
  // North America
  'US': 0.15,  // United States
  'CA': 0.15,  // Canada
  
  // Oceania
  'AU': 0.15,  // Australia
  'NZ': 0.15,  // New Zealand
  
  // Asia
  'SG': 0.15,  // Singapore
  'HK': 0.10,  // Hong Kong
  'JP': 0.10,  // Japan
  'KR': 0.15,  // South Korea
  'CN': 0.10,  // China
  'TW': 0.15,  // Taiwan
  'MY': 0.15,  // Malaysia
  'TH': 0.15,  // Thailand
  'VN': 0.15,  // Vietnam
  
  // CIS / Russia
  'RU': 0.15,  // Russia (verify current status)
  'KZ': 0.15,  // Kazakhstan
  'BY': 0.15,  // Belarus
  'UA': 0.15,  // Ukraine
};

export function getPph26Rate(countryCode: string, hasDgt1: boolean): number {
  if (!hasDgt1) return DEFAULT_PPH26_RATE;
  return DTA_RATES_BY_COUNTRY[countryCode] ?? DEFAULT_PPH26_RATE;
}
```

---

**END OF SPECIFICATION**

When using Claude Code, refer back to specific sections by number. This document is designed to be the single source of truth for Owner Portal MVP development.

Total estimated effort: 100-200 hours over 12 weeks.
Budget: $5,000-12,000 в зависимости от freelancer rate ($30-60/hour).
