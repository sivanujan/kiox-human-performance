import { createAdminClient } from "@/utils/supabase/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 2. Process Invitation
    const { email, first_name, last_name, role, team_id } = await request.json();
    
    if (!email || !first_name || !last_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Fetch team name for the template
    let teamName = "UNASSIGNED UNIT";
    if (team_id) {
      const { data: teamData } = await adminClient
        .from("teams")
        .select("name")
        .eq("id", team_id)
        .single();
      if (teamData) teamName = teamData.name;
    }

    // Generate secure invitation link
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: {
          first_name,
          last_name,
          role: role || 'staff',
          team_id
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=/reset-password`
      }
    });

    if (inviteError) {
      console.error("Link Generation Error:", inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    // Send high-fidelity branded email
    const { sendEmail, getInviteEmailTemplate } = await import("@/utils/email");
    
    // Construct manual callback link using token_hash for SSR compatibility
    const hashedToken = (inviteData.properties as any).hashed_token;
    const tacticalInviteLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?token_hash=${hashedToken}&type=invite&next=/reset-password`;
    
    const emailHtml = getInviteEmailTemplate(`${first_name} ${last_name}`, tacticalInviteLink, teamName);
    
    const { success: emailSuccess, error: emailDispatchError } = await sendEmail({
      to: email,
      subject: "PROTOCOL INITIATED: Tactical Access Provisioned",
      html: emailHtml
    });

    if (!emailSuccess) {
      console.error("Branded Email Dispatch Failed:", emailDispatchError);
      // We don't fail here because the user is technically invited in Auth, 
      // but in production we might want to return an error.
    }

    // 3. Provision Profile
    // The handle_new_user trigger will create a basic profile, 
    // but we need to ensure the role and team are set correctly immediately.
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        first_name,
        last_name,
        role: role || 'staff',
        team_id,
        status: 'active'
      })
      .eq("id", inviteData.user.id);

    if (profileError) {
      console.error("Profile Update Error:", profileError);
      // We don't return error here because the user is already invited, 
      // but we should log it.
    }

    return NextResponse.json({ success: true, user: inviteData.user });
  } catch (err) {
    console.error("Invitation Route Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
