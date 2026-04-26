const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => line.split('=')));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.trim();
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookings() {
  const { data, error } = await supabase
    .from('session_bookings')
    .select('*, athlete:profiles!session_bookings_athlete_id_fkey(first_name, last_name)')
    .order('booked_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
  } else {
    console.log('Bookings found:', data.length);
    if (data.length > 0) {
        console.log(JSON.stringify(data.slice(0, 5), null, 2));
    }
  }
}

checkBookings();
