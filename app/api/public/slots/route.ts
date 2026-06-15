import { createServiceClient } from '@/utils/supabase/service';
import { NextResponse } from 'next/server';
import { format, parseISO, addMinutes, isBefore, isAfter } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coachId = searchParams.get('coachId');
  const date = searchParams.get('date'); // yyyy-MM-dd

  if (!coachId || !date) {
    return NextResponse.json({ error: 'Missing coachId or date' }, { status: 400 });
  }

  const adminDb = createServiceClient();

  try {
    const dayName = format(parseISO(date), 'EEEE');
    
    const [scheduleRes, availRes, sessionsRes] = await Promise.all([
      adminDb.from('coach_schedule').select('*').eq('coach_id', coachId).eq('day_name', dayName).single(),
      adminDb.from('coach_availability').select('*').eq('coach_id', coachId).maybeSingle(),
      adminDb.from('training_sessions').select('*, bookings:session_bookings(status)').eq('coach_id', coachId).eq('scheduled_date', date)
    ]);

    if (!scheduleRes.data || !scheduleRes.data.is_working) {
      return NextResponse.json({ slots: [], message: 'Coach is not working on this day.' });
    }

    const duration = availRes.data?.session_duration || 60;
    const maxCapacity = availRes.data?.max_capacity || 1;
    const startTime = scheduleRes.data?.start_time || '09:00:00';
    const endTime = scheduleRes.data?.end_time || '17:00:00';

    const slots = [];
    const now = new Date();
    
    let current = parseISO(`${date}T${startTime}`);
    const end = parseISO(`${date}T${endTime}`);

    while (isBefore(current, end)) {
      const slotEnd = addMinutes(current, duration);
      if (isAfter(slotEnd, end)) break;

      const timeStr = format(current, 'HH:mm:ss');
      const isPast = isBefore(current, now);
      
      const existingSession = sessionsRes.data?.find(s => s.start_time === timeStr);
      // Count confirmed bookings plus external player bookings for this slot
      const confirmedBookingsCount = existingSession?.bookings?.filter((b: any) => b.status === 'CONFIRMED').length || 0;
      
      // If it is an external session in training_sessions, it doesn't have session_bookings.
      // But if it has is_external = true, we count it as a booking too!
      const isExternalReserved = existingSession?.is_external ? 1 : 0;
      const totalBookings = confirmedBookingsCount + isExternalReserved;
      
      slots.push({
        start_time: timeStr,
        end_time: format(slotEnd, 'HH:mm:ss'),
        display_time: format(current, 'hh:mm a'),
        max_capacity: maxCapacity,
        current_bookings: totalBookings,
        is_available: totalBookings < maxCapacity && !isPast,
        session_id: existingSession?.id || null
      });

      current = slotEnd;
    }

    return NextResponse.json({ 
      slots,
      coach_timezone: availRes.data?.timezone || 'UTC'
    });

  } catch (error: any) {
    console.error('Public slots error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
