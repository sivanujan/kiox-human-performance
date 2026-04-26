const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookings() {
  const { data, error } = await supabase
    .from('session_bookings')
    .select('*, athlete:profiles(first_name, last_name)')
    .order('booked_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
  } else {
    console.log('Bookings found:', data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

checkBookings();
