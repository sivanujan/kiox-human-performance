import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const today = new Date().toISOString().split('T')[0];

    // 2. Fetch sessions assigned to this athlete for today
    const { data: sessions, error } = await supabase
      .from("training_sessions")
      .select("*")
      .contains("assigned_athletes", [user.id])
      .eq("scheduled_date", today)
      .order("start_time", { ascending: true });

    if (error) throw error;

    return NextResponse.json(sessions || []);
  } catch (error: any) {
    console.error("Failed to fetch today's sessions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
