import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) return NextResponse.json({ error: 'Missing date range' }, { status: 400 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Optimized query: Only fetch necessary fields and specific user bookings
  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      id, 
      title, 
      scheduled_date, 
      start_time, 
      session_type, 
      is_special, 
      max_capacity,
      bookings:session_bookings(status, athlete_id)
    `)
    .gte('scheduled_date', start)
    .lte('scheduled_date', end)
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map to include user_booking_status and confirmed_count efficiently
  const sessions = data.map(session => {
    const userBooking = (session.bookings as any[])?.find(b => b.athlete_id === user.id);
    const confirmedCount = (session.bookings as any[])?.filter(b => b.status === 'CONFIRMED').length || 0;
    
    return {
      id: session.id,
      title: session.title,
      scheduled_date: session.scheduled_date,
      start_time: session.start_time,
      session_type: session.session_type,
      is_special: session.is_special,
      max_capacity: session.max_capacity,
      user_booking_status: userBooking?.status || null,
      confirmed_count: confirmedCount
    };
  });

  return NextResponse.json(sessions);
}
