import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { format, parseISO, addMinutes, isBefore, isAfter, isEqual } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coachId = searchParams.get('coachId');
  const date = searchParams.get('date'); // yyyy-MM-dd

  if (!coachId || !date) {
    return NextResponse.json({ error: 'Missing coachId or date' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    // 1. Get Coach Schedule for the day of week
    const dayName = format(parseISO(date), 'EEEE');
    
    const [scheduleRes, availRes, sessionsRes] = await Promise.all([
      supabase.from('coach_schedule').select('*').eq('coach_id', coachId).eq('day_name', dayName).single(),
      supabase.from('coach_availability').select('*').eq('coach_id', coachId).maybeSingle(),
      supabase.from('training_sessions').select('*, bookings:session_bookings(status)').eq('coach_id', coachId).eq('scheduled_date', date)
    ]);

    if (!scheduleRes.data || !scheduleRes.data.is_working) {
      return NextResponse.json({ slots: [], message: 'Coach is not working on this day.' });
    }

    const duration = availRes.data?.session_duration || 60;
    const maxCapacity = availRes.data?.max_capacity || 1;
    const startTime = scheduleRes.data.start_time; // HH:mm:ss
    const endTime = scheduleRes.data.end_time;

    // 2. Generate Slots
    const slots = [];
    let current = parseISO(`${date}T${startTime}`);
    const end = parseISO(`${date}T${endTime}`);

    while (isBefore(current, end)) {
      const slotEnd = addMinutes(current, duration);
      if (isAfter(slotEnd, end)) break;

      const timeStr = format(current, 'HH:mm:ss');
      
      // Check if a session already exists for this slot
      const existingSession = sessionsRes.data?.find(s => s.start_time === timeStr);
      const confirmedBookings = existingSession?.bookings?.filter((b: any) => b.status === 'CONFIRMED').length || 0;
      
      slots.push({
        start_time: timeStr,
        end_time: format(slotEnd, 'HH:mm:ss'),
        display_time: format(current, 'hh:mm a'),
        max_capacity: maxCapacity,
        current_bookings: confirmedBookings,
        is_available: confirmedBookings < maxCapacity,
        session_id: existingSession?.id || null
      });

      current = slotEnd;
    }

    return NextResponse.json({ slots });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
