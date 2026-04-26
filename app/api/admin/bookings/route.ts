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

  // 2. Check role using the user's OWN session (always works - user can read own profile)
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

  // Fetch bookings + session info (no ambiguous profile FK joins)
  const { data: bookings, error } = await adminDb
    .from('session_bookings')
    .select(`
      *,
      session:training_sessions(id, title, session_type, scheduled_date, start_time, max_capacity)
    `)
    .order('booked_at', { ascending: false });

  if (error) {
    console.error('Admin bookings fetch error:', error.message, error.details, error.hint);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json([]);
  }

  // Separately fetch athlete profiles to avoid FK ambiguity
  // (session_bookings has 3 FKs to profiles: athlete_id, booked_by, cancelled_by)
  const athleteIds = [...new Set(bookings.map((b: any) => b.athlete_id).filter(Boolean))];
  const { data: athletes } = await adminDb
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, weekly_load')
    .in('id', athleteIds);

  // Merge athlete data into bookings
  const enrichedBookings = bookings.map((b: any) => ({
    ...b,
    athlete: athletes?.find((a: any) => a.id === b.athlete_id) || null
  }));

  return NextResponse.json(enrichedBookings);
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Verify the user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check role using the user's own session (always works)
  const { data: profile } = await supabase.from('profiles').select('role, first_name').eq('id', user.id).single();
  if (!profile || !['staff', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service client for all booking operations (bypasses RLS)
  const adminDb = createServiceClient();

  try {
    const { bookingId, status, notes } = await request.json();

    const { data: booking, error: fetchError } = await adminDb
      .from('session_bookings')
      .select('*, session:training_sessions(title, scheduled_date, start_time)')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    // Fetch athlete separately to avoid FK ambiguity
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
      .select()
      .single();

    if (error) throw error;

    // Create notification for athlete
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
        // Create notification for athlete
        await adminDb.from('athlete_notifications').insert({
            athlete_id: booking.athlete_id,
            type: notifType,
            message,
            related_id: bookingId
        });

        // Create notification for coach/admin
        await adminDb.from('staff_notifications').insert({
            staff_id: user.id,
            type: 'SYSTEM_ALERT',
            message: `You have updated booking status to ${status} for athlete ${bookingAthlete?.first_name || 'Unknown'}.`,
            related_id: bookingId
        });

        // Send Email to Athlete
        if (status === 'CONFIRMED') {
            try {
                // Get emails from auth table since they are not in profiles
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
                
                // Also email the staff member confirmation
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
                console.error('Email dispatch failed (non-blocking):', emailError);
                // Don't fail the booking confirmation just because email failed
            }
        }
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Booking action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
