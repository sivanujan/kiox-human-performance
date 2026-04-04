import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  let query = supabase
    .from("user_programs")
    .select(`
      *,
      program:program_id (title, category, duration, level)
    `);

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.order("enrolled_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, programId, notes } = body;

  if (!userId || !programId) {
    return NextResponse.json({ error: "Missing required fields (userId, programId)" }, { status: 400 });
  }

  // Check if user already has this program active
  const { data: existing } = await supabase
    .from("user_programs")
    .select("id")
    .eq("user_id", userId)
    .eq("program_id", programId)
    .eq("status", "active")
    .single();

  if (existing) {
    return NextResponse.json({ error: "Athlete already has this protocol active." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_programs")
    .insert([{
      user_id: userId,
      program_id: programId,
      status: "active",
      notes
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
