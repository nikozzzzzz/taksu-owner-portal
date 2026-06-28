import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'TestPassword123!',
    role: 'admin',
    name: 'Test Admin',
    country: 'Indonesia'
  },
  {
    email: 'test.investor@example.com',
    password: 'TestPassword123!',
    role: 'investor',
    name: 'Test Investor',
    country: 'Australia'
  },
  {
    email: 'guest@test.com',
    password: 'TestPassword123!',
    role: 'guest',
    name: 'Test Guest',
    country: 'Germany'
  }
];

async function globalSetup(config: FullConfig) {
  console.log('--- Playwright Global Setup ---');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Missing SUPABASE env vars. Skipping DB setup.');
    return;
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  for (const u of TEST_USERS) {
    // 1. Check if user exists in auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    let userId = null;
    
    if (!listError) {
      const existingUser = users.find((user: any) => user.email === u.email);
      if (existingUser) {
        console.log(`User ${u.email} already exists. Updating password to ensure access.`);
        await supabase.auth.admin.updateUserById(existingUser.id, { password: u.password });
        userId = existingUser.id;
      }
    }
    
    if (!userId) {
      // 2. Create user if not exists
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { role: u.role }
      });
      
      if (createError) {
        console.error(`Failed to create ${u.email}:`, createError);
        continue;
      }
      userId = authData?.user?.id;
    }
    
    if (userId) {
      // 3. Upsert owner record (so we don't destroy seed data completely, just ensure it exists)
      
      // Check if it exists first
      const { data: existingOwner } = await supabase.from('owners').select('id').eq('email', u.email).single();
      
      if (existingOwner) {
         await supabase.from('owners').update({
          auth_user_id: userId,
          full_name: u.name,
          role: u.role,
          country_of_residence: u.country,
          tax_residency_country: u.country,
          status: 'active'
        }).eq('id', existingOwner.id);
      } else {
         await supabase.from('owners').insert({
          auth_user_id: userId,
          email: u.email,
          full_name: u.name,
          role: u.role,
          country_of_residence: u.country,
          tax_residency_country: u.country,
          status: 'active'
        });
      }
      
      console.log(`Successfully ensured test user: ${u.email} (${u.role})`);
    }
  }
  
  console.log('--- Global Setup Complete ---');
}

export default globalSetup;
