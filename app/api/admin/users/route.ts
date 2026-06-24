import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createCookieClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { userId, role, status, avatar_url, confirmEmail, team_id } = body;

  if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

  // Handle Manual Email Confirmation
  if (confirmEmail) {
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
    return NextResponse.json({ message: "Email confirmed via authority override" });
  }

  const updateData: any = {};
  if (role) updateData.role = role;
  if (status) updateData.status = status;
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
  if (team_id !== undefined) updateData.team_id = team_id || null;

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { 
    email, 
    password, 
    first_name, 
    last_name, 
    username, 
    avatar_url, 
    role = "athlete",
    team_id 
  } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name, username }
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  // 2. Update the profile (the trigger should have already created the id)
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name,
      last_name,
      username,
      avatar_url,
      role: role,
      status: "active",
      team_id
    })
    .eq("id", authData.user.id)
    .select()
    .single();

  if (profileError) {
    // If update fails, we still have the user in Auth, but the profile is incomplete
    return NextResponse.json({ 
      error: "User created but profile update failed: " + profileError.message,
      user: authData.user 
    }, { status: 500 });
  }

  // 3. Send the Welcome Email with Credentials
  const { sendEmail, getInternalAthleteWelcomeTemplate } = await import("@/utils/email");
  const emailHtml = getInternalAthleteWelcomeTemplate(
    `${first_name} ${last_name}`,
    email,
    username,
    password
  );

  const { success: emailSuccess, error: emailError } = await sendEmail({
    to: email,
    subject: "PROTOCOL INITIATED: Tactical Access Provisioned",
    html: emailHtml
  });

  if (!emailSuccess) {
    console.error("Failed to send welcome email to internal user:", emailError);
  }

  return NextResponse.json(profileData);
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // 1. Verify that the requester is a Super Admin
    const cookieStore = await cookies();
    const cookieClient = createCookieClient(cookieStore);
    
    const { data: { user: currentUser }, error: authCheckError } = await cookieClient.auth.getUser();
    if (authCheckError || !currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: currentProfile, error: profileCheckError } = await cookieClient
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (profileCheckError || !currentProfile || currentProfile.role !== 'superadmin') {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // 2. Instantiate the Admin/Service Role Client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Remove the user from any training sessions assigned_athletes array
    const { data: sessions } = await adminSupabase
      .from('training_sessions')
      .select('id, assigned_athletes')
      .contains('assigned_athletes', [userId]);

    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        const updatedAthletes = session.assigned_athletes.filter((id: string) => id !== userId);
        await adminSupabase
          .from('training_sessions')
          .update({ assigned_athletes: updatedAthletes })
          .eq('id', session.id);
      }
    }

    // 4. Delete the user from Auth (this cascades to profiles, bookings, and notifications)
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Agent successfully decommissioned." });
  } catch (err: any) {
    console.error("User Deletion Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
