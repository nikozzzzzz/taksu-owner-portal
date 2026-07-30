import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { deleteVilla } from '../lib/actions/admin-actions';

async function main() {
  const bambuId = '33333333-3333-3333-3333-333333333333';
  console.log(`=== Deleting Taksu Bambu Villa (ID: ${bambuId}) ===`);
  
  try {
    // We can't call requireAdmin() from the script because there is no session context.
    // So let's write a direct DB deletion logic in this script using admin supabase client.
    const { createAdminSupabaseClient } = await import('../lib/supabase/admin');
    const supabase = createAdminSupabaseClient();

    // Cascading deletes
    console.log('Deleting from villa_agreements...');
    await (supabase as any).from('villa_agreements').delete().eq('villa_id', bambuId);
    console.log('Deleting from bookings...');
    await (supabase as any).from('bookings').delete().eq('villa_id', bambuId);
    console.log('Deleting from monthly_statements...');
    await (supabase as any).from('monthly_statements').delete().eq('villa_id', bambuId);
    console.log('Deleting from operating_expenses...');
    await (supabase as any).from('operating_expenses').delete().eq('villa_id', bambuId);
    console.log('Deleting from owner_documents...');
    await (supabase as any).from('owner_documents').delete().eq('villa_id', bambuId);
    console.log('Deleting from owner_requests...');
    await (supabase as any).from('owner_requests').delete().eq('villa_id', bambuId);
    console.log('Deleting from pool_rotation_state...');
    await (supabase as any).from('pool_rotation_state').delete().eq('villa_id', bambuId);

    console.log('Deleting from villas...');
    const { error } = await (supabase as any).from('villas').delete().eq('id', bambuId);
    if (error) {
      throw error;
    }
    
    console.log('Successfully deleted Taksu Bambu Villa!');
  } catch (err) {
    console.error('Failed to delete villa:', err);
  }
}

main().catch(console.error);
