import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendEmail, getBookingConfirmationTemplate } from '@/utils/email';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { bookingId, action } = await request.json(); // action: 'CONFIRM' or 'REJECT'

    // 1. Verify user is staff or admin
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !['staff', 'superadmin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Get Booking and Athlete Details
    const { data: booking, error: bookingError } = await supabase
        .from('session_bookings')
        .select(`
            *,
            athlete:profiles!session_bookings_athlete_id_fkey(*),
            session:training_sessions(*)
        `)
        .eq('id', bookingId)
        .single();

    if (bookingError || !booking) throw new Error("Booking not found");

    if (action === 'CONFIRM') {
        // 3. Update Booking Status
        await supabase
            .from('session_bookings')
            .update({ status: 'CONFIRMED', confirmed_at: new Date().toISOString() })
            .eq('id', bookingId);

        // 4. Notify Athlete (Dashboard)
        await supabase.from('athlete_notifications').insert({
            athlete_id: booking.athlete_id,
            type: 'BOOKING_CONFIRMED',
            message: `Deployment Confirmed! Your session on ${booking.session.scheduled_date} at ${booking.session.start_time} is now active.`,
            related_id: booking.id
        });

        // 5. Notify Coach (Dashboard)
        await supabase.from('staff_notifications').insert({
            staff_id: user.id,
            type: 'SYSTEM_ALERT',
            message: `You have confirmed the session for ${booking.athlete.first_name} on ${booking.session.scheduled_date}.`,
            related_id: booking.id
        });

        // 6. Send Email to Athlete
        if (booking.athlete.email) {
            await sendEmail({
                to: booking.athlete.email,
                subject: "Mission Confirmed: Your Training Session",
                html: getBookingConfirmationTemplate(
                    booking.athlete.first_name,
                    booking.session.scheduled_date,
                    booking.session.start_time,
                    booking.session.title || "Tactical Session",
                    false
                )
            });
        }

        // 7. Send Email to Coach
        if (profile.email) {
            await sendEmail({
                to: profile.email,
                subject: "Session Confirmation Receipt",
                html: getBookingConfirmationTemplate(
                    profile.first_name,
                    booking.session.scheduled_date,
                    booking.session.start_time,
                    booking.session.title || "Tactical Session",
                    true
                )
            });
        }

    } else if (action === 'REJECT') {
        await supabase
            .from('session_bookings')
            .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
            .eq('id', bookingId);

        await supabase.from('athlete_notifications').insert({
            athlete_id: booking.athlete_id,
            type: 'BOOKING_REJECTED',
            message: `Deployment Cancelled: Your request for ${booking.session.scheduled_date} was not approved.`,
            related_id: booking.id
        });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
