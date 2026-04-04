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
    .from("assessments")
    .select(`
      *,
      staff:staff_id (first_name, last_name)
    `);

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.order("assessment_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, staffId, assessmentDate, assessmentType, status, results } = body;

  if (!userId || !assessmentDate || !assessmentType) {
    return NextResponse.json({ error: "Missing required fields (userId, assessmentDate, assessmentType)" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("assessments")
    .insert([{
      user_id: userId,
      staff_id: staffId,
      assessment_date: assessmentDate,
      assessment_type: assessmentType,
      status: status || 'scheduled',
      results: results || {}
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
