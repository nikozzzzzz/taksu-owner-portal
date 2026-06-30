const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Upserting pool...");
  const { data, error } = await supabase
    .from('pools')
    .upsert({
      name: "Test Upsert",
      description: "Desc",
      villa_type: "1br",
      active: true,
      yield_formula_id: "00000000-0000-0000-0000-000000000001"
    });
    
  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("SUCCESS:", JSON.stringify(data));
  }
}

run();
