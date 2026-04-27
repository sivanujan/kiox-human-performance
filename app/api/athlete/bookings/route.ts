import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const start = format(targetDate, 'yyyy-MM-dd');
  const end = format(addDays(targetDate, 7), 'yyyy-MM-dd');

  // Fetch all sessions for the week and the user's bookings
  const [sessionsRes, bookingsRes] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('*, bookings:session_bookings(status, athlete_id)')
      .gte('scheduled_date', start)
      .lte('scheduled_date', end)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true }),
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
      supabase.from('profiles').select('first_name, last_name, weekly_load').eq('id', user.id).single(),
      supabase.from('training_sessions').select('*').eq('id', sessionId).single()
    ]);

    if (profileRes.error || !profileRes.data) throw new Error("Profile check failed");
    if (sessionRes.error || !sessionRes.data) throw new Error("Session not found");

    const weeklyLoad = profileRes.data.weekly_load || 0;
    
    // 1.5 Capacity Check
    const { count: confirmedCount } = await supabase
      .from('session_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('status', 'CONFIRMED');

    const maxCapacity = sessionRes.data.max_capacity || 20;
    if ((confirmedCount || 0) >= maxCapacity) {
      throw new Error("SESSION FULL: Maximum operational capacity reached.");
    }

    // 2. Determine initial status based on load
    const initialStatus = weeklyLoad > 600 ? 'PENDING' : 'CONFIRMED';

    // 3. Create booking
    const { data: booking, error: bookingError } = await supabase
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

    if (bookingError) {
       if (bookingError.code === '23505') throw new Error("You already have an active booking for this session.");
       throw bookingError;
    }

    const athleteName = `${profileRes.data.first_name} ${profileRes.data.last_name || ''}`;
    const sessionTitle = sessionRes.data.title || 'Session';

    // 4. Notifications & Emails
    if (initialStatus === 'PENDING') {
        // Notify Coach of pending booking
        const coachId = sessionRes.data.assigned_by;
        if (coachId) {
          await supabase.from('staff_notifications').insert({
            staff_id: coachId,
            type: 'NEW_BOOKING',
            message: `${athleteName} has requested to join ${sessionTitle} (Approval Required).`,
            related_id: booking.id
          });
        }
        await supabase.from('athlete_notifications').insert({
            athlete_id: user.id,
            type: 'APPROVAL_REQUIRED',
            message: `Your booking for ${sessionTitle} requires coach approval due to high weekly load (${weeklyLoad} AU).`,
            related_id: booking.id
        });
    } else {
        // CONFIRMED - Send Confirmation Email to Athlete
        const { sendEmail } = require('@/utils/email');
        const userEmail = user.email;
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: `BOOKING CONFIRMED: ${sessionTitle}`,
            html: `
              <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px;">
                <h1 style="color: #22c55e;">MISSION CONFIRMED</h1>
                <p>Your spot for <strong>${sessionTitle}</strong> has been secured.</p>
                <hr style="border: 1px solid #333; margin: 20px 0;">
                <p><strong>DATE:</strong> ${sessionRes.data.scheduled_date}</p>
                <p><strong>TIME:</strong> ${sessionRes.data.start_time}</p>
                <p><strong>LOCATION:</strong> ${sessionRes.data.location || 'KIO-X MATRIX'}</p>
              </div>
            `
          });
        }

        // Notify Coach of new confirmed booking
        const coachId = sessionRes.data.assigned_by; // For special sessions, assigned_by is the creator
        if (coachId) {
          await supabase.from('staff_notifications').insert({
            staff_id: coachId,
            type: 'NEW_BOOKING',
            message: `${athleteName} has joined ${sessionTitle}. Capacity: ${confirmedCount! + 1}/${maxCapacity}`,
            related_id: booking.id
          });
        }
    }

    return NextResponse.json({ success: true, data: booking });

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
