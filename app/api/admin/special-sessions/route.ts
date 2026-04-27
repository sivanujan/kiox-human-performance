import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth Check (Staff/Admin only)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'staff' && profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { title, date, time, capacity, category, broadcast } = await request.json();

    // 2. Create the Session
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .insert({
        title,
        scheduled_date: date,
        start_time: time,
        max_capacity: capacity,
        session_type: category,
        is_special: true,
        assigned_by: user.id,
        status: 'SCHEDULED'
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // 3. Broadcast Notifications to all Athletes
    if (broadcast) {
      const { data: athletes } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'athlete');

      if (athletes && athletes.length > 0) {
        const notifications = athletes.map(athlete => ({
          athlete_id: athlete.id,
          title: 'New Special Training Session',
          message: `${title} has been scheduled for ${date} at ${time}. Book your spot now!`,
          type: 'SYSTEM',
          is_read: false
        }));

        await supabase.from('athlete_notifications').insert(notifications);
      }
    }

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Special Session Creation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
