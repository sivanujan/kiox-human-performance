import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Auth & Role check
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (profile?.role !== 'superadmin' && profile?.role !== 'staff' && profile?.role !== 'medical') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch athletes with all required joins for roster display
  const { data: athletes, error } = await supabase
    .from('profiles')
    .select(`
      id, first_name, last_name, username, status, role, position_played,
      top_speed, distance, sprints, hrv, recovery_index, injury_risk, training_status, weekly_load,
      sleep_score, soreness,
      athlete_injury_logs(severity, status),
      athlete_alerts(id, severity, is_resolved),
      session_athlete_loads(
        actual_load_au,
        training_sessions(title, scheduled_date)
      )
    `)
    .eq('role', 'athlete')
    .order('last_name', { ascending: true });

  if (error) {
    console.error("API Athletes Fetch Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(athletes);
}

