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
        console.log(`User ${u.email} already exists. Updating password and app_metadata to ensure access.`);
        await supabase.auth.admin.updateUserById(existingUser.id, { 
          password: u.password,
          app_metadata: { ...existingUser.app_metadata, role: u.role }
        });
        userId = existingUser.id;
      }
    }
    
    if (!userId) {
      // 2. Create user if not exists
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { role: u.role },
        app_metadata: { role: u.role }
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
  
  // --- Seed required test data for E2E tests ---
  console.log('Ensuring test data (Taksu Bambu Villa & Statements)...');
  
  // Find the owner ID for test.investor@example.com
  const { data: testOwner } = await supabase
    .from('owners')
    .select('id')
    .eq('email', 'test.investor@example.com')
    .maybeSingle();

  if (testOwner) {
    // 1. Ensure test pool exists
    await supabase.from('pools').upsert({
      id: '22222222-2222-2222-2222-222222222222',
      name: '2BR Garden View Pool',
      villa_type: '2br'
    });

    // 2. Ensure Taksu Bambu Villa exists and is owned by the test investor
    await supabase.from('villas').upsert({
      id: '33333333-3333-3333-3333-333333333333',
      internal_code: 'T2BR-04',
      display_name: 'Taksu Bambu Villa',
      villa_type: '2br',
      bedrooms: 2,
      bathrooms: 2,
      max_guests: 4,
      has_private_pool: true,
      view_type: 'garden',
      square_meters: 120,
      phase: 1,
      ownership_type: 'investor_owned',
      owner_id: testOwner.id,
      pool_id: '22222222-2222-2222-2222-222222222222',
      base_price_usd: 185.00,
      premium_multiplier: 0.05,
      estimated_market_value_usd: 210000.00,
      status: 'active'
    });

    // 3. Ensure monthly statements for August 2026 exist
    await supabase.from('monthly_statements').upsert({
      villa_id: '33333333-3333-3333-3333-333333333333',
      owner_id: testOwner.id,
      billing_month: '2026-08-01',
      gross_revenue_usd: 3330.00,
      revenue_by_channel: { airbnb: 1480, booking: 1850 },
      channel_commission_usd: 360.00,
      phr_tax_usd: 333.00,
      net_revenue_usd: 2637.00,
      total_opex_usd: 728.00,
      opex_breakdown: {
        housekeeping: { amount: 215, items: 5 },
        linens: { amount: 72, items: 3 },
        utilities: { amount: 185, items: 3 },
        pool_maintenance: { amount: 48, items: 4 },
        garden: { amount: 35, items: 1 },
        welcome_basket: { amount: 75, items: 5 },
        supplies: { amount: 58, items: 2 },
        allocated_staff: { amount: 40, items: 1 }
      },
      net_profit_usd: 1909.00,
      management_fee_usd: 381.80,
      management_fee_rate: 0.20,
      owner_gross_payout_usd: 1527.20,
      pph26_rate: 0.10,
      pph26_amount_usd: 152.72,
      owner_net_payout_usd: 1374.48,
      bookings_count: 4,
      occupied_nights: 19,
      available_nights: 31,
      occupancy_rate: 0.6129,
      adr_usd: 175.26,
      revpar_usd: 107.40,
      status: 'sent_to_owner',
      payment_scheduled_at: '2026-09-15'
    });
    
    console.log('Successfully ensured E2E test data.');
  } else {
    console.error('Could not find test investor owner to link E2E test data.');
  }

  console.log('--- Global Setup Complete ---');
}

export default globalSetup;
