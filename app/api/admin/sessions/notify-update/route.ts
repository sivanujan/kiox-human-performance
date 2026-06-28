import { createAdminClient } from "@/utils/supabase/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

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

    const { sessionTitle, dateStr, changes, recipientIds } = await request.json();
    if (!sessionTitle || !dateStr || !recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { sendEmail, getSessionUpdateEmailTemplate } = await import("@/utils/email");
    
    // Unique list of recipient IDs
    const uniqueIds = Array.from(new Set<string>(recipientIds));
    let sentCount = 0;

    for (const id of uniqueIds) {
      try {
        const { data: profileData } = await supabase.from("profiles").select("first_name, role").eq("id", id).maybeSingle();
        const { data: userData } = await adminClient.auth.admin.getUserById(id);

        if (userData?.user && userData.user.email) {
          const recipientName = profileData?.first_name || "User";
          const recipientRole = profileData?.role === 'staff' || profileData?.role === 'superadmin' ? 'Staff' : (profileData?.role === 'athlete' ? 'Athlete' : 'Coach');

          const emailSubject = `SESSION UPDATE: ${sessionTitle.toUpperCase()} (${dateStr})`;
          const htmlContent = getSessionUpdateEmailTemplate(
            recipientName,
            sessionTitle,
            dateStr,
            recipientRole,
            changes || []
          );

          const emailResult = await sendEmail({
            to: userData.user.email,
            subject: emailSubject,
            html: htmlContent
          });

          if (emailResult.success) sentCount++;
        }
      } catch (e) {
        console.error(`Failed to send update email to ${id}:`, e);
      }
    }

    return NextResponse.json({ success: true, count: sentCount });
  } catch (err: any) {
    console.error("Notify Session Update Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
