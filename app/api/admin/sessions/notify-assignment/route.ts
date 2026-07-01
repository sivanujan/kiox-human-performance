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
    
    // Collect all unique IDs to batch fetch profiles and auth details
    const allIds = new Set<string>();

    if (notifyStaff) {
      const { data: staffProfiles } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["staff", "superadmin"]);
        
      if (staffProfiles) {
        staffProfiles.forEach(staff => allIds.add(staff.id));
      }
    }

    for (const session of sessions) {
      if (session.coachId) allIds.add(session.coachId);
      if (session.athleteIds && Array.isArray(session.athleteIds)) {
        session.athleteIds.forEach((id: string) => allIds.add(id));
      }
    }

    // 1. Batch fetch profiles in a single DB query
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, role")
      .in("id", Array.from(allIds));

    const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

    // 2. Fetch user auth details (emails) in parallel
    const userLookups = await Promise.all(
      Array.from(allIds).map(async (id) => {
        try {
          const { data } = await adminClient.auth.admin.getUserById(id);
          return { id, user: data?.user || null };
        } catch (e) {
          console.error("Error fetching user details from auth schema:", id, e);
          return { id, user: null };
        }
      })
    );

    const usersMap = new Map();
    userLookups.forEach(item => {
      if (item.user) usersMap.set(item.id, item.user);
    });

    // Map to collect sessions per recipient ID
    // Map<string, { email, name, role, sessions }>
    const recipientsMap = new Map<string, { email: string; name: string; role: string; sessions: { title: string; time: string }[] }>();

    const getRecipientSync = (id: string, defaultRole: string) => {
      if (recipientsMap.has(id)) return recipientsMap.get(id);
      
      const profileData = profilesMap.get(id);
      const userData = usersMap.get(id);
      
      if (userData && userData.email) {
        const rec = {
          email: userData.email,
          name: profileData?.first_name || defaultRole,
          role: profileData?.role === 'staff' || profileData?.role === 'superadmin' ? 'Staff' : (profileData?.role === 'athlete' ? 'Athlete' : 'Coach'),
          sessions: [] as { title: string; time: string }[]
        };
        recipientsMap.set(id, rec);
        return rec;
      }
      return null;
    };

    // Pre-populate staff in recipient map if notifyStaff is active
    if (notifyStaff) {
      const { data: staffProfiles } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["staff", "superadmin"]);
        
      if (staffProfiles) {
        staffProfiles.forEach(staff => getRecipientSync(staff.id, 'Staff'));
      }
    }

    // Process each session to add to relevant recipients
    for (const session of sessions) {
      const sData = { title: session.title, time: session.time };

      // Add to coach
      if (session.coachId) {
        const coachRec = getRecipientSync(session.coachId, 'Coach');
        if (coachRec && !coachRec.sessions.find(s => s.title === sData.title && s.time === sData.time)) {
          coachRec.sessions.push(sData);
        }
      }

      // Add to athletes
      if (session.athleteIds && Array.isArray(session.athleteIds)) {
        for (const aId of session.athleteIds) {
          const athleteRec = getRecipientSync(aId, 'Athlete');
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
    
    // Send all assignment emails in parallel
    await Promise.all(
      Array.from(recipientsMap.entries()).map(async ([id, recipient]) => {
        if (!recipient.email || recipient.sessions.length === 0) return;
        
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
      })
    );

    return NextResponse.json({ success: true, count: sentCount });
  } catch (err: any) {
    console.error("Notify Assignment Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
