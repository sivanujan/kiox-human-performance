import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all performance-related modules in parallel
  const [planRes, injuryRes, surveyRes, videoRes, noteRes] = await Promise.all([
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
      .select('*, added_by:profiles!trainer_notes_added_by_fkey(first_name, last_name)')
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  return NextResponse.json({
    activePlan: planRes.data,
    activeInjuries: injuryRes.data || [],
    pendingSurveys: surveyRes.data || [],
    videoFeedback: videoRes.data || [],
    trainerNotes: noteRes.data || []
  });
}
