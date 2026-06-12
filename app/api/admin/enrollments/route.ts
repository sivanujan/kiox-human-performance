import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendEmail, getProgramApprovalTemplate } from "@/utils/email";

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
      program:programs!program_id (
        title, 
        category, 
        duration, 
        level, 
        coach_id,
        syllabus,
        weekly_commitment,
        recovery_blocks,
        coach:coach_id (first_name, last_name, avatar_url)
      )
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
export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, action } = body; // action: 'approve' | 'reject'

  if (!id) return NextResponse.json({ error: "Missing enrollment ID" }, { status: 400 });

  const updateData: any = {};
  if (action === 'approve') {
    updateData.status = 'active';
    updateData.payment_status = 'confirmed';
    updateData.approval_status = 'approved';
  } else if (action === 'reject') {
    updateData.status = 'dropped';
    updateData.payment_status = 'failed';
    updateData.approval_status = 'rejected';
  }

  const { data: enrollment, error } = await supabase
    .from("user_programs")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      user:user_id (first_name, last_name, email),
      program:programs!program_id (title, coach_id)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 4. Notify the assigned Coach if approved
  if (action === 'approve') {
    const coachId = (enrollment.program as any).coach_id;
    if (coachId) {
      await supabase.from('staff_notifications').insert({
        staff_id: coachId,
        type: 'PROGRAM_ASSIGNED',
        message: `PROTOCOL INITIALIZED: ${(enrollment.user as any).first_name} ${(enrollment.user as any).last_name} has been confirmed for "${(enrollment.program as any).title}". Management required.`,
        related_id: enrollment.id
      });
    }

    // 5. Send Approval Email to Athlete
    const athleteEmail = (enrollment.user as any).email;
    if (athleteEmail) {
      await sendEmail({
        to: athleteEmail,
        subject: `PROTOCOL INITIALIZED: ${(enrollment.program as any).title}`,
        html: getProgramApprovalTemplate(
          (enrollment.user as any).first_name + " " + (enrollment.user as any).last_name,
          (enrollment.program as any).title
        )
      });
    }
  }

  return NextResponse.json(enrollment);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const { error } = await supabase
    .from("user_programs")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
