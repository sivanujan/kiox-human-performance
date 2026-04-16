import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check if admin/staff
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['staff', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all active bookings with athlete and session details
  const { data: bookings, error } = await supabase
    .from('session_bookings')
    .select(`
      *,
      athlete:profiles(id, first_name, last_name, avatar_url, weekly_load),
      session:training_sessions(id, title, session_type, scheduled_date, start_time, max_capacity)
    `)
    .order('booked_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(bookings);
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { bookingId, status, notes } = await request.json();

    const { data: booking, error: fetchError } = await supabase
      .from('session_bookings')
      .select('*, session:training_sessions(title)')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('session_bookings')
      .update({ 
          status, 
          notes: notes || booking.notes,
          confirmed_at: status === 'CONFIRMED' ? new Date().toISOString() : booking.confirmed_at
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    // Create notification for athlete
    let notifType = '';
    let message = '';

    if (status === 'CONFIRMED') {
        notifType = 'BOOKING_CONFIRMED';
        message = `Coach has approved your booking for ${booking.session.title}.`;
    } else if (status === 'CANCELLED') {
        notifType = 'BOOKING_REJECTED';
        message = `Your booking for ${booking.session.title} was not approved by the coaching staff.`;
    }

    if (notifType) {
        await supabase.from('athlete_notifications').insert({
            athlete_id: booking.athlete_id,
            type: notifType,
            message,
            related_id: bookingId
        });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
