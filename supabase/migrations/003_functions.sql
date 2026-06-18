-- ========================================================
-- 003_functions.sql
-- Taksu Owner Portal — Database Functions & Views
-- ========================================================

-- ========== ANONYMIZED BOOKING VIEW ==========
-- Hides guest PII from investor-facing queries
CREATE OR REPLACE VIEW v_bookings_anonymized AS
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
  -- Hide PII
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
  -- Get owner's primary villa (MVP: one villa per owner)
  SELECT id INTO v_villa_id FROM villas WHERE owner_id = p_owner_id LIMIT 1;
  
  SELECT json_build_object(
    'current_month', (
      SELECT json_build_object(
        'period', v_current_month,
        'occupancy_rate', COALESCE(occupancy_rate, 0),
        'gross_revenue', COALESCE(gross_revenue_usd, 0),
        'owner_net_payout', COALESCE(owner_net_payout_usd, 0),
        'payout_scheduled_at', payment_scheduled_at,
        'bookings_count', COALESCE(bookings_count, 0),
        'occupied_nights', COALESCE(occupied_nights, 0),
        'adr_usd', adr_usd,
        'revpar_usd', revpar_usd
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
        'statements_count', COUNT(*),
        'total_pph26', COALESCE(SUM(pph26_amount_usd), 0),
        'avg_occupancy', COALESCE(AVG(occupancy_rate), 0)
      )
      FROM monthly_statements
      WHERE owner_id = p_owner_id
        AND billing_month >= DATE_TRUNC('year', CURRENT_DATE)
        AND status IN ('sent_to_owner', 'paid', 'disputed')
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
            COALESCE(
              (SELECT AVG(owner_gross_payout_usd) * 0.10 
               FROM monthly_statements 
               WHERE owner_id = p_owner_id 
               AND billing_month >= CURRENT_DATE - INTERVAL '3 months'),
              0
            )
          ELSE 0
        END
      )
      FROM owners
      WHERE id = p_owner_id
    ),
    'pending_requests', (
      SELECT COUNT(*)
      FROM owner_requests
      WHERE owner_id = p_owner_id
        AND status IN ('pending', 'in_review')
    ),
    'villa', (
      SELECT json_build_object(
        'id', id,
        'display_name', display_name,
        'internal_code', internal_code,
        'villa_type', villa_type,
        'status', status
      )
      FROM villas
      WHERE id = v_villa_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== ANALYTICS FUNCTION ==========
CREATE OR REPLACE FUNCTION get_owner_analytics(
  p_owner_id UUID,
  p_from_date DATE,
  p_to_date DATE
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'monthly_performance', (
      SELECT json_agg(
        json_build_object(
          'month', billing_month,
          'gross_revenue', gross_revenue_usd,
          'owner_net_payout', owner_net_payout_usd,
          'occupancy_rate', occupancy_rate,
          'adr_usd', adr_usd,
          'revpar_usd', revpar_usd,
          'bookings_count', bookings_count
        ) ORDER BY billing_month ASC
      )
      FROM monthly_statements
      WHERE owner_id = p_owner_id
        AND billing_month >= p_from_date
        AND billing_month <= p_to_date
        AND status IN ('sent_to_owner', 'paid', 'disputed')
    ),
    'channel_breakdown', (
      SELECT json_agg(
        json_build_object(
          'channel', channel,
          'total_revenue', SUM(total_paid_by_guest_usd),
          'bookings', COUNT(*)
        )
      )
      FROM bookings b
      JOIN villas v ON v.id = b.villa_id
      WHERE v.owner_id = p_owner_id
        AND b.check_in_date >= p_from_date
        AND b.check_in_date <= p_to_date
        AND b.status != 'cancelled'
      GROUP BY channel
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== POOL POSITION FUNCTION ==========
CREATE OR REPLACE FUNCTION get_pool_position(p_villa_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_pool_id UUID;
BEGIN
  SELECT pool_id INTO v_pool_id FROM villas WHERE id = p_villa_id;
  
  SELECT json_build_object(
    'villa_position', (
      SELECT json_build_object(
        'fair_share_metric', fair_share_metric,
        'priority_score', priority_score,
        'revenue_last_90_days', revenue_last_90_days_usd,
        'nights_last_90_days', nights_booked_last_90_days,
        'last_booking_at', last_booking_at,
        'last_calculated_at', last_calculated_at
      )
      FROM pool_rotation_state
      WHERE villa_id = p_villa_id
    ),
    'pool_average', (
      SELECT json_build_object(
        'avg_fair_share', AVG(fair_share_metric),
        'avg_revenue_90d', AVG(revenue_last_90_days_usd),
        'villas_in_pool', COUNT(*)
      )
      FROM pool_rotation_state
      WHERE pool_id = v_pool_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
