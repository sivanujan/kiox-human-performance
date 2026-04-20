import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
    .select("role, first_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin" && profile?.role !== "staff") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  // 3. Process Data
  const body = await request.json();
  const { surveyType, dueDate, instructions } = body;

  // 4. Insert Survey Assignment
  const { data, error } = await supabase
    .from("athlete_surveys")
    .insert({
      athlete_id: athleteId,
      survey_type: surveyType,
      due_date: dueDate,
      instructions,
      assigned_by: user.id
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // --- TRIGGER PUSH NOTIFICATION ---
  await supabase.from("system_notifications").insert({
    recipient_id: athleteId,
    sender_id: user.id,
    title: "NEW ASSESSMENT ISSUED",
    message: `${profile?.first_name || 'Staff'} assigned a new ${surveyType} survey. Due: ${dueDate}`,
    type: "UPDATE"
  });

  return NextResponse.json({ success: true, data });
}
