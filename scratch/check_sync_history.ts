import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminSupabaseClient } from '../lib/supabase/admin';

async function main() {
  const supabase = createAdminSupabaseClient();

  const { data: logs, error } = await supabase
    .from('beds24_sync_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(15);

  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }

  console.log('--- RECENT BEDS24 SYNC LOGS ---');
  console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error);
