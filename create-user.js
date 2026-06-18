const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const email = 'test.investor@example.com';
  const password = 'TestPassword123!';

  console.log(`Creating user: ${email}...`);
  
  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('User already registered')) {
      console.log('User already exists in auth.users.');
      
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existingUser = usersData.users.find(u => u.email === email);
      
      if (existingUser) {
        console.log(`Found existing user with ID: ${existingUser.id}`);
        // Let's reset the password just in case
        await supabase.auth.admin.updateUserById(existingUser.id, { password });
        console.log('Password reset successfully.');
        await linkToOwner(existingUser.id, email);
      }
    } else {
      console.error('Auth Error:', authError);
      process.exit(1);
    }
  } else if (authData?.user) {
    console.log(`User created with ID: ${authData.user.id}`);
    await linkToOwner(authData.user.id, email);
  } else {
    console.log('Unknown result:', authData);
  }
}

async function linkToOwner(authUserId, email) {
  console.log(`Linking auth_user_id to owner with email: ${email}`);
  const { data, error } = await supabase
    .from('owners')
    .update({ auth_user_id: authUserId })
    .eq('email', email)
    .select();

  if (error) {
    console.error('Failed to link owner:', error);
  } else {
    console.log('Successfully linked owner:', data);
  }
}

run();
