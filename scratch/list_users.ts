import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminSupabaseClient } from '../lib/supabase/admin';

async function main() {
  const supabase = createAdminSupabaseClient();

  const { data: owners, error } = await supabase
    .from('owners')
    .select('id, email, full_name, role, status');

  if (error) {
    console.error('Error fetching owners:', error);
    return;
  }

  console.log('--- ALL OWNER ACCOUNTS ---');
  console.log(JSON.stringify(owners, null, 2));
}

main().catch(console.error);
