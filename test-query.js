const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Querying pools...");
  const { data, error } = await supabase
    .from('pools')
    .select('*, yield_formula:yield_formulas(id, name)')
    .order('name', { ascending: true });
    
  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("DATA:", JSON.stringify(data, null, 2));
  }
}

run();
