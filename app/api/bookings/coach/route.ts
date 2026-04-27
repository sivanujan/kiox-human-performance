import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendEmail, getBookingRequestTemplate } from '@/utils/email';
import { convertTimeOnly } from '@/lib/timezone';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 0. Verify the user is authenticated via standard client (JWT verification)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Use service client for all DB operations to bypass RLS for this specific orchestrated flow
  const adminDb = createServiceClient();

  try {
    const { coachId, date, startTime, duration, title } = await request.json();

    // 1. Get Coach and Athlete details
    const [coachRes, athleteRes, adminRes, coachAvailRes] = await Promise.all([
      adminDb.from('profiles').select('*').eq('id', coachId).single(),
      adminDb.from('profiles').select('*').eq('id', user.id).single(),
      adminDb.from('profiles').select('*').eq('role', 'superadmin'),
      adminDb.from('coach_availability').select('timezone').eq('coach_id', coachId).maybeSingle()
    ]);

    if (coachRes.error) {
      console.error("Coach fetch error:", coachRes.error);
      return NextResponse.json({ error: 'Coach profile not found in matrix.' }, { status: 404 });
    }

    const coachProfile = coachRes.data;
    const athleteProfile = athleteRes.data;
    const coachAvail = coachAvailRes?.data; 
    const coachTimezone = coachAvail?.timezone || 'UTC';
    const athleteTimezone = athleteProfile?.timezone || 'UTC';

    // 2. Find or Create the training session
    let sessionId;
    const { data: existingSession } = await adminDb
      .from('training_sessions')
      .select('id')
      .eq('coach_id', coachId)
      .eq('scheduled_date', date)
      .eq('start_time', startTime)
      .maybeSingle();

    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      const { data: newSession, error: sessionError } = await adminDb
        .from('training_sessions')
        .insert({
          coach_id: coachId,
          scheduled_date: date,
          start_time: startTime,
          duration_minutes: duration || 60,
          title: title || `Session with Coach ${coachProfile?.first_name || 'Staff'}`,
          session_type: 'CUSTOM',
          status: 'SCHEDULED',
          assigned_by: user.id,
          coach_timezone: coachTimezone
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Session creation error:", sessionError);
        throw sessionError;
      }
      sessionId = newSession.id;
    }

    // 3. Create the booking as PENDING
    const { data: booking, error: bookingError } = await adminDb
      .from('session_bookings')
      .insert({
        session_id: sessionId,
        athlete_id: user.id,
        booked_by: user.id,
        status: 'PENDING',
        athlete_timezone: athleteTimezone,
        session_time_athlete_local: convertTimeOnly(startTime, coachTimezone, athleteTimezone)
      })
      .select()
      .single();

    if (bookingError) {
        if (bookingError.code === '23505') throw new Error("You already have a pending/confirmed booking for this session.");
        console.error("Booking insertion error:", bookingError);
        throw bookingError;
    }

    // 4. Notify Coach (Dashboard)
    await adminDb.from('staff_notifications').insert({
        staff_id: coachId,
        type: 'NEW_BOOKING',
        message: `New Booking Request: ${athleteProfile?.first_name} requested a session on ${date} at ${startTime}.`,
        related_id: booking.id
    });

    // 5. Send Email to Coach
    const { data: coachAuthData } = await adminDb.auth.admin.getUserById(coachId);
    const coachEmail = coachAuthData?.user?.email;
    
    if (coachEmail) {
        try {
            await sendEmail({
                to: coachEmail,
                subject: `Deployment Request: ${athleteProfile?.first_name} // ${date}`,
                html: getBookingRequestTemplate(
                    `${athleteProfile?.first_name} ${athleteProfile?.last_name}`,
                    date,
                    startTime,
                    title || `Tactical Session`
                )
            });
        } catch (emailErr) {
            console.error("Coach email notification failed:", emailErr);
        }
    }

    // 6. Notify All Admins
    if (adminRes.data) {
        const adminNotifications = adminRes.data.map(admin => ({
            staff_id: admin.id,
            type: 'NEW_BOOKING',
            message: `New Deployment Request: ${athleteProfile?.first_name} -> Coach ${coachProfile?.first_name} (${date} @ ${startTime}).`,
            related_id: booking.id
        }));
        await adminDb.from('staff_notifications').insert(adminNotifications);
    }

    // 7. Notify Athlete (Wait for approval)
    await adminDb.from('athlete_notifications').insert({
        athlete_id: user.id,
        type: 'APPROVAL_REQUIRED',
        message: `Request Transmitted: Waiting for Coach ${coachProfile?.first_name} to confirm your deployment on ${date}.`,
        related_id: booking.id
    });

    return NextResponse.json({ success: true, booking });

  } catch (error: any) {
    console.error("Booking system failure:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
