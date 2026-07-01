import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// GET: Fetch completed performance assessments for the logged-in athlete
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Retrieve all completed assessments (status = 'SUBMITTED') for the current logged-in user
    const { data: assessments, error } = await supabase
      .from("performance_assessments")
      .select("*")
      .eq("athlete_id", user.id)
      .eq("status", "SUBMITTED")
      .order("assessment_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const latest = assessments && assessments.length > 0 ? assessments[0] : null;

    return NextResponse.json({
      success: true,
      latest,
      history: assessments || []
    });
  } catch (err: any) {
    console.error("Fetch Athlete Assessments Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
