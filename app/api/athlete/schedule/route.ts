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

  const { data: schedule, error } = await supabase
    .from('weekly_schedules')
    .select('*')
    .eq('user_id', athleteId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn("Schedule table missing or fetch failed:", error.message);
    return NextResponse.json([]); // Return empty array to prevent dashboard crash
  }
  return NextResponse.json(schedule);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const athleteId = await getAthleteId(supabase, user.id);
    const { day, session, time, type } = await request.json();
    const { data, error } = await supabase
      .from('weekly_schedules')
      .insert({ user_id: athleteId, day, session, time, type })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

