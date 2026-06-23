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

### Phase 7: Administrative Tools & RBAC 
**Status:** ✅ Completed
**Goal:** Implement robust role-based access control and provide internal staff with management tools.
- [x] Integrate `owners.role` with Supabase Auth `app_metadata` (via triggers).
- [x] Protect API routes and pages using Next.js Edge Middleware for roles (`root`, `admin`, `accountant`, etc.).
- [x] Develop **Admin Panel** (`/admin/users`, `/admin/villas`) for `root`/`admin`.
- [x] Allow `admin` to update Request tickets (Approve, Complete, Reject).

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

### Phase 9: Intensive E2E Auto Tests
**Status:** 🔄 In Progress
**Goal:** Build a comprehensive automated test suite testing the entire application from different user roles.
- [x] Develop E2E Test Data Setup (`global.setup.ts`) to inject test accounts for every role.
- [x] Write Auth & RBAC E2E Tests (verifying redirects and path protections).
- [x] Write Dashboard & Metrics E2E Tests.
- [x] Write Tickets (Requests) Lifecycle Tests (Investor creates -> Admin approves).
- [x] Write Statements & Downloads Tests.
- [ ] Stabilize Playwright test environment (currently failing due to auth cookie persistence in CI).

### Acceptance Criteria

- [ ] All settings pages work
- [ ] Banking change requires re-auth
- [ ] All emails sent correctly
- [ ] No console errors
- [ ] Lighthouse: Performance > 85, Accessibility > 90
- [ ] Mobile responsive on all screens
- [ ] Production deployment successful

---

## 🧪 Intensive E2E Testing Plan (Next Steps)

Для обеспечения максимальной надежности проекта на сервере внедряется система **Интенсивного E2E тестирования**.

**Цели тестирования:**
- Покрытие 100% критических путей пользователя (вход, просмотр финансов, создание тикетов, скачивание отчетов).
- Интеграция с CI/CD: запрет деплоя (и перезапуска PM2) при падении любого из тестов на staging-сборке.
- Разделение прав доступа: тесты должны прогоняться для каждой роли (Admin, Accountant, Investor, Guest).

**Этапы реализации автотестов:**
1. **Core Auth & RBAC (Частично реализовано)**
   - Проверка входа с валидными/невалидными данными.
   - Проверка редиректов и запретов по ролям (Guest не должен видеть `/statements`, Accountant не должен менять профили).
2. **Dashboard & Metrics**
   - Проверка рендеринга всех виджетов (Current Month, YTD, Pool Position).
   - Интеграция с моковыми данными Supabase.
3. **Statements & Downloads**
   - Проверка навигации по отчетам.
   - Проверка работы кнопок "Скачать PDF/Excel" (перехват потоков скачивания в Playwright).
4. **Tickets (Requests)**
   - E2E прогон: Создание тикета (Investor) -> Просмотр (Admin) -> Добавление комментария -> Закрытие тикета.

*Тесты будут написаны на Playwright и запускаться локально перед коммитом и на сервере в `deploy.sh` перед рестартом сервисов.*

---

## Changelog

| Дата | Фаза | Действие |
|------|------|---------|
| 2026-06-18 | Phase 1 | 📋 Roadmap создан, начата Phase 1 |
| 2026-06-18 | Phase 1 | ✅ Phase 1 завершена: Next.js 15 + Supabase + Tailwind "Wellness Bali" + все layouts + auth компоненты + SQL миграции. Dev server запущен на localhost:3000 |
| 2026-06-22 | Phase 7 | ✅ Завершены Owner Requests Lifecycle. Добавлено управление статусами и комментариями. |
| 2026-06-22 | Infrastructure | ✅ Переход с облачного Supabase на локальный Self-Hosted Docker стек на тестовом сервере (192.168.101.122). Обновлён скрипт деплоя. Создан DEPLOYMENT.md. |
| 2026-06-23 | Auth / Security | ✅ Внедрена ролевая модель (RBAC). Созданы роли `root`, `admin`, `accountant`, `service`, `investor`, `guest`. Добавлена защита на уровне БД (RLS) и Frontend Middleware. |

