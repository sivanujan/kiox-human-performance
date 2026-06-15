import { createServiceClient } from '@/utils/supabase/service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const adminDb = createServiceClient();

  try {
    const { coachId, date, startTime, duration, title, playerName, notes } = await request.json();

    if (!coachId || !date || !startTime || !playerName) {
      return NextResponse.json({ error: 'Missing required fields (coachId, date, startTime, playerName)' }, { status: 400 });
    }

    // 1. Fetch coach profile to get their timezone and name
    const [coachRes, coachAvailRes, adminRes] = await Promise.all([
      adminDb.from('profiles').select('*').eq('id', coachId).single(),
      adminDb.from('coach_availability').select('timezone').eq('coach_id', coachId).maybeSingle(),
      adminDb.from('profiles').select('*').eq('role', 'superadmin')
    ]);

    if (coachRes.error) {
      return NextResponse.json({ error: 'Coach profile not found in matrix.' }, { status: 404 });
    }

    const coachProfile = coachRes.data;
    const coachTimezone = coachAvailRes.data?.timezone || 'UTC';

    // 2. Double check availability (ensure slot is not already booked)
    const { data: existingSessions } = await adminDb
      .from('training_sessions')
      .select('*')
      .eq('coach_id', coachId)
      .eq('scheduled_date', date)
      .eq('start_time', startTime);

    if (existingSessions && existingSessions.length > 0) {
      return NextResponse.json({ error: 'This time slot is no longer available. Please select another slot.' }, { status: 400 });
    }

    // 3. Insert the training session as an external player booking
    const { data: newSession, error: sessionError } = await adminDb
      .from('training_sessions')
      .insert({
        coach_id: coachId,
        scheduled_date: date,
        start_time: startTime,
        duration_minutes: duration || 60,
        title: title || `External Session with Coach ${coachProfile.first_name}`,
        session_type: 'CUSTOM',
        status: 'SCHEDULED',
        coach_timezone: coachTimezone,
        is_external: true,
        external_player_name: playerName,
        payment_status: 'PENDING',
        confirmed_by_admin: false,
        notes: notes || ''
      })
      .select()
      .single();

    if (sessionError) {
      console.error('External session insertion error:', sessionError);
      throw sessionError;
    }

    // 4. Notify all superadmins
    if (adminRes.data && adminRes.data.length > 0) {
      const adminNotifications = adminRes.data.map(admin => ({
        staff_id: admin.id,
        type: 'NEW_BOOKING',
        message: `EXTERNAL BOOKING: ${playerName} requested a session with Coach ${coachProfile.first_name} on ${date} @ ${startTime}. Status: Payment Pending.`,
        related_id: newSession.id
      }));
      await adminDb.from('staff_notifications').insert(adminNotifications);
    }

    // Also notify the assigned coach
    await adminDb.from('staff_notifications').insert({
      staff_id: coachId,
      type: 'NEW_BOOKING',
      message: `EXTERNAL BOOKING: ${playerName} has booked a session with you on ${date} @ ${startTime}. Status: Payment Pending.`,
      related_id: newSession.id
    });

    return NextResponse.json({ success: true, session: newSession });

  } catch (err: any) {
    console.error('Public booking error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
