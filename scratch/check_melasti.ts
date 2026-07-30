import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminSupabaseClient } from '../lib/supabase/admin';

async function main() {
  const supabase = createAdminSupabaseClient();

  const { data: villas, error: vErr } = await (supabase as any)
    .from('villas')
    .select('id, display_name, beds24_property_id, beds24_room_id, owner_id')
    .ilike('display_name', '%Melasti%');

  if (vErr) {
    console.error('Failed to query villas:', vErr);
    return;
  }

  console.log(`Found ${villas?.length || 0} villas matching "Melasti":`);
  console.log(JSON.stringify(villas, null, 2));
}

main().catch(console.error);
