import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
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

  // Use service role client to fetch profiles and auth users to retrieve email addresses
  const serviceRoleSupabase = createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [athRes, authRes] = await Promise.all([
    serviceRoleSupabase
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
      .order('last_name', { ascending: true }),
    serviceRoleSupabase.auth.admin.listUsers()
  ]);

  if (athRes.error) {
    console.error("API Athletes Fetch Error:", athRes.error.message);
    return NextResponse.json({ error: athRes.error.message }, { status: 500 });
  }

  const authUsers = authRes.data?.users || [];
  const athletes = (athRes.data || []).map((p: any) => {
    const authUser = authUsers.find(u => u.id === p.id);
    return {
      ...p,
      email: authUser?.email || null
    };
  });

  return NextResponse.json(athletes);
}

