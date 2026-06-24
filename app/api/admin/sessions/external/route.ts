import { createAdminClient } from "@/utils/supabase/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function generatePassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Verify Admin Session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !['staff', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 2. Parse request payload
    const { session_data, dates, external_clients } = await request.json();

    if (!session_data || !dates || !external_clients || !Array.isArray(external_clients) || external_clients.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const assignedAthleteIds: string[] = [];
    const createdClientsDetails: any[] = [];

    // 3. Provision each external client
    for (const client of external_clients) {
      const { first_name, last_name, email, phone, payment_status = 'PENDING', payment_notes = '', training_start_date, training_end_date } = client;

      if (!email || !first_name || !last_name) {
        continue;
      }

      let userId = '';
      let isNew = false;
      const tempPassword = generatePassword();

      // Attempt user creation
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { first_name, last_name, role: 'external' }
      });

      if (authError) {
        // If user already exists, retrieve their profile ID
        if (authError.message.includes('already') || authError.status === 422) {
          const { data: usersList } = await adminClient.auth.admin.listUsers();
          const foundUser = usersList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
          if (foundUser) {
            userId = foundUser.id;
          } else {
            return NextResponse.json({ error: `User exists but could not be resolved: ${authError.message}` }, { status: 500 });
          }
        } else {
          return NextResponse.json({ error: authError.message }, { status: 500 });
        }
      } else {
        userId = authData.user.id;
        isNew = true;
      }

      const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6);

      // Upsert profile for the external client
      const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({
          id: userId,
          first_name,
          last_name,
          username,
          phone_number: phone,
          role: 'external',
          status: 'active',
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error("Profile Upsert Error:", profileError);
      }

      assignedAthleteIds.push(userId);
      createdClientsDetails.push({
        id: userId,
        first_name,
        last_name,
        email,
        username,
        tempPassword,
        isNew,
        payment_status,
        payment_notes,
        training_start_date,
        training_end_date
      });
    }

    // 4. Create training sessions and bookings
    const createdSessions: any[] = [];
    for (const dateStr of dates) {
      const { data: session, error: sessionError } = await adminClient
        .from('training_sessions')
        .insert({
          title: session_data.title,
          session_type: 'CUSTOM',
          scheduled_date: dateStr,
          start_time: `${session_data.start_time}:00`,
          duration_minutes: Number(session_data.duration_minutes) || 60,
          location: session_data.location || 'HQ FIELD',
          notes: session_data.notes || '',
          assigned_by: user.id,
          coach_id: session_data.coach_id || null,
          is_external: true,
          payment_status: external_clients[0]?.payment_status || 'PENDING',
          payment_notes: external_clients[0]?.payment_notes || '',
          assigned_athletes: assignedAthleteIds
        })
        .select()
        .single();

      if (sessionError) {
        return NextResponse.json({ error: sessionError.message }, { status: 500 });
      }
      createdSessions.push(session);

      // Create session bookings
      for (const client of createdClientsDetails) {
        const { error: bookingError } = await adminClient
          .from('session_bookings')
          .insert({
            session_id: session.id,
            athlete_id: client.id,
            booked_by: user.id,
            status: client.payment_status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING',
            booking_type: 'ADMIN_ASSIGNED',
            notes: client.payment_notes || ''
          });

        if (bookingError) {
          console.error("Booking Insertion Error:", bookingError);
        }
      }
    }

    // 5. Send Welcome Invitation Email
    const { sendEmail, getExternalClientWelcomeTemplate } = await import("@/utils/email");
    for (const client of createdClientsDetails) {
      const emailSubject = client.isNew 
        ? "PROTOCOL INITIATED: Private Training Session Access" 
        : "Session Assignment Update: KIO-X Elite Portal";

      const welcomeHtml = getExternalClientWelcomeTemplate(
        `${client.first_name} ${client.last_name}`,
        session_data.title,
        dates[0],
        session_data.start_time.slice(0, 5),
        client.email,
        client.isNew ? client.tempPassword : "[Your Existing Password]"
      );

      const emailResult = await sendEmail({
        to: client.email,
        subject: emailSubject,
        html: welcomeHtml
      });
      
      if (!emailResult.success) {
        console.error("Failed to send email to", client.email, emailResult.error);
      }
    }

    return NextResponse.json({ success: true, sessions: createdSessions, clients: createdClientsDetails });
  } catch (err: any) {
    console.error("External Session Creation Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
// Force rebuild
