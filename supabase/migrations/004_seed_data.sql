-- ========================================================
-- 004_seed_data.sql
-- Taksu Owner Portal — Development Seed Data
-- !! Run this ONLY in development, NOT in production !!
-- ========================================================

-- NOTE: You must first create a Supabase Auth user manually in the dashboard
-- or via the admin API, then update the auth_user_id below.
-- Test credentials: test.investor@example.com / TestPassword123!

-- ========== TEST OWNER ==========
INSERT INTO owners (
  id, email, full_name, passport_number, passport_country,
  country_of_residence, tax_residency_country,
  dgt1_status, dgt1_valid_until, pph26_effective_rate,
  bank_name, bank_account_iban, bank_account_swift,
  bank_account_holder, payout_currency,
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
  'DEUTDEDB',
  'John Smith',
  'EUR',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- ========== TEST POOL ==========
INSERT INTO pools (id, name, villa_type) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '2BR Garden View Pool',
  '2br'
) ON CONFLICT DO NOTHING;

-- ========== TEST VILLA ==========
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
  185.00, 0.05,
  210000.00,
  'active'
) ON CONFLICT DO NOTHING;

-- ========== POOL ROTATION STATE ==========
INSERT INTO pool_rotation_state (
  pool_id, villa_id,
  revenue_last_90_days_usd, nights_booked_last_90_days,
  priority_score, fair_share_metric, last_booking_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  7650.00, 57,
  0.48, 1.02,
  NOW() - INTERVAL '3 days'
) ON CONFLICT (pool_id, villa_id) DO NOTHING;

-- ========== SAMPLE BOOKINGS ==========
INSERT INTO bookings (
  villa_id, hostaway_reservation_id, check_in_date, check_out_date,
  guest_full_name, guest_country, guests_count,
  channel, total_paid_by_guest_usd, channel_commission_usd, phr_tax_usd,
  status, booked_at
) VALUES
(
  '33333333-3333-3333-3333-333333333333', 'HOSTAWAY-001',
  '2026-08-01', '2026-08-05',
  'Maria Schmidt', 'Germany', 2,
  'airbnb', 740, 22, 74, 'completed', '2026-07-15'
),
(
  '33333333-3333-3333-3333-333333333333', 'HOSTAWAY-002',
  '2026-08-10', '2026-08-15',
  'James Brown', 'Australia', 4,
  'booking', 925, 158, 93, 'completed', '2026-07-20'
),
(
  '33333333-3333-3333-3333-333333333333', 'HOSTAWAY-003',
  '2026-08-15', '2026-08-20',
  'Hans Mueller', 'Germany', 2,
  'booking', 925, 158, 93, 'completed', '2026-07-25'
),
(
  '33333333-3333-3333-3333-333333333333', 'HOSTAWAY-004',
  '2026-08-25', '2026-08-29',
  'Sofia Rossi', 'Italy', 2,
  'airbnb', 740, 22, 74, 'completed', '2026-08-10'
),
(
  '33333333-3333-3333-3333-333333333333', 'HOSTAWAY-005',
  '2026-09-05', '2026-09-10',
  'Lucas Dupont', 'France', 3,
  'direct', 850, 0, 85, 'completed', '2026-08-20'
),
(
  '33333333-3333-3333-3333-333333333333', 'HOSTAWAY-006',
  '2026-09-15', '2026-09-20',
  'Emma Wilson', 'United Kingdom', 2,
  'airbnb', 925, 28, 93, 'completed', '2026-08-30'
)
ON CONFLICT DO NOTHING;

-- ========== SAMPLE MONTHLY STATEMENT (August 2026) ==========
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
) ON CONFLICT (villa_id, billing_month) DO NOTHING;

-- ========== SAMPLE MONTHLY STATEMENT (September 2026) ==========
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
  '2026-09-01',
  1775.00,
  '{"airbnb": 925, "direct": 850}'::jsonb,
  28.00, 178.00, 1569.00,
  412.00,
  '{
    "housekeeping": {"amount": 120, "items": 3},
    "linens": {"amount": 42, "items": 2},
    "utilities": {"amount": 165, "items": 3},
    "pool_maintenance": {"amount": 48, "items": 4},
    "garden": {"amount": 37, "items": 1}
  }'::jsonb,
  1157.00, 231.40, 0.20,
  925.60, 0.10, 92.56,
  833.04,
  2, 10, 30, 0.3333,
  177.50, 59.17,
  'sent_to_owner',
  '2026-10-15'
) ON CONFLICT (villa_id, billing_month) DO NOTHING;

-- ========== SAMPLE OWNER REQUESTS ==========
INSERT INTO owner_requests (
  owner_id, villa_id, category, subject, description, status, priority
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'personal_stay',
  'Personal stay in January 2027',
  'I would like to block January 10-17, 2027 for my personal stay. Please confirm availability.',
  'in_review',
  'normal'
),
(
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'maintenance_request',
  'AC unit making noise',
  'The AC unit in the master bedroom has been making a clicking noise. Please arrange for maintenance.',
  'completed',
  'high'
)
ON CONFLICT DO NOTHING;

-- ========== SAMPLE DOCUMENTS ==========
INSERT INTO owner_documents (
  owner_id, villa_id, document_type, title, description,
  file_url, file_size_bytes, file_mime_type, visible_to_owner
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'management_agreement',
  'Management Agreement 2024-2027',
  'Signed management agreement between John Smith and PT Taksu Living Management',
  'https://placeholder.com/management-agreement.pdf',
  245760,
  'application/pdf',
  TRUE
),
(
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'leasehold_agreement',
  'Hak Sewa Leasehold Agreement',
  'Leasehold agreement for Taksu Bambu Villa',
  'https://placeholder.com/leasehold.pdf',
  512000,
  'application/pdf',
  TRUE
)
ON CONFLICT DO NOTHING;
