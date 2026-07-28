require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  
  users.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`  user_metadata:`, u.user_metadata);
    console.log(`  app_metadata:`, u.app_metadata);
  });
}
main();
