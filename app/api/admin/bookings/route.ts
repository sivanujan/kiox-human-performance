import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify the user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Check role using the user's OWN profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, first_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !['staff', 'superadmin'].includes(profile.role)) {
    const debugInfo = {
      userId: user.id,
      role: profile?.role || null,
      profileError: profileError?.message || null
    };
    console.error('Admin Bookings 403 Debug:', debugInfo);
    return NextResponse.json({ 
      error: 'Forbidden',
      debug: debugInfo
    }, { status: 403 });
  }

  // 3. Use service client ONLY for fetching all bookings (bypasses RLS to see all records)
  const adminDb = createServiceClient();

  // Fetch standard bookings + session info
  const [bookingsRes, extSessionsRes] = await Promise.all([
    adminDb
      .from('session_bookings')
      .select(`
        *,
        session:training_sessions(id, title, session_type, scheduled_date, start_time, max_capacity)
      `)
      .order('booked_at', { ascending: false }),
    adminDb
      .from('training_sessions')
      .select('*')
      .eq('is_external', true)
      .order('created_at', { ascending: false })
  ]);

  if (bookingsRes.error) {
    console.error('Admin bookings fetch error:', bookingsRes.error.message);
    return NextResponse.json({ error: bookingsRes.error.message }, { status: 500 });
  }

  const bookings = bookingsRes.data || [];
  const extSessions = extSessionsRes.data || [];

  // Separately fetch athlete profiles to avoid FK ambiguity for regular bookings
  const athleteIds = [...new Set(bookings.map((b: any) => b.athlete_id).filter(Boolean))];
  let athletes: any[] = [];
  if (athleteIds.length > 0) {
    const { data } = await adminDb
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, weekly_load, timezone, country, country_code')
      .in('id', athleteIds);
    athletes = data || [];
  }

  // Enrich standard bookings
  const enrichedBookings = bookings.map((b: any) => ({
    ...b,
    is_external: false,
    athlete: athletes?.find((a: any) => a.id === b.athlete_id) || null
  }));

  // Map external sessions to a format consistent with bookings
  const mappedExtSessions = extSessions.map((s: any) => ({
    id: s.id,
    is_external: true,
    status: s.payment_status === 'CONFIRMED' ? 'CONFIRMED' : (s.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING'),
    payment_status: s.payment_status || 'PENDING',
    notes: s.notes,
    booked_at: s.created_at,
    athlete_id: null,
    athlete: {
      first_name: s.external_player_name || 'External Player',
      last_name: '(External)',
      avatar_url: '',
      country_code: 'EXT',
      weekly_load: 0,
      timezone: 'UTC'
    },
    session: {
      id: s.id,
      title: s.title,
      session_type: s.session_type || 'CUSTOM',
      scheduled_date: s.scheduled_date,
      start_time: s.start_time,
      max_capacity: s.max_capacity || 1
    }
  }));

  // Merge lists and sort by date/time
  const combined = [...enrichedBookings, ...mappedExtSessions].sort((a: any, b: any) => {
    const dateA = new Date(a.booked_at || a.created_at || 0).getTime();
    const dateB = new Date(b.booked_at || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  return NextResponse.json(combined);
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Verify the user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check role using the user's own session
  const { data: profile } = await supabase.from('profiles').select('role, first_name').eq('id', user.id).single();
  if (!profile || !['staff', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service client for all booking operations (bypasses RLS)
  const adminDb = createServiceClient();

  try {
    const { bookingId, status, notes, isExternal } = await request.json();

    if (isExternal) {
      // Handle external session update in training_sessions table
      const updateData: any = {};
      if (status === 'CONFIRMED') {
        updateData.payment_status = 'CONFIRMED';
        updateData.confirmed_by_admin = true;
      } else if (status === 'CANCELLED') {
        updateData.status = 'CANCELLED';
        updateData.payment_status = 'PENDING'; // Keep pending or mark cancelled
        updateData.confirmed_by_admin = false;
      } else {
        updateData.payment_status = 'PENDING';
        updateData.confirmed_by_admin = false;
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { data, error } = await adminDb
        .from('training_sessions')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Create staff notification for admin action log
      await adminDb.from('staff_notifications').insert({
        staff_id: user.id,
        type: 'SYSTEM_ALERT',
        message: `You have updated external session payment/booking status to ${status} for session ID ${bookingId}.`,
        related_id: bookingId
      });

      return NextResponse.json(data);
    } else {
      // Standard booking flow
      const { data: booking, error: fetchError } = await adminDb
        .from('session_bookings')
        .select('*, session:training_sessions(title, scheduled_date, start_time)')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      const { data: bookingAthlete } = await adminDb
        .from('profiles')
        .select('first_name')
        .eq('id', booking.athlete_id)
        .single();

      const { data, error } = await adminDb
        .from('session_bookings')
        .update({ 
            status, 
            notes: notes || booking.notes,
            confirmed_at: status === 'CONFIRMED' ? new Date().toISOString() : booking.confirmed_at
        })
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      let notifType = '';
      let message = '';

      if (status === 'CONFIRMED') {
          notifType = 'BOOKING_CONFIRMED';
          message = `Coach has approved your booking for ${booking.session?.title || 'session'}.`;
      } else if (status === 'CANCELLED') {
          notifType = 'BOOKING_REJECTED';
          message = `Your booking for ${booking.session?.title || 'session'} was not approved by the coaching staff.`;
      }

      if (notifType) {
          await adminDb.from('athlete_notifications').insert({
              athlete_id: booking.athlete_id,
              type: notifType,
              message,
              related_id: bookingId
          });

          await adminDb.from('staff_notifications').insert({
              staff_id: user.id,
              type: 'SYSTEM_ALERT',
              message: `You have updated booking status to ${status} for athlete ${bookingAthlete?.first_name || 'Unknown'}.`,
              related_id: bookingId
          });

          // Email notifications (non-blocking)
          if (status === 'CONFIRMED') {
              try {
                  const { data: athleteAuthData } = await adminDb.auth.admin.getUserById(booking.athlete_id);
                  const athleteEmail = athleteAuthData?.user?.email;

                  const { sendEmail, getBookingConfirmationTemplate } = await import('@/utils/email');

                  if (athleteEmail) {
                      await sendEmail({
                          to: athleteEmail,
                          subject: "Mission Confirmed: Your Training Session",
                          html: getBookingConfirmationTemplate(
                              bookingAthlete?.first_name || 'Athlete',
                              booking.session?.scheduled_date || 'TBD',
                              booking.session?.start_time || 'TBD',
                              booking.session?.title || "Tactical Session",
                              false
                          )
                      });
                  }
                  
                  if (user.email) {
                      await sendEmail({
                          to: user.email,
                          subject: "Session Confirmation Receipt",
                          html: getBookingConfirmationTemplate(
                              profile.first_name || 'Staff',
                              booking.session?.scheduled_date || 'TBD',
                              booking.session?.start_time || 'TBD',
                              booking.session?.title || "Tactical Session",
                              true
                          )
                      });
                  }
              } catch (emailError) {
                  console.error('Email dispatch failed:', emailError);
              }
          }
      }

      return NextResponse.json(data);
    }

  } catch (error: any) {
    console.error('Booking action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
