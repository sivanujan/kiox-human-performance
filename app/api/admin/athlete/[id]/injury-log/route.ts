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
    .select("role, first_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin" && profile?.role !== "staff") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  // 3. Process Data
  const body = await request.json();
  const { injuryType, severity, bodyPart, notes, status } = body;

  // 4. Insert Injury Log
  const { data, error } = await supabase
    .from("athlete_injury_logs")
    .insert({
      athlete_id: athleteId,
      injury_type: injuryType,
      severity,
      body_part: bodyPart,
      notes,
      status,
      logged_by: user.id
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // --- TRIGGER PUSH NOTIFICATION ---
  await supabase.from("system_notifications").insert({
    recipient_id: athleteId,
    sender_id: user.id,
    title: "MEDICAL STATUS UPDATE",
    message: `A new ${injuryType} injury record has been logged by ${profile?.first_name || 'Staff'}.`,
    type: "UPDATE"
  });

  return NextResponse.json({ success: true, data });
}
