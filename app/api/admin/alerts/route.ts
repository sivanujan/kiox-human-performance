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

  if (profile?.role !== 'superadmin' && profile?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch unresolved alerts from the new transactional system
  const { data: alerts, error } = await supabase
    .from('athlete_alerts')
    .select(`
      id,
      alert_type,
      severity,
      message,
      triggered_at,
      athlete:profiles(id, first_name, last_name)
    `)
    .eq('is_resolved', false)
    .order('triggered_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Transform into the dashboard format
  const formattedAlerts = alerts.map(a => ({
    id: a.id,
    userId: a.athlete?.id,
    athleteName: `${a.athlete?.first_name} ${a.athlete?.last_name}`,
    type: a.alert_type.toLowerCase(),
    severity: a.severity,
    message: a.message,
    time: a.triggered_at
  }));

  return NextResponse.json(formattedAlerts);
}
