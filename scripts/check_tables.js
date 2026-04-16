const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Suapbase environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking for table 'athlete_video_feedback'...");
  const { data, error } = await supabase
    .from('athlete_video_feedback')
    .select('id')
    .limit(1);

  if (error) {
    console.error("ERROR DETECTED:", error.code, error.message);
    if (error.code === '42P01') {
      console.log("\n>>> THE TABLE DOES NOT EXIST. <<<");
    }
  } else {
    console.log("SUCCESS: Table exists and is reachable.");
  }
}

check();
