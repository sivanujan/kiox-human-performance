const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let supabaseUrl, supabaseKey;
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
    }
    if (line.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
    }
  }
} catch (e) {
  console.error('Error reading .env.local:', e);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  // 1. Get athletes
  const { data: athletes, error: aErr } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'athlete');

  if (aErr) {
    console.error('Error fetching athletes:', aErr);
    return;
  }

  const landro = athletes.find(a => a.last_name === 'K' || a.first_name === 'Landro');
  const nullNull = athletes.find(a => a.first_name === 'null' || a.first_name === 'NULL');

  if (!landro || !nullNull) {
    console.error('Could not find Landro or Null Null in database!');
    return;
  }

  console.log(`Landro K ID: ${landro.id}`);
  console.log(`Null Null ID: ${nullNull.id}`);

  // Restore sessions
  const todayStr = '2026-07-11';
  const { data: sessions, error: sErr } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('scheduled_date', todayStr);

  if (sErr) {
    console.error('Error fetching sessions:', sErr);
    return;
  }

  for (const session of sessions) {
    let assigned = [];
    if (session.title === 'Functional') {
      assigned = [landro.id, nullNull.id];
    }
    
    const { error: uErr } = await supabase
      .from('training_sessions')
      .update({ assigned_athletes: assigned })
      .eq('id', session.id);

    if (uErr) {
      console.error(`Error updating session ${session.title}:`, uErr);
    } else {
      console.log(`Restored "${session.title}" to assigned_athletes:`, assigned);
    }
  }

  console.log('Restore complete!');
})();
