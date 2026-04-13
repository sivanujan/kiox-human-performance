import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Fetch flagged wellness entries (Soreness > 7, Sleep < 4, etc.)
  const { data: alerts, error } = await supabase
    .from('wellness_logs')
    .select(`
      id, user_id, date, sleep_score, soreness_score, stress_level, hydration_status,
      profiles:user_id (first_name, last_name, avatar_url)
    `)
    .or('soreness_score.gt.7,sleep_score.lt.5,stress_level.eq.high,hydration_status.eq.low')
    .order('date', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const formattedAlerts = alerts.map(log => ({
    id: log.id,
    userId: log.user_id,
    name: `${(log.profiles as any)?.first_name} ${(log.profiles as any)?.last_name}`,
    avatar: (log.profiles as any)?.avatar_url,
    date: log.date,
    reason: log.soreness_score > 7 ? 'HIGH SORENESS' : 
            log.sleep_score < 5 ? 'INSOMNIA FLAG' : 
            log.stress_level === 'high' ? 'CRITICAL STRESS' : 'HYDRATION ALERT',
    severity: 'high'
  }));

  return NextResponse.json(formattedAlerts);
}
