import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const athleteId = params.id;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Get Base Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, avatar_url, training_status')
    .eq('id', athleteId)
    .single();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  // 2. Get Latest Wellness (for recovery score)
  const { data: wellness } = await supabase
    .from('wellness_logs')
    .select('sleep_score, soreness_score, hrv_ms, mood')
    .eq('user_id', athleteId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  // 3. Get Next Session
  const { data: nextSession } = await supabase
    .from('bookings')
    .select('confirmed_date, confirmed_time, program_id (title)')
    .eq('athlete_id', athleteId)
    .eq('status', 'confirmed')
    .gte('confirmed_date', new Date().toISOString().split('T')[0])
    .order('confirmed_date', { ascending: true })
    .limit(1)
    .single();

  // 4. Compute Recovery Score (Simplified Algorithm)
  // Base 100%. -10 per point below 8 sleep. -10 per point above 3 soreness.
  let recoveryScore = 100;
  if (wellness) {
    if (wellness.sleep_score < 8) recoveryScore -= (8 - wellness.sleep_score) * 10;
    if (wellness.soreness_score > 3) recoveryScore -= (wellness.soreness_score - 3) * 10;
    // HRV influence (mock logic)
    if (wellness.hrv_ms < 50) recoveryScore -= 10;
  }
  recoveryScore = Math.max(0, Math.min(100, recoveryScore));

  const result = {
    athlete_id: athleteId,
    full_name: `${profile.first_name} ${profile.last_name}`,
    profile_photo_url: profile.avatar_url,
    training_status: profile.training_status || 'ready',
    recovery_score: recoveryScore,
    next_session: nextSession ? {
      name: (nextSession.program_id as any)?.title || 'Training Session',
      datetime: `${nextSession.confirmed_date} ${nextSession.confirmed_time}`
    } : null
  };

  return NextResponse.json(result);
}
