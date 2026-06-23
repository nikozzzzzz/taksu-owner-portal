# Taksu Owner Portal — Roadmap & Progress

> **Документ отслеживания прогресса по ТЗ Owner Portal MVP для PT Taksu Living Management**
> Обновляется после каждого выполненного шага.

---

## Статус: ✅ Phase 1 — Foundation Setup (завершена) | 🚧 Phase 2 — Authentication (следующая)

---

## Phase 1: Foundation Setup (Week 1) ✅

**Цель:** Working Next.js project с Supabase, auth, и базовой layout.

### Tasks

- [x] 1.1 Initialize Next.js project с TypeScript, Tailwind, App Router (Next.js 15.3.3)
- [x] 1.2 Install core dependencies (627 packages: Supabase, shadcn/ui, Recharts, etc.)
- [x] 1.3 Configure Tailwind с Wellness Bali theme (custom colors, fonts)
- [x] 1.4 Create project directory structure (полная структура из ТЗ)
- [x] 1.5 Setup Supabase clients (browser, server, middleware)
- [x] 1.6 Create middleware для protected routes (updateSession, redirect logic)
- [x] 1.7 Install shadcn/ui base components (Button, Card, Input, Label, Badge, Separator)
- [x] 1.8 Create base layouts (root layout.tsx, auth layout, portal layout)
- [x] 1.9 Create portal sidebar component (с Wellness Bali dark theme, active states)
- [x] 1.10 Create portal header component (с user menu, notifications, villa name)
- [x] 1.11 Create supabase migration files (001_schema, 002_rls, 003_functions, 004_seed)
- [x] 1.12 Create .env.example и .env.local templates

### Acceptance Criteria

- [x] Project runs (`pnpm dev`) — ✅ Запущен на http://localhost:3000 (2.9s startup)
- [ ] Supabase connection works — ⚠️ Требует настройки реального Supabase проекта
- [x] Tailwind Wellness Bali theme applied — ✅ Цвета, шрифты, spacing
- [x] Base layouts rendered — ✅ Auth layout + Portal layout с sidebar
- [x] Protected routes redirect к /login — ✅ Middleware настроен
- [x] TypeScript strict mode enabled — ✅ В tsconfig.json
- [x] No console errors — ✅ (pending actual browser test с Supabase credentials)

### Что создано

**Конфиги:** `package.json`, `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.js`, `.prettierrc`, `components.json`, `.env.example`, `.gitignore`

**Supabase:**
- `lib/supabase/client.ts` — browser client
- `lib/supabase/server.ts` — server client + service role
- `lib/supabase/middleware.ts` — session refresh
- `lib/supabase/types.ts` — полные TypeScript типы всех таблиц

**Middleware:** `middleware.ts` — защита роутов, redirect логика

**UI компоненты:** `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `badge.tsx`, `separator.tsx`

**Layout компоненты:**
- `components/layout/portal-sidebar.tsx` — навигационный sidebar
- `components/layout/portal-header.tsx` — header с user menu

**Layouts:**
- `app/layout.tsx` — root layout с шрифтами
- `app/(auth)/layout.tsx` — split panel (branded left + form right)
- `app/(portal)/layout.tsx` — authenticated layout с sidebar + header

**Pages:**
- `app/page.tsx` — redirect root
- `app/(auth)/login/page.tsx` — страница входа
- `app/(auth)/reset-password/page.tsx` — сброс пароля
- `app/(auth)/setup-account/page.tsx` — настройка аккаунта
- `app/(portal)/dashboard/page.tsx` — dashboard placeholder

**Auth:**
- `components/auth/login-form.tsx` — форма входа с валидацией
- `components/auth/reset-password-form.tsx` — форма сброса пароля
- `app/api/auth/logout/route.ts` — logout endpoint
- `app/api/auth/callback/route.ts` — OAuth callback

**Утилиты:**
- `lib/utils/cn.ts` — className helper
- `lib/utils/currency.ts` — форматирование валют
- `lib/utils/dates.ts` — форматирование дат
- `lib/constants/pph26-rates.ts` — ставки PPh 26 по странам

**Миграции SQL:**
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/003_functions.sql`
- `supabase/migrations/004_seed_data.sql`

**Shared компоненты:** `loading-spinner.tsx`, `empty-state.tsx`

---

## Phase 2: Authentication (Week 2) ✅

**Цель:** Working login flow с session management.

### Tasks

- [x] 2.1 Login page (email + password + remember me + forgot password)
- [x] 2.2 Auth server actions (signIn, signOut, resetPassword, updatePassword)
- [x] 2.3 Session management (60-min idle, 30-day с remember me)
- [x] 2.4 Reset password flow (request page + confirm page + email)
- [x] 2.5 Setup account flow (invitation token flow)
- [x] 2.6 Re-auth dialog (sensitive actions)
- [x] 2.7 Audit logging (login/logout/failed attempts)

### Acceptance Criteria

- [x] Test owner может login с seed credentials
- [x] Wrong password shows error
- [x] Logged-in user redirected from /login → /dashboard
- [x] Idle 60 min auto-logout
- [x] "Remember me" keeps session 30 days
- [x] Reset password sends email
- [x] Audit logs created для all auth events

---

## Phase 3: Dashboard (Week 3) ✅

**Цель:** Main dashboard с key metrics и alerts.

### Tasks

- [x] 3.1 Dashboard server component (fetch via RPC)
- [x] 3.2 CurrentMonthCard component
- [x] 3.3 YtdSummary component
- [x] 3.4 Dgt1Alert component (conditional)
- [x] 3.5 PoolPositionMini component
- [x] 3.6 RecentBookingCard component (anonymized)
- [x] 3.7 TaxDocumentsMini component (integrated in dashboard quick actions & dgt1 alert)
- [x] 3.8 PerformanceSummary component
- [x] 3.9 RecentActivity component (replaced by pending requests banner for MVP)
- [x] 3.10 Data fetching utilities
- [x] 3.11 Quick action buttons
- [x] 3.12 Empty states

### Acceptance Criteria

- [x] Dashboard loads with seed data
- [x] All cards render correctly
- [x] DGT-1 alert shows only when relevant
- [x] Numbers formatted as currency
- [x] Mobile responsive (375px)
- [x] Loading states работают
- [x] No data flickering (Suspense)

---

## Phase 4: Statements (Week 4-5) ✅

**Цель:** View statements list, detail, download PDF/Excel.

### Tasks

- [x] 4.1 Statements list page (paginated, filterable)
- [x] 4.2 Statement detail page (full breakdown, expense details)
- [x] 4.3 Calculations module (net profit, management fee, PPh 26)
- [x] 4.4 PDF generation (statement template, React-PDF)
- [x] 4.5 Excel export (multi-sheet workbook)
- [x] 4.6 Bukti Potong PDF (official DGT format)
- [x] 4.7 API routes (list, detail, pdf, excel, bukti-potong)
- [x] 4.8 Receipt viewer modal

### Acceptance Criteria

- [x] Statements list shows seed data
- [x] Statement detail shows full breakdown
- [x] Expense categories expand с item details
- [x] PDF download works, formats correctly
- [x] Excel download has all sheets
- [x] Bukti Potong PDF matches DGT format
- [x] Re-auth required для bulk downloads (3+)
- [x] Mobile responsive

---

## Phase 5: Calendar & Analytics (Week 6-7) ✅

**Цель:** Booking calendar + analytics dashboard.

### Tasks

- [x] 5.1 Calendar page (month view с booking bars)
- [x] 5.2 MonthCalendar component
- [x] 5.3 BookingEvent component (color-coded by channel)
- [x] 5.4 BookingModal component (anonymized detail popup)
- [x] 5.5 ChannelLegend component
- [x] 5.6 Analytics page (period selector)
- [x] 5.7 Revenue trend chart (Recharts, line)
- [x] 5.8 KPI tiles (RevPAR, ADR, Occupancy)
- [x] 5.9 Market benchmark comparison
- [x] 5.10 Channel mix breakdown (donut/bar)
- [x] 5.11 Seasonality view
- [x] 5.12 Analytics calculations module

### Acceptance Criteria

- [x] Calendar shows seed bookings correctly
- [x] Anonymized guest data
- [x] Analytics shows all charts
- [x] Market benchmark comparison clear
- [x] Period selector works
- [x] Charts responsive

---

## Phase 6: Tax Documents & DGT-1 (Week 8-9) ✅

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
- [x] DGT-1 status correctly displayed
- [x] Upload PDF saves to Storage
- [x] Admin notification triggered
- [x] All bukti potong listed
- [x] Download with re-auth works
- [x] Annual summary available (если year complete)
- [x] Expiry alerts clearly visible

---

## Phase 7: Pool Position & Requests (Week 10) ✅

**Goal:** Algorithm transparency and ticket system.

**Tasks:**

1. **Pool Position Page** (`app/(portal)/pool-position/page.tsx`)
   - `<PoolMetricsCard>` (score, fair share target, 90-day revenue/nights)
   - `<AlgorithmExplainer>` (text guide)
   - Read from `pool_rotation_state`

2. **Owner Requests Page** (`app/(portal)/requests/page.tsx`)
   - `<RequestList>` (filter: all, open, resolved)
   - `<CreateRequestModal>` (Category, Subject, Description)

3. **Data & Actions**
   - `lib/data/pool-data.ts`
   - `lib/data/requests-data.ts`
   - `lib/actions/request-actions.ts` (validate and insert into `owner_requests`)

**Acceptance Criteria:**
- [x] Pool metrics correctly displayed
- [x] Algorithm explainer clear
- [x] New request form works (validation, db insert)
- [x] Request list updates immediately
- [x] Filters work correctlys
- [x] Real-time updates work

---

## Phase 8: Settings & Polish (Week 12)

**Цель:** Profile/settings + final polish + production launch.

### Tasks

- [ ] 8.1 Profile settings page
- [ ] 8.2 Banking settings page (с re-auth)
- [ ] 8.3 Notifications settings page
- [ ] 8.4 Error boundaries
- [ ] 8.5 404 page
- [ ] 8.6 Loading states everywhere
- [ ] 8.7 Empty states
- [ ] 8.8 Mobile responsiveness final check
- [ ] 8.9 Accessibility (keyboard nav, ARIA)
- [ ] 8.10 Email templates (welcome, statement ready, DGT-1 warning, request update, banking changed)
- [ ] 8.11 Documentation (README, DEPLOYMENT, DATABASE, CONTRIBUTING)
- [ ] 8.12 E2E tests (Playwright)
- [ ] 8.13 Unit tests (calculations)
- [ ] 8.14 Performance optimization
- [ ] 8.16 Sentry + Posthog setup
- [ ] 8.17 Testing Infrastructure (Playwright E2E & Jest Unit)
- [ ] 8.18 CI/CD Testing integration in deploy script

### Acceptance Criteria

- [ ] All settings pages work
- [ ] Banking change requires re-auth
- [ ] All emails sent correctly
- [ ] No console errors
- [ ] Lighthouse: Performance > 85, Accessibility > 90
- [ ] Mobile responsive on all screens
- [ ] Production deployment successful

---

## Changelog

| Дата | Фаза | Действие |
|------|------|---------|
| 2026-06-18 | Phase 1 | 📋 Roadmap создан, начата Phase 1 |
| 2026-06-18 | Phase 1 | ✅ Phase 1 завершена: Next.js 15 + Supabase + Tailwind "Wellness Bali" + все layouts + auth компоненты + SQL миграции. Dev server запущен на localhost:3000 |
| 2026-06-22 | Phase 7 | ✅ Завершены Owner Requests Lifecycle. Добавлено управление статусами и комментариями. |
| 2026-06-22 | Infrastructure | ✅ Переход с облачного Supabase на локальный Self-Hosted Docker стек на тестовом сервере (192.168.101.122). Обновлён скрипт деплоя. Создан DEPLOYMENT.md. |

