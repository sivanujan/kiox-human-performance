import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: athleteId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth & Admin Role Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "superadmin" && adminProfile?.role !== "staff") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  // 2. Fetch Athlete Metrics
  const { data: metrics, error } = await supabase
    .from("profiles")
    .select(`
      top_speed, distance, sprints, hrv, vo2_max, resting_hr, 
      power_output, high_intensity_efforts, recovery_index, 
      sleep_score, soreness, weekly_load, weekly_score, injury_risk,
      goals, assists, xg, pass_accuracy, duels_won, pressures,
      protocol_directives, last_intensity, last_duration,
      reaction_time, decision_score, focus_score, stress_level
    `)
    .eq("id", athleteId)
    .single();

  if (error) {
    console.error("Fetch metrics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(metrics);
}
