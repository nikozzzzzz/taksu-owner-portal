import type { Database } from '@/lib/supabase/types';

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type ExpenseRow = Database['public']['Tables']['operating_expenses']['Row'];

export interface StatementInput {
  bookings: BookingRow[];
  expenses: ExpenseRow[];
  managementFeeRate: number; // e.g., 0.20 for 20%
  pph26Rate: number; // e.g., 0.10 for 10% or 0.20 for 20%
  daysInMonth: number;
}

export interface StatementCalculation {
  gross_revenue_usd: number;
  revenue_by_channel: Record<string, number>;
  channel_commission_usd: number;
  phr_tax_usd: number;
  net_revenue_usd: number;

  total_opex_usd: number;
  opex_breakdown: Record<string, { amount: number; items: number }>;

  net_profit_usd: number;
  management_fee_usd: number;
  owner_gross_payout_usd: number;

  pph26_amount_usd: number;
  owner_net_payout_usd: number;

  bookings_count: number;
  occupied_nights: number;
  occupancy_rate: number;
  adr_usd: number;
  revpar_usd: number;
}

export function calculateStatement(input: StatementInput): StatementCalculation {
  const { bookings, expenses, managementFeeRate, pph26Rate, daysInMonth } = input;

  // Revenue Calculations
  let gross_revenue_usd = 0;
  let channel_commission_usd = 0;
  let phr_tax_usd = 0;
  const revenue_by_channel: Record<string, number> = {};
  
  let occupied_nights = 0;

  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue;

    gross_revenue_usd += booking.total_paid_by_guest_usd;
    channel_commission_usd += booking.channel_commission_usd;
    phr_tax_usd += booking.phr_tax_usd;
    
    revenue_by_channel[booking.channel] = (revenue_by_channel[booking.channel] || 0) + booking.total_paid_by_guest_usd;
    
    // Simplistic nights calculation (assumes booking entirely within month for MVP)
    if (booking.nights) {
      occupied_nights += booking.nights;
    }
  }

  const net_revenue_usd = gross_revenue_usd - channel_commission_usd - phr_tax_usd;

  // Expenses Calculations
  let total_opex_usd = 0;
  const opex_breakdown: Record<string, { amount: number; items: number }> = {};

  for (const expense of expenses) {
    total_opex_usd += expense.amount_usd;
    
    if (!opex_breakdown[expense.category]) {
      opex_breakdown[expense.category] = { amount: 0, items: 0 };
    }
    opex_breakdown[expense.category].amount += expense.amount_usd;
    opex_breakdown[expense.category].items += 1;
  }

  // Profit Calculations
  const net_profit_usd = Math.max(0, net_revenue_usd - total_opex_usd);
  const management_fee_usd = net_profit_usd * managementFeeRate;
  const owner_gross_payout_usd = net_profit_usd - management_fee_usd;

  // Tax Calculations
  const pph26_amount_usd = owner_gross_payout_usd * pph26Rate;
  const owner_net_payout_usd = owner_gross_payout_usd - pph26_amount_usd;

  // Performance Metrics
  // Cap occupied nights at daysInMonth for metric safety
  const capped_occupied_nights = Math.min(occupied_nights, daysInMonth);
  const occupancy_rate = daysInMonth > 0 ? capped_occupied_nights / daysInMonth : 0;
  const adr_usd = capped_occupied_nights > 0 ? gross_revenue_usd / capped_occupied_nights : 0;
  const revpar_usd = daysInMonth > 0 ? gross_revenue_usd / daysInMonth : 0;

  // Rounding helper
  const round2 = (num: number) => Math.round(num * 100) / 100;
  const round4 = (num: number) => Math.round(num * 10000) / 10000;

  return {
    gross_revenue_usd: round2(gross_revenue_usd),
    revenue_by_channel,
    channel_commission_usd: round2(channel_commission_usd),
    phr_tax_usd: round2(phr_tax_usd),
    net_revenue_usd: round2(net_revenue_usd),
    
    total_opex_usd: round2(total_opex_usd),
    opex_breakdown,
    
    net_profit_usd: round2(net_profit_usd),
    management_fee_usd: round2(management_fee_usd),
    owner_gross_payout_usd: round2(owner_gross_payout_usd),
    
    pph26_amount_usd: round2(pph26_amount_usd),
    owner_net_payout_usd: round2(owner_net_payout_usd),
    
    bookings_count: bookings.filter(b => b.status !== 'cancelled').length,
    occupied_nights: capped_occupied_nights,
    occupancy_rate: round4(occupancy_rate),
    adr_usd: round2(adr_usd),
    revpar_usd: round2(revpar_usd),
  };
}
