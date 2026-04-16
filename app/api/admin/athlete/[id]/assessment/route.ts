import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { recalculateAthleteMetrics } from "@/utils/analytics-engine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: athleteId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Role Check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin" && profile?.role !== "staff") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  // 3. Process Data
  const body = await request.json();
  const { type, metrics, date } = body;

  try {
    if (type === 'PHYSICAL') {
      const sessionIntensity = parseInt(String(metrics.intensity)) || 5;
      const sessionDuration = parseInt(String(metrics.duration)) || 60;
      const calculatedLoad = sessionIntensity * sessionDuration;

      const { data, error: logError } = await supabase
        .from("performance_logs")
        .insert({
          user_id: athleteId,
          date: date || new Date().toISOString().split('T')[0],
          top_speed_kmh: parseFloat(String(metrics.top_speed)) || 0,
          total_distance_km: parseFloat(String(metrics.distance)) || 0,
          sprint_count: parseInt(String(metrics.sprints)) || 0,
          power_output_watts: parseFloat(String(metrics.power)) || 0,
          vo2_max: parseFloat(String(metrics.vo2_max)) || 0,
          training_load_au: calculatedLoad,
          duration_mins: sessionDuration
        })
        .select()
        .single();

      if (logError) {
         console.error("Log error:", logError);
         throw new Error(`Failed to save historical log: ${logError.message}`);
      }

      // --- SYNC TO LIVE PROFILE ---
      const { error: syncError } = await supabase
        .from("profiles")
        .update({
          top_speed: parseFloat(String(metrics.top_speed)) || 0,
          distance: parseFloat(String(metrics.distance)) || 0,
          sprints: parseInt(String(metrics.sprints)) || 0,
          power_output: parseFloat(String(metrics.power)) || 0,
          vo2_max: parseFloat(String(metrics.vo2_max)) || 0,
          protocol_directives: metrics.directives || 'SUBJECT PROTOCOL NEUTRAL // NO DIRECTIVES FOUND',
          last_intensity: parseInt(String(metrics.intensity)) || 5,
          last_duration: parseInt(String(metrics.duration)) || 60
        })
        .eq("id", athleteId);

      if (syncError) {
         console.error("Profile sync error:", syncError);
         throw new Error(`Log saved, but failed to sync to live dashboard: ${syncError.message}. Check if you've run the Security Fix in Supabase.`);
      }

      // --- BACKGROUND ANALYTICS SYNC ---
      await recalculateAthleteMetrics(supabase, athleteId);

      return NextResponse.json({ success: true, data });

    } else if (type === 'MATCH') {
      const { data, error: logError } = await supabase
        .from("match_stats")
        .insert({
          user_id: athleteId,
          match_date: date || new Date().toISOString().split('T')[0],
          opponent: metrics.opponent || 'TBD',
          goals: parseInt(String(metrics.goals)) || 0,
          assists: parseInt(String(metrics.assists)) || 0,
          xg: parseFloat(String(metrics.xg)) || 0,
          pass_accuracy_percent: parseInt(String(metrics.pass_accuracy)) || 0,
          duels_won_percent: parseInt(String(metrics.duels_won)) || 0,
          pressures: parseInt(String(metrics.pressures)) || 0
        })
        .select()
        .single();

      if (logError) {
         console.error("Log error:", logError);
         throw new Error(`Failed to save historical log: ${logError.message}`);
      }

      // --- SYNC TO LIVE PROFILE ---
      const { error: syncError } = await supabase
        .from("profiles")
        .update({
          goals: parseInt(String(metrics.goals)) || 0,
          assists: parseInt(String(metrics.assists)) || 0,
          xg: parseFloat(String(metrics.xg)) || 0,
          pass_accuracy: parseInt(String(metrics.pass_accuracy)) || 0,
          duels_won: parseInt(String(metrics.duels_won)) || 0,
          pressures: parseInt(String(metrics.pressures)) || 0,
          protocol_directives: metrics.directives || 'SUBJECT PROTOCOL NEUTRAL // NO DIRECTIVES FOUND'
        })
        .eq("id", athleteId);

      if (syncError) {
         console.error("Profile sync error:", syncError);
         throw new Error(`Log saved, but failed to sync to live dashboard: ${syncError.message}. Check if you've run the Security Fix in Supabase.`);
      }

      // --- BACKGROUND ANALYTICS SYNC ---
      await recalculateAthleteMetrics(supabase, athleteId);

      return NextResponse.json({ success: true, data });
    } else if (type === 'COGNITIVE') {
       const { error: syncError } = await supabase
        .from("profiles")
        .update({
          reaction_time: parseInt(String(metrics.reaction_time)) || 0,
          decision_score: parseInt(String(metrics.decision_score)) || 0,
          focus_score: parseInt(String(metrics.focus_score)) || 0,
          stress_level: metrics.stress_level || 'Low'
        })
        .eq("id", athleteId);

      if (syncError) throw new Error(`Failed to sync cognitive metrics: ${syncError.message}`);
      return NextResponse.json({ success: true });

    } else if (type === 'PROGRAM') {
      // 1. Deactivate old plans
      await supabase
        .from("athlete_training_plans")
        .update({ is_active: false })
        .eq("athlete_id", athleteId);

      // 2. Insert new plan
      const { data, error } = await supabase
        .from("athlete_training_plans")
        .insert({
          athlete_id: athleteId,
          title: metrics.title || "Custom Training Phase",
          phase: metrics.phase || "Tactical",
          notes: metrics.notes || "",
          effective_date: date || new Date().toISOString().split('T')[0],
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to assign program: ${error.message}`);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "Invalid assessment type" }, { status: 400 });

  } catch (error: any) {
    console.error("Assessment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
