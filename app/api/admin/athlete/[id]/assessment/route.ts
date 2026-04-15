import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const athleteId = params.id;
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
      const { data, error } = await supabase
        .from("performance_logs")
        .insert({
          user_id: athleteId,
          date: date || new Date().toISOString().split('T')[0],
          top_speed_kmh: metrics.top_speed,
          total_distance_km: metrics.distance,
          sprint_count: metrics.sprints,
          power_output_watts: metrics.power,
          vo2_max: metrics.vo2_max
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });

    } else if (type === 'MATCH') {
      const { data, error } = await supabase
        .from("match_stats")
        .insert({
          user_id: athleteId,
          match_date: date || new Date().toISOString().split('T')[0],
          opponent: metrics.opponent || 'TBD',
          goals: metrics.goals,
          assists: metrics.assists,
          xg: metrics.xg,
          pass_accuracy_percent: metrics.pass_accuracy,
          duels_won_percent: metrics.duels_won,
          pressures: metrics.pressures
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "Invalid assessment type" }, { status: 400 });

  } catch (error: any) {
    console.error("Assessment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
