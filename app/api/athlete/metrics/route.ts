import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAthleteId(supabase: any, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, parent_of')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.role === 'parent' && profile.parent_of) {
    return profile.parent_of;
  }
  return userId;
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const athleteId = await getAthleteId(supabase, user.id);

  const { data: metrics, error } = await supabase
    .from('profiles')
    .select(`
      top_speed, distance, sprints, hrv, vo2_max, resting_hr, 
      power_output, high_intensity_efforts, recovery_index, 
      sleep_score, soreness, hydration, mood, stress_level,
      weekly_load, weekly_score, injury_risk, training_status,
      goals, assists, xg, pass_accuracy, duels_won, pressures,
      reaction_time, decision_score, focus_score,
      sprint_speed_target, sprint_speed_current, 
      pass_accuracy_target, fatigue_dips_per_week,
      protocol_directives,
      reaction_time, decision_score, focus_score, stress_level
    `)
    .eq('id', athleteId)
    .single();

  if (error) {
    console.warn("Metrics fetch failed (likely missing columns):", error.message);
    return NextResponse.json(null); // Prevent dashboard crash
  }
  return NextResponse.json(metrics);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const athleteId = await getAthleteId(supabase, user.id);
    const body = await request.json();
    const { data, error } = await supabase
      .from('profiles')
      .update(body)
      .eq('id', athleteId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

