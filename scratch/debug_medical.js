
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugData() {
  const name = "THANARASAN SIVANUJAN";
  console.log(`Searching for: ${name}`);
  
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, training_status, recovery_index, role')
    .or(`first_name.ilike.%THANARASAN%,last_name.ilike.%SIVANUJAN%`);

  if (pError) {
    console.error("Profile Error:", pError);
    return;
  }

  console.log("Found Profiles:", JSON.stringify(profiles, null, 2));

  for (const p of profiles) {
    console.log(`\nInjury Logs for Athlete ID: ${p.id}`);
    const { data: logs, error: lError } = await supabase
      .from('athlete_injury_logs')
      .select('*')
      .eq('athlete_id', p.id);
    
    if (lError) console.error("Log Error:", lError);
    else console.log(JSON.stringify(logs, null, 2));
  }
}

debugData();
