# Taksu Living Owner Portal

A secure, high-performance web-based client portal for foreign individual investors who own villas managed by **PT Taksu Living Management** in Penestanan, Ubud, Bali. The portal provides investors transparent access to financial statements, booking calendars, performance analytics, tax withholding logs, and a direct communications system.

---

## 🚀 Tech Stack & Architecture

### Frontend
- **Framework:** Next.js 15.3.3 (App Router with Server Components & React 19)
- **Language:** TypeScript (Strict mode enabled)
- **Styling:** Tailwind CSS (Custom "Wellness Bali" theme palette)
- **UI Components:** Primitive elements built with Radix UI and styled via `class-variance-authority` (shadcn/ui model)
- **State Management & Queries:** React Hooks & Server Actions
- **Forms & Validation:** React Hook Form + Zod validation
- **Data Visualization:** Recharts (Revenue trend, occupancy seasonality, booking channels)
- **Data Tables:** TanStack Table v8 (`@tanstack/react-table`)
- **Date Utilities:** `date-fns`

### Backend & Infrastructure
- **Server Environment:** Next.js Server Actions & API Routes
- **Database & Auth:** Supabase (PostgreSQL + Auth + Storage)
- **Supabase Wrapper:** Client/Server handlers powered by `@supabase/ssr`
- **Document Generation:**
  - PDF: `@react-pdf/renderer` (on-the-fly statement and tax receipt generation)
  - Excel: `exceljs` (dynamic multi-sheet financial workbook exports)
- **Email Delivery:** Resend transactional mail client (welcomes, statements, tax expiry)

---

## 📂 Project Structure

```
taksu-owner-portal/
├── app/                            # Next.js App Router root
│   ├── (auth)/                     # Non-authenticated routes (login, reset password)
│   ├── (portal)/                   # Authenticated dashboard, statements, analytics, tax, etc.
│   └── api/                        # REST & document generation API endpoints
├── components/                     # Shared and modular UI components
│   ├── auth/                       # Credentials, reset forms, re-auth dialogs
│   ├── layout/                     # Portal navigation sidebar, header, user menus
│   ├── dashboard/                  # KPI panels, alerts, quick-action widgets
│   ├── statements/                 # Expense breakdowns, receipt viewers, statements lists
│   ├── calendar/                   # Monthly calendar views & booking models
│   ├── analytics/                  # Performance trends, market benchmarks
│   ├── pool/                       # Algorithm details, rotation metrics
│   ├── tax/                        # DGT-1 status trackers, Bukti Potong tables
│   ├── requests/                   # Ticketing and comment threads
│   └── ui/                         # Base Radix / utility components
├── lib/                            # Application utility core
│   ├── actions/                    # Next.js Server Actions (DGT-1 upload, requests)
│   ├── auth/                       # Session handling and auth middleware
│   ├── calculations/               # Core business algorithms (Tax rates, ADR, RevPAR, Pools)
│   ├── constants/                  # Country directories, tax rates, static configurations
│   ├── data/                       # Database fetching and aggregation layers
│   ├── excel/                      # Excel workbook generator scripts
│   ├── pdf/                        # PDF document styling templates
│   ├── supabase/                   # Supabase client instantiation files
│   └── utils/                      # Helper tools (currency/date formatters, clsx utility)
├── supabase/                       # Local database migrations & seed scripts
│   └── migrations/                 # PostgreSQL migrations (001-004)
├── package.json                    # Dependencies & npm scripts
├── tailwind.config.ts              # Custom Wellness Bali design palette
└── tsconfig.json                   # TypeScript configuration
```

---

## 🗃️ Database Schema & Migrations

The database layer is managed through PostgreSQL inside Supabase. Migrations are organized as follows:

1. **`001_initial_schema.sql`**: Configures PostgreSQL extensions (`uuid-ossp`, `pgcrypto`), defines application enums (status variables, categories, payout currencies), and sets up primary tables:
   - `owners`: Profile data, tax residency info, DGT-1 document states, and banking credentials.
   - `pools`: Definitions for groups of identical/comparable villas.
   - `villas`: Technical metadata, ownership references, and Hostaway listing integrations.
   - `bookings`: Reservation dates, anonymized guest initials, channels (Airbnb, Booking.com, etc.), and financial values.
   - `monthly_statements`: Monthly aggregations of gross revenues, commissions, opex, management fees, and withheld taxes.
   - `operating_expenses`: Invoices, receipts, and costs associated with villa maintenance.
   - `owner_requests` & `request_comments`: Ticketing module enabling communication between owners and administrators.
   - `owner_documents`: General file uploads (agreements, licenses).
   - `pool_rotation_state`: Cached values representing pool performance and sharing metrics.
2. **`002_rls_policies.sql`**: Implements **Row-Level Security (RLS)**. Investors can only select, insert, or update records directly referencing their owned properties or profiles.
3. **`003_functions.sql`**: Custom database functions and triggers, including auto-updating `updated_at` timestamps, login metrics, and backend calculations.
4. **`004_seed_data.sql`**: Generates demo accounts, mock properties, bookings, statements, and expenses to enable a functional sandbox environment.

---

## ⚙️ Business Logic Highlights

### 1. PPh 26 Tax Withholding
Indonesian tax law requires Indonesian PT entities (like Taksu Living) to withhold **PPh 26 withholding tax** before distributing profits to foreign individuals. 
- **Default rate:** 20% of the gross payout.
- **DTA Exception:** If a valid **DGT-1** tax treaty form is uploaded and approved, the tax rate is adjusted according to the Double Taxation Agreement (DTA) of the owner's residency country (often reduced to 10%).
- The system automatically triggers warnings when DGT-1 forms approach expiration (monitored in `<Dgt1StatusCard>`).

### 2. Fair Share Pool Allocation
For identical properties grouped into rental pools, bookings are allocated based on a rotation score to ensure fair revenue distribution.
- Metrics are tracked in `pool_rotation_state` (incorporating 90-day revenue and nights booked).
- Details and visual transparency are displayed in the `/pool-position` section.

### 3. Document Access & Security
- **Sensitive Operations:** Modifying bank accounts or executing bulk PDF downloads (3+) requires verification via a secure re-authentication workflow (`<ReauthDialog>`).
- **Anonymization:** Guest data displayed on calendars is anonymized (displaying guest country and initials only) to maintain GDPR and privacy compliance for owners, while retaining transaction validity.

---

## 🛠️ Local Development & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) package manager
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, for local DB development)

### Step 1: Install Dependencies
Clone the repository and install packages:
```bash
pnpm install
```

### Step 2: Set Up Environment Variables
Copy the environment variables template and configure it with your credentials:
```bash
cp .env.example .env.local
```
Fill out the variables inside `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be obtained from your Supabase Dashboard under Project Settings -> API.
- `SUPABASE_SERVICE_ROLE_KEY` is required on the server for secure operations.
- `RESEND_API_KEY` is needed if you want email verification, reminders, and alerts to fire.

### Step 3: Seed the Database
Apply migrations to your Supabase instance:
- **Using Supabase Dashboard:** Copy and run the SQL scripts located inside [supabase/migrations/](file:///d:/SyncV2/taksu-owner-portal/supabase/migrations/) sequentially (001, 002, 003, and then 004).
- **Using Supabase CLI:**
  ```bash
  supabase link --project-ref your-project-ref
  supabase db push
  ```

### Step 4: Run the Development Server
Launch the local Next.js dev server:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 📜 Available Scripts

- `pnpm dev`: Runs the development server.
- `pnpm build`: Bundles the application for production.
- `pnpm start`: Starts the production build.
- `pnpm lint`: Checks the codebase for linting errors using ESLint.
- `pnpm format`: Formats code files using Prettier.
- `pnpm type-check`: Runs TypeScript compiler check without emitting output.

---

## 🎨 Theme & Styling System

The portal utilizes a custom design theme named **"Wellness Bali"**, representing the tropical aesthetic of Ubud. The color palette tokens configured in `tailwind.config.ts` are:

| Token | Hex Code | Description |
| :--- | :--- | :--- |
| `taksu-forest` | `#2C3E2C` | Deep forest green for main headers & typography |
| `taksu-jungle` | `#4A6B3A` | Rich primary green for buttons and active states |
| `taksu-sage` | `#6B7B6B` | Muted secondary text elements |
| `taksu-sand` | `#D4C5A0` | Straw beige accents & boundaries |
| `taksu-terracotta`| `#B85C38` | Bali earth accent color for alert signals and badges |
| `taksu-cream` | `#FAF8F3` | Primary application backgrounds |
| `taksu-parchment`| `#F2EDE0` | Warm secondary surfaces & card containers |
| `taksu-bamboo` | `#A8B89E` | Soft borders and highlights |
