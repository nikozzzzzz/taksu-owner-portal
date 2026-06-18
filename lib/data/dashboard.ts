import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type StatementRow = Database['public']['Tables']['monthly_statements']['Row'];
type BookingRow = Database['public']['Views']['v_bookings_anonymized']['Row'];

// ─── Dashboard Data ───────────────────────────────────────────────────────────

export async function getOwnerDashboard(ownerId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await (supabase as any).rpc('get_owner_dashboard', {
    p_owner_id: ownerId,
  });

  if (error) {
    console.error('Dashboard RPC error:', error);
    return null;
  }

  return data as {
    current_month: {
      period: string;
      occupancy_rate: number;
      gross_revenue: number;
      owner_net_payout: number;
      payout_scheduled_at: string | null;
      bookings_count: number;
      occupied_nights: number;
      adr_usd: number | null;
      revpar_usd: number | null;
    } | null;
    ytd: {
      gross_revenue: number;
      owner_net_payout: number;
      statements_count: number;
      total_pph26: number;
      avg_occupancy: number;
    };
    dgt1_alert: {
      status: 'valid' | 'expired' | 'pending_review' | 'none';
      valid_until: string | null;
      days_to_expire: number | null;
      current_rate: number;
      savings_if_renewed: number;
    };
    pending_requests: number;
    villa: {
      id: string;
      display_name: string;
      internal_code: string;
      villa_type: string;
      status: string;
    } | null;
  } | null;
}

// ─── Latest Bookings ──────────────────────────────────────────────────────────

export async function getLatestBookings(villaId: string, limit = 5) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('v_bookings_anonymized')
    .select('*')
    .eq('villa_id', villaId)
    .neq('status', 'cancelled')
    .order('check_in_date', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data as BookingRow[];
}

// ─── Statements YTD ───────────────────────────────────────────────────────────

export async function getStatementsYTD(ownerId: string) {
  const supabase = await createServerSupabaseClient();
  const currentYear = new Date().getFullYear();

  const { data, error } = await supabase
    .from('monthly_statements')
    .select(
      'billing_month, gross_revenue_usd, owner_net_payout_usd, occupancy_rate, status'
    )
    .eq('owner_id', ownerId)
    .gte('billing_month', `${currentYear}-01-01`)
    .in('status', ['sent_to_owner', 'paid', 'disputed'])
    .order('billing_month', { ascending: true });

  if (error) return [];
  return data as Partial<StatementRow>[];
}

// ─── Pool Position ────────────────────────────────────────────────────────────

export async function getPoolPosition(villaId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('pool_rotation_state')
    .select('*')
    .eq('villa_id', villaId)
    .single();

  if (error || !data) return null;
  return data;
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

export async function getRecentActivity(ownerId: string, limit = 8) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('owner_portal_audit')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

// ─── Owner Documents (quick access) ─────────────────────────────────────────

export async function getOwnerDocumentsCount(ownerId: string) {
  const supabase = await createServerSupabaseClient();

  const { count } = await supabase
    .from('owner_documents')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
    .eq('visible_to_owner', true);

  return count ?? 0;
}
