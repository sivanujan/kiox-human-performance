import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Verify staff/admin role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['staff', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { 
      title, 
      scheduled_date, 
      start_time, 
      duration_minutes, 
      max_capacity, 
      location,
      notify_all 
    } = body;

    // 2. Create the special session
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .insert({
        title,
        scheduled_date,
        start_time,
        duration_minutes: duration_minutes || 60,
        max_capacity: max_capacity || 20,
        location: location || 'HQ FIELD',
        is_special: true,
        requires_approval: true, // Special sessions always require approval
        assigned_by: user.id,
        status: 'SCHEDULED'
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // 3. Broadcast notifications if requested
    if (notify_all) {
      // Fetch all athletes
      const { data: athletes } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'athlete');

      if (athletes && athletes.length > 0) {
        const notifications = athletes.map(athlete => ({
          athlete_id: athlete.id,
          type: 'BOOKING_CONFIRMED', // Using an existing type for now, or we could add SPECIAL_EVENT
          message: `NEW SPECIAL OPS: ${title} on ${scheduled_date} at ${start_time}. Deploy now!`,
          related_id: session.id
        }));

        await supabase.from('athlete_notifications').insert(notifications);
      }
    }

    return NextResponse.json({ success: true, session });

  } catch (error: any) {
    console.error("Manual session creation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
