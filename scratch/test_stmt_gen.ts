import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminSupabaseClient } from '../lib/supabase/admin';
import { autoRecalculateStatement } from '../lib/actions/statement-actions';

async function main() {
  const supabase = createAdminSupabaseClient();

  const billingMonth = '2026-07-01';

  // Fetch all unique villas that have bookings in July 2026
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('villa_id')
    .neq('status', 'cancelled')
    .gte('check_in_date', '2026-07-01')
    .lte('check_in_date', '2026-07-31');

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError);
    return;
  }

  const villaIds = Array.from(new Set((bookings || []).map(b => b.villa_id)));
  console.log(`Found ${villaIds.length} villas with bookings in July 2026.`);

  for (const villaId of villaIds) {
    console.log(`Running autoRecalculateStatement for villa: ${villaId}...`);
    await autoRecalculateStatement(villaId, billingMonth);
  }

  // Fetch the generated statements and print them
  const { data: statements, error: stmtError } = await supabase
    .from('monthly_statements')
    .select('*, villa:villas(display_name)')
    .eq('billing_month', billingMonth);

  if (stmtError) {
    console.error('Error fetching statements:', stmtError);
    return;
  }

  console.log('\n--- GENERATED STATEMENTS ---');
  console.log(JSON.stringify(statements, null, 2));
}

main().catch(console.error);
