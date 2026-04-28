import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("programId");

  if (!programId) return NextResponse.json({ error: "Missing programId" }, { status: 400 });

  const { data, error } = await supabase
    .from("program_schedule")
    .select(`
      *,
      program:program_id (
        coach:coach_id (timezone)
      )
    `)
    .eq("program_id", programId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { program_id, day_of_week, start_time, duration_minutes, title, notes } = body;

  const { data, error } = await supabase
    .from("program_schedule")
    .insert([{
      program_id,
      day_of_week,
      start_time,
      duration_minutes: Number(duration_minutes) || 60,
      title,
      notes
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const { error } = await supabase
    .from("program_schedule")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
