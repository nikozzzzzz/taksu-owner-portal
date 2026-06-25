import { calculateStatement } from '@/lib/calculations/statement-calc';
import { Database } from '@/lib/supabase/types';

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type ExpenseRow = Database['public']['Tables']['operating_expenses']['Row'];

describe('Statement Calculations', () => {
  it('calculates statement correctly', () => {
    const bookings = [
      { status: 'confirmed', total_paid_by_guest_usd: 1000, channel_commission_usd: 150, phr_tax_usd: 100, channel: 'Airbnb', nights: 5 },
      { status: 'cancelled', total_paid_by_guest_usd: 500, channel_commission_usd: 50, phr_tax_usd: 50, channel: 'Airbnb', nights: 2 }
    ] as BookingRow[];

    const expenses = [
      { amount_usd: 50, category: 'Cleaning' },
      { amount_usd: 100, category: 'Maintenance' }
    ] as ExpenseRow[];

    const result = calculateStatement({
      bookings,
      expenses,
      managementFeeRate: 0.2,
      pph26Rate: 0.1,
      daysInMonth: 30
    });

    expect(result.gross_revenue_usd).toBe(1000);
    expect(result.channel_commission_usd).toBe(150);
    expect(result.phr_tax_usd).toBe(100);
    expect(result.net_revenue_usd).toBe(750); // 1000 - 150 - 100
    expect(result.total_opex_usd).toBe(150); // 50 + 100
    expect(result.net_profit_usd).toBe(600); // 750 - 150
    expect(result.management_fee_usd).toBe(120); // 600 * 0.2
    expect(result.owner_gross_payout_usd).toBe(480); // 600 - 120
    expect(result.pph26_amount_usd).toBe(48); // 480 * 0.1
    expect(result.owner_net_payout_usd).toBe(432); // 480 - 48
    
    expect(result.bookings_count).toBe(1);
    expect(result.occupied_nights).toBe(5);
    expect(result.occupancy_rate).toBeCloseTo(5/30);
    expect(result.adr_usd).toBe(1000 / 5);
    expect(result.revpar_usd).toBe(1000 / 30);
  });
  
  it('handles empty inputs gracefully', () => {
    const result = calculateStatement({
      bookings: [],
      expenses: [],
      managementFeeRate: 0.2,
      pph26Rate: 0.1,
      daysInMonth: 31
    });

    expect(result.gross_revenue_usd).toBe(0);
    expect(result.net_profit_usd).toBe(0);
    expect(result.occupancy_rate).toBe(0);
  });
});
