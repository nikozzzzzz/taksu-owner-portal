require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: pools, error } = await supabase.from('pools').select('*');
  if (error) {
    console.error(error);
    return;
  }
  console.log("Pools:");
  pools.forEach(p => {
    console.log(`- ${p.name}: yield_formula = ${p.yield_formula}`);
  });
}
main();
