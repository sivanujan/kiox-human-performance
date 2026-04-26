const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => line.split('=')));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.trim();
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role')
    .ilike('first_name', '%yaal%');

  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles found:', data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

checkProfiles();
