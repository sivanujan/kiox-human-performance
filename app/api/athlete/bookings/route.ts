import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Fetch all sessions for the week and the user's bookings
  const [sessionsRes, bookingsRes] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('*, bookings:session_bookings(status, athlete_id)')
      .gte('scheduled_date', start)
      .lte('scheduled_date', end)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true }),
    supabase
      .from('session_bookings')
      .select('*')
      .eq('athlete_id', user.id)
  ]);

  if (sessionsRes.error) return NextResponse.json({ error: sessionsRes.error.message }, { status: 500 });

  // Map sessions with user's specific booking status and confirmed counts
  const sessions = sessionsRes.data.map(session => {
    const userBooking = session.bookings?.find((b: { athlete_id: string }) => b.athlete_id === user.id);
    const confirmedCount = session.bookings?.filter((b: { status: string }) => b.status === 'CONFIRMED').length || 0;
    
    return {
      ...session,
      user_booking_status: userBooking?.status || null,
      confirmed_count: confirmedCount,
      spots_remaining: Math.max(0, (session.max_capacity || 0) - confirmedCount)
    };
  });

  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { sessionId, notes } = await request.json();

    // 1. Fetch user load & session details
    const [profileRes, sessionRes] = await Promise.all([
      supabase.from('profiles').select('weekly_load').eq('id', user.id).single(),
      supabase.from('training_sessions').select('*').eq('id', sessionId).single()
    ]);

    if (profileRes.error || !profileRes.data) throw new Error("Profile check failed");
    if (sessionRes.error || !sessionRes.data) throw new Error("Session not found");

    const weeklyLoad = profileRes.data.weekly_load || 0;
    
    // 2. Determine initial status based on load
    // If load > 600, it goes to PENDING (needs coach review)
    // Otherwise it goes to CONFIRMED (subject to capacity trigger)
    const initialStatus = weeklyLoad > 600 ? 'PENDING' : 'CONFIRMED';

    // 3. Create booking
    const { data, error } = await supabase
      .from('session_bookings')
      .insert({
        session_id: sessionId,
        athlete_id: user.id,
        booked_by: user.id,
        status: initialStatus,
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
       if (error.code === '23505') throw new Error("You already have an active booking for this session.");
       throw error;
    }

    // 4. Create notification if pending
    if (initialStatus === 'PENDING') {
        await supabase.from('athlete_notifications').insert({
            athlete_id: user.id,
            type: 'APPROVAL_REQUIRED',
            message: `Your booking for ${sessionRes.data.title} requires coach approval due to high weekly load (${weeklyLoad} AU).`,
            related_id: data.id
        });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });

    const { error } = await supabase
        .from('session_bookings')
        .update({ 
            status: 'CANCELLED', 
            cancelled_at: new Date().toISOString(),
            cancelled_by: user.id
        })
        .eq('id', bookingId)
        .eq('athlete_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
