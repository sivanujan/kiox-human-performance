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

    const { dateStr, notifyStaff, sessions } = await request.json();
    if (!dateStr || !sessions || !Array.isArray(sessions)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    
    // Map to collect sessions per recipient ID
    // Map<string, { email, name, role, sessions }>
    const recipientsMap = new Map<string, { email: string; name: string; role: string; sessions: any[] }>();

    const getRecipient = async (id: string, defaultRole: string) => {
      if (recipientsMap.has(id)) return recipientsMap.get(id);
      
      const { data: profileData } = await supabase.from("profiles").select("first_name, role").eq("id", id).single();
      const { data: userData } = await adminClient.auth.admin.getUserById(id);
      
      if (userData?.user && userData.user.email) {
        const rec = {
          email: userData.user.email,
          name: profileData?.first_name || defaultRole,
          role: profileData?.role === 'staff' || profileData?.role === 'superadmin' ? 'Staff' : (profileData?.role === 'athlete' ? 'Athlete' : 'Coach'),
          sessions: []
        };
        recipientsMap.set(id, rec);
        return rec;
      }
      return null;
    };

    // Get all staff members if notifyStaff is true
    if (notifyStaff) {
      const { data: staffProfiles } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["staff", "superadmin"]);
        
      if (staffProfiles) {
        for (const staff of staffProfiles) {
          await getRecipient(staff.id, 'Staff');
        }
      }
    }

    // Process each session to add to relevant recipients
    for (const session of sessions) {
      const sData = { title: session.title, time: session.time };

      // Add to coach
      if (session.coachId) {
        const coachRec = await getRecipient(session.coachId, 'Coach');
        if (coachRec && !coachRec.sessions.find(s => s.title === sData.title && s.time === sData.time)) {
          coachRec.sessions.push(sData);
        }
      }

      // Add to athletes
      if (session.athleteIds && Array.isArray(session.athleteIds)) {
        for (const aId of session.athleteIds) {
          const athleteRec = await getRecipient(aId, 'Athlete');
          if (athleteRec && !athleteRec.sessions.find(s => s.title === sData.title && s.time === sData.time)) {
            athleteRec.sessions.push(sData);
          }
        }
      }

      // Add to staff (since staff receive ALL sessions)
      for (const [id, rec] of recipientsMap.entries()) {
        if (rec.role === 'Staff' && !rec.sessions.find(s => s.title === sData.title && s.time === sData.time)) {
          rec.sessions.push(sData);
        }
      }
    }

    const { sendEmail, getBulkSessionAssignmentTemplate } = await import("@/utils/email");
    
    let sentCount = 0;
    for (const [id, recipient] of recipientsMap.entries()) {
      if (!recipient.email || recipient.sessions.length === 0) continue;
      
      const emailSubject = "NEW ASSIGNMENTS: KIO-X Elite Portal";
      const htmlContent = getBulkSessionAssignmentTemplate(
        recipient.name,
        dateStr,
        recipient.role,
        recipient.sessions
      );

      const emailResult = await sendEmail({
        to: recipient.email,
        subject: emailSubject,
        html: htmlContent
      });
      
      if (!emailResult.success) {
        console.error("Failed to send email to", recipient.email, emailResult.error);
      } else {
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, count: sentCount });
  } catch (err: any) {
    console.error("Notify Assignment Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
