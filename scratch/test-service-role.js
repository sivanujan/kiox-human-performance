const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => line.split('=')));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY.trim();

// Try to fetch something that RLS usually blocks
const supabase = createClient(supabaseUrl, serviceKey);

async function testServiceRole() {
  // Fetch all profiles (RLS usually allows only own or staff)
  const { data, error } = await supabase.from('profiles').select('id, role');
  
  if (error) {
    console.error('Service Role Error:', error);
  } else {
    console.log('Service Role Success! Found', data.length, 'profiles');
  }
}

testServiceRole();
