import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Check if authorized (Admin/Staff only)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'superadmin' && adminProfile?.role !== 'staff') {
    return NextResponse.json({ error: 'Administrative Clearance Required.' }, { status: 403 });
  }

  // 2. Fetch all athletes with summaries
  const { data: athletes, error: athletesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, training_status, status')
    .eq('role', 'athlete')
    .eq('status', 'approved');

  if (athletesError) return NextResponse.json({ error: athletesError.message }, { status: 500 });

  // 3. For each athlete, aggregate latest load and recovery
  const rosterData = await Promise.all(athletes.map(async (athlete) => {
    // Get latest wellness
    const { data: wellness } = await supabase
      .from('wellness_logs')
      .select('sleep_score, soreness_score, stress_level')
      .eq('user_id', athlete.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Get latest load
    const { data: performance } = await supabase
      .from('performance_logs')
      .select('training_load_au')
      .eq('user_id', athlete.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    return {
      id: athlete.id,
      name: `${athlete.first_name} ${athlete.last_name}`,
      avatar: athlete.avatar_url,
      training_status: athlete.training_status,
      load: performance?.training_load_au || 0,
      risk_flag: (wellness?.soreness_score > 7 || wellness?.stress_level === 'high') ? 'high' : 'low',
      wellness_completion: !!wellness
    };
  }));

  return NextResponse.json(rosterData);
}
