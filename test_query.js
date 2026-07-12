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
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, first_name, last_name, username, status, role, position_played,
      top_speed, distance, sprints, hrv, recovery_index, injury_risk, training_status, weekly_load,
      sleep_score, soreness, avatar_url, bio, created_at, assigned_staff,
      athlete_injury_logs(severity, status),
      athlete_alerts(id, severity, is_resolved),
      session_athlete_loads(
        actual_load_au,
        training_sessions(title, scheduled_date)
      )
    `)
    .eq('role', 'athlete')
    .order('last_name', { ascending: true });

  console.log('Query Data:', data);
  console.log('Query Error:', error);
})();
