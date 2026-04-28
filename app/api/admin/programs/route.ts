import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { title, description, duration, level, category, price, max_athletes, coach_id, weekly_commitment, recovery_blocks, session_time, syllabus } = body;

  const { data, error } = await supabase
    .from("programs")
    .insert([{
      title,
      description,
      duration,
      level,
      category,
      price: Number(price) || 0,
      max_athletes: Number(max_athletes) || 0,
      coach_id: coach_id || null,
      weekly_commitment: Number(weekly_commitment) || 4,
      recovery_blocks: Number(recovery_blocks) || 3,
      session_time: session_time || null,
      syllabus: syllabus || [],
      is_active: true
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Handle Coach Notification
  if (coach_id) {
    try {
      // 1. Create System Notification
      await supabase.from('staff_notifications').insert({
        staff_id: coach_id,
        type: 'PROGRAM_ASSIGNED',
        message: `AUTHORITY ASSIGNMENT: You have been appointed lead supervisor for the "${title}" architecture.`,
        related_id: data.id
      });

      // 2. Send Email
      const { data: coachProfile } = await supabase.auth.admin.getUserById(coach_id);
      const coachEmail = coachProfile.user?.email;

      if (coachEmail) {
        const { sendEmail } = require('@/utils/email');
        await sendEmail({
          to: coachEmail,
          subject: `GOVERNANCE ASSIGNMENT: ${title}`,
          html: `
            <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px; border: 1px solid #22c55e;">
              <h1 style="color: #22c55e; letter-spacing: 2px;">PROTOCOL ASSIGNED</h1>
              <p>You have been officially assigned as the lead coach for the following program:</p>
              <div style="background: #111; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h2 style="margin: 0; color: #fff;">${title}</h2>
                <p style="color: #666; font-size: 12px; margin-top: 5px;">${category} // ${level}</p>
              </div>
              <p>You now have authority to enroll athletes and manage this protocol matrix.</p>
              <hr style="border: 1px solid #333; margin: 20px 0;">
              <p style="font-size: 10px; color: #444;">KIO-X MATRIX ACCESS // ELITE PERFORMANCE HUB</p>
            </div>
          `
        });
      }
    } catch (notifyErr) {
      console.error("Coach notification failed:", notifyErr);
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing program ID" }, { status: 400 });

  const { error } = await supabase
    .from("programs")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { id, title, description, duration, level, category, price, max_athletes, coach_id, weekly_commitment, recovery_blocks, session_time, syllabus } = body;

  if (!id) return NextResponse.json({ error: "Missing program ID" }, { status: 400 });

  // 1. Fetch current program to check if coach changed
  const { data: currentProgram } = await supabase
    .from("programs")
    .select("coach_id")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("programs")
    .update({
      title,
      description,
      duration,
      level,
      category,
      price: Number(price) || 0,
      max_athletes: Number(max_athletes) || 0,
      coach_id: coach_id || null,
      weekly_commitment: Number(weekly_commitment) || 4,
      recovery_blocks: Number(recovery_blocks) || 3,
      session_time: session_time || null,
      syllabus: syllabus || []
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Handle Coach Notification if coach changed
  const coachChanged = coach_id && coach_id !== currentProgram?.coach_id;
  
  if (coachChanged) {
    try {
      // 1. Create System Notification
      await supabase.from('staff_notifications').insert({
        staff_id: coach_id,
        type: 'PROGRAM_ASSIGNED',
        message: `AUTHORITY ASSIGNMENT: You have been appointed lead supervisor for the "${title}" architecture.`,
        related_id: data.id
      });

      // 2. Send Email
      const { data: coachProfile } = await supabase.auth.admin.getUserById(coach_id);
      const coachEmail = coachProfile.user?.email;

      if (coachEmail) {
        const { sendEmail } = require('@/utils/email');
        await sendEmail({
          to: coachEmail,
          subject: `GOVERNANCE ASSIGNMENT: ${title}`,
          html: `
            <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px; border: 1px solid #22c55e;">
              <h1 style="color: #22c55e; letter-spacing: 2px;">PROTOCOL ASSIGNED</h1>
              <p>You have been officially assigned as the lead coach for the following program:</p>
              <div style="background: #111; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h2 style="margin: 0; color: #fff;">${title}</h2>
                <p style="color: #666; font-size: 12px; margin-top: 5px;">${category} // ${level}</p>
              </div>
              <p>You now have authority to enroll athletes and manage this protocol matrix.</p>
              <hr style="border: 1px solid #333; margin: 20px 0;">
              <p style="font-size: 10px; color: #444;">KIO-X MATRIX ACCESS // ELITE PERFORMANCE HUB</p>
            </div>
          `
        });
      }
    } catch (notifyErr) {
      console.error("Coach notification failed:", notifyErr);
    }
  }

  return NextResponse.json(data);
}
