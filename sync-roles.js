require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Fetching all owners...");
  const { data: owners, error } = await supabase.from('owners').select('auth_user_id, role');
  if (error) {
    console.error(error);
    return;
  }
  
  for (const owner of owners) {
    if (!owner.auth_user_id) continue;
    
    console.log(`Syncing role ${owner.role} for user ${owner.auth_user_id}`);
    
    // We can't directly update raw_app_meta_data via supabase-js easily unless we use admin API
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(owner.auth_user_id);
    if (userError) {
      console.error(`Error fetching user ${owner.auth_user_id}:`, userError);
      continue;
    }
    
    const newMetadata = { ...user.user.app_metadata, role: owner.role };
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      owner.auth_user_id,
      { app_metadata: newMetadata }
    );
    
    if (updateError) {
      console.error(`Error updating user ${owner.auth_user_id}:`, updateError);
    } else {
      console.log(`Successfully synced role for ${owner.auth_user_id}`);
    }
  }
  console.log("Done syncing roles!");
}
main();
