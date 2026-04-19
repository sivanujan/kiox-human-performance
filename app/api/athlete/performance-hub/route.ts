import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch all performance-related modules in parallel
    const [planRes, injuryRes, surveyRes, videoRes, noteRes, alertRes] = await Promise.all([
      supabase
        .from("athlete_training_plans")
        .select("*")
        .eq("athlete_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("athlete_injury_logs")
        .select("*")
        .eq("athlete_id", user.id)
        .neq("status", "Cleared")
        .order("logged_at", { ascending: false }),
      supabase
        .from("athlete_surveys")
        .select("*")
        .eq("athlete_id", user.id)
        .eq("status", "pending")
        .order("due_date", { ascending: true }),
      supabase
        .from("athlete_video_feedback")
        .select("*")
        .eq("athlete_id", user.id)
        .order("uploaded_at", { ascending: false })
        .limit(5),
      supabase
        .from("trainer_notes")
        .select('*, added_by:profiles(first_name, last_name)')
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("athlete_alerts")
        .select("*")
        .eq("athlete_id", user.id)
        .eq("alert_type", "MEDICAL_CLEARANCE_REQUEST")
        .eq("is_resolved", false)
        .maybeSingle()
    ]);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("training_status, recovery_index")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      activePlan: planRes.data,
      activeInjuries: injuryRes.data || [],
      pendingSurveys: surveyRes.data || [],
      videoFeedback: videoRes.data || [],
      trainerNotes: noteRes.data || [],
      clearanceRequest: alertRes.data,
      profileStatus: profileData?.training_status || 'READY',
      profileRecovery: profileData?.recovery_index || 0
    });
  } catch (err: any) {
    console.error("Performance Hub Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
