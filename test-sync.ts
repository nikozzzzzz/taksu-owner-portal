import { runBeds24FullSync } from './lib/beds24/sync';
import { createServerSupabaseClient } from './lib/supabase/server';

async function main() {
  console.log('Starting full sync...');
  try {
    const result = await runBeds24FullSync('manual');
    console.log('Sync result:', result);
  } catch (err) {
    console.error('Error during sync:', err);
  }
}

main();
