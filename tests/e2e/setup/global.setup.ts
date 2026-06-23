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
    email: 'investor@test.com',
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
    // 1. Delete user if exists in auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (!listError) {
      const existingUser = users.find((user: any) => user.email === u.email);
      if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
      }
    }
    
    // 2. Create user
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        role: u.role
      }
    });
    
    if (createError) {
      console.error(`Failed to create ${u.email}:`, createError);
      continue;
    }
    
    if (authData?.user) {
      const userId = authData.user.id;
      
      // 3. Delete existing owner record just in case (cascade should handle it but let's be safe)
      await supabase.from('owners').delete().eq('email', u.email);
      
      // 4. Create owner record
      const { error: ownerError } = await supabase.from('owners').insert({
        auth_user_id: userId,
        email: u.email,
        full_name: u.name,
        role: u.role,
        country_of_residence: u.country,
        tax_residency_country: u.country,
        status: 'active'
      });
      
      if (ownerError) {
        console.error(`Failed to insert owner for ${u.email}:`, ownerError);
      } else {
        console.log(`Successfully created test user: ${u.email} (${u.role})`);
      }
    }
  }
  
  console.log('--- Global Setup Complete ---');
}

export default globalSetup;
