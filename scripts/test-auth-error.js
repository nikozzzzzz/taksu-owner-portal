const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Signing up user...");
  const { data, error } = await supabase.auth.signUp({
    email: `test_user_${Date.now()}@example.com`,
    password: "StrongPassword123!",
    options: {
      data: {
        full_name: "Test User",
      },
    }
  });
    
  if (error) {
    console.log("error object:", error);
    console.log("error.message:", error.message);
    console.log("typeof error.message:", typeof error.message);
  } else {
    console.log("SUCCESS");
  }
}

run();
