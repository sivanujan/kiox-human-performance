import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAthleteId(supabase: any, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, parent_of')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.role === 'parent' && profile.parent_of) {
    return profile.parent_of;
  }
  return userId;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const athleteId = await getAthleteId(supabase, user.id);

    // Fetch all performance-related modules in parallel for the resolved athlete ID
    const [planRes, injuryRes, surveyRes, videoRes, noteRes, alertRes, assessmentRes] = await Promise.all([
      supabase
        .from("athlete_training_plans")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("athlete_injury_logs")
        .select("*")
        .eq("athlete_id", athleteId)
        .neq("status", "Cleared")
        .order("logged_at", { ascending: false }),
      supabase
        .from("athlete_surveys")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("status", "pending")
        .order("due_date", { ascending: true }),
      supabase
        .from("athlete_video_feedback")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("uploaded_at", { ascending: false })
        .limit(5),
      supabase
        .from("trainer_notes")
        .select('*, added_by:profiles(first_name, last_name)')
        .eq("user_id", athleteId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("athlete_alerts")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("alert_type", "MEDICAL_CLEARANCE_REQUEST")
        .eq("is_resolved", false)
        .maybeSingle(),
      supabase
        .from("performance_assessments")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("status", "SUBMITTED")
        .order("assessment_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("training_status, recovery_index")
      .eq("id", athleteId)
      .single();

    return NextResponse.json({
      activePlan: planRes.data,
      activeInjuries: injuryRes.data || [],
      pendingSurveys: surveyRes.data || [],
      videoFeedback: videoRes.data || [],
      trainerNotes: noteRes.data || [],
      clearanceRequest: alertRes.data,
      profileStatus: profileData?.training_status || 'READY',
      profileRecovery: profileData?.recovery_index || 0,
      latestAssessment: assessmentRes.data || null
    });
  } catch (err: any) {
    console.error("Performance Hub Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

