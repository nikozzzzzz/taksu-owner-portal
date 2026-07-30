import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminSupabaseClient } from '../lib/supabase/admin';
import { convertToUsd } from '../lib/utils/exchange-rate';
import { autoRecalculateStatement } from '../lib/actions/statement-actions';

async function main() {
  const supabase = createAdminSupabaseClient();

  // Fetch all bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, total_paid_by_guest_usd, channel_commission_usd, check_in_date, villa_id, villas(currency)');

  if (error) {
    console.error('Error fetching bookings:', error);
    return;
  }

  console.log(`Processing ${bookings?.length} bookings...`);

  const affectedMonths = new Set<string>();

  for (const b of bookings || []) {
    const val = b.total_paid_by_guest_usd;
    const comm = b.channel_commission_usd || 0;

    // If the value is > 5000, it's definitely raw local currency (e.g. IDR) and needs normalization to USD
    if (val > 5000) {
      const currency = (b.villas as any)?.currency || 'IDR';
      const usdVal = await convertToUsd(val, currency);
      const usdComm = await convertToUsd(comm, currency);
      const usdTax = usdVal * 0.10;

      console.log(`Normalizing booking ${b.id}: Gross ${val} -> ${usdVal} USD | Comm ${comm} -> ${usdComm} USD`);

      const { error: updateErr } = await supabase
        .from('bookings')
        .update({
          total_paid_by_guest_usd: usdVal,
          channel_commission_usd: usdComm,
          phr_tax_usd: usdTax
        })
        .eq('id', b.id);

      if (updateErr) {
        console.error(`Failed to update booking ${b.id}:`, updateErr);
      } else {
        const checkIn = new Date(b.check_in_date);
        const billingMonthStr = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}-01`;
        affectedMonths.add(`${b.villa_id}_${billingMonthStr}`);
      }
    }
  }

  // Now recalculate statements for all affected villa/month combinations
  console.log(`\nRecalculating statements for ${affectedMonths.size} affected periods...`);
  for (const key of affectedMonths) {
    const [villaId, billingMonth] = key.split('_');
    console.log(`Recalculating for Villa ${villaId} | Month ${billingMonth}...`);
    await autoRecalculateStatement(villaId, billingMonth);
  }

  console.log('Normalization complete!');
}

main().catch(console.error);
