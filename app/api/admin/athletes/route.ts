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

  // Fetch wellness logs for all returned athletes to compute recovery scores
  const profileIds = (athletes || []).map((p: any) => p.id);
  let wellnessLogs: any[] = [];
  
  if (profileIds.length > 0) {
    const { data: logs, error: logsError } = await supabase
      .from('wellness_logs')
      .select('user_id, sleep_score, soreness_score, created_at')
      .in('user_id', profileIds);
      
    if (!logsError && logs) {
      wellnessLogs = logs;
    } else if (logsError) {
      console.error("API Athletes Wellness Fetch Error:", logsError.message);
    }
  }

  // Combine profiles with wellness logs for simple processing
  const enrichedAthletes = (athletes || []).map((athlete: any) => {
    return {
      ...athlete,
      wellness_logs: wellnessLogs.filter((w: any) => w.user_id === athlete.id)
    };
  });

  return NextResponse.json(enrichedAthletes);
}

