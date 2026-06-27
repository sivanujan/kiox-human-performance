import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("programs")
    .select(`*, user_programs(user_id, status)`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

async function getScheduleHtml(supabase: any, programId: string) {
  const { data: schedule } = await supabase.from('program_schedule').select('*').eq('program_id', programId).order('day_of_week', { ascending: true });
  
  let scheduleHtml = '';
  if (schedule && schedule.length > 0) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    scheduleHtml = '<div style="margin-top: 20px;"><h3 style="color: #00ff88; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Weekly Schedule</h3><ul style="color: #ccc; list-style: none; padding: 0;">';
    schedule.forEach((s: any) => {
      const timeStr = s.start_time ? s.start_time.slice(0,5) : '';
      scheduleHtml += `<li style="margin-bottom: 8px; font-size: 13px;"><strong style="color: #fff; display: inline-block; width: 80px;">${days[s.day_of_week]}</strong> <span style="color: #00ff88;">${timeStr}</span> &mdash; ${s.title} (${s.duration_minutes} min)</li>`;
    });
    scheduleHtml += '</ul></div>';
  } else {
    scheduleHtml = '<div style="margin-top: 20px; color: #666; font-size: 12px; font-style: italic;"><p>Schedule is currently pending deployment. You will be notified when dates and times are finalized.</p></div>';
  }
  return scheduleHtml;
}

async function notifyAthletes(supabase: any, userIds: string[], programId: string, programTitle: string, programCategory: string, programLevel: string) {
  const { sendEmail } = require('@/utils/email');
  const scheduleHtml = await getScheduleHtml(supabase, programId);

  for (const userId of userIds) {
    try {
      const { data: userProfile } = await supabase.auth.admin.getUserById(userId);
      const email = userProfile?.user?.email;
      
      const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', userId).single();
      const firstName = profile?.first_name || 'Athlete';

      if (email) {
        await sendEmail({
          to: email,
          subject: `PROTOCOL ASSIGNED: ${programTitle}`,
          html: `
            <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px; border: 1px solid #22c55e;">
              <h1 style="color: #22c55e; letter-spacing: 2px;">NEW PROTOCOL ASSIGNED</h1>
              <p>Hello ${firstName},</p>
              <p>You have been assigned to a new protocol by your coaching staff:</p>
              <div style="background: #111; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h2 style="margin: 0; color: #fff;">${programTitle}</h2>
                <p style="color: #666; font-size: 12px; margin-top: 5px;">${programCategory} // ${programLevel}</p>
                ${scheduleHtml}
              </div>
              <p>Check your dashboard and calendar for session details and upcoming events.</p>
              <hr style="border: 1px solid #333; margin: 20px 0;">
              <p style="font-size: 10px; color: #444;">KIO-X MATRIX ACCESS // ELITE PERFORMANCE HUB</p>
            </div>
          `
        });
      }

      await supabase.from('system_notifications').insert({
        recipient_id: userId,
        title: 'PROTOCOL ASSIGNED',
        message: `You have been assigned to ${programTitle}. Check your calendar for details.`,
        type: 'UPDATE'
      });
    } catch (e) {
      console.error("Athlete notification failed:", e);
    }
  }
}

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { title, description, duration, level, category, price, max_athletes, coach_id, weekly_commitment, recovery_blocks, session_time, syllabus, assigned_athletes } = body;

  let insertResult = await supabase
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

  if (insertResult.error && insertResult.error.message.includes("session_time")) {
    insertResult = await supabase
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
        syllabus: syllabus || [],
        is_active: true
      }])
      .select()
      .single();
  }

  if (insertResult.error) return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
  const data = insertResult.data;

  // Handle Athlete Enrollments
  if (assigned_athletes && assigned_athletes.length > 0) {
    const enrollments = assigned_athletes.map((userId: string) => ({
      user_id: userId,
      program_id: data.id,
      status: "active",
      approval_status: "approved",
      payment_status: "confirmed"
    }));

    const { error: enrollError } = await supabase.from("user_programs").insert(enrollments);
    if (enrollError) {
      console.error("Failed to enroll athletes:", enrollError);
    } else {
      // Notify athletes
      await notifyAthletes(supabase, assigned_athletes, data.id, title, category, level);
    }
  }

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
        const scheduleHtml = await getScheduleHtml(supabase, data.id);
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
                ${scheduleHtml}
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
  const { id, title, description, duration, level, category, price, max_athletes, coach_id, weekly_commitment, recovery_blocks, session_time, syllabus, assigned_athletes } = body;

  if (!id) return NextResponse.json({ error: "Missing program ID" }, { status: 400 });

  // 1. Fetch current program to check if coach changed
  const { data: currentProgram } = await supabase
    .from("programs")
    .select("coach_id")
    .eq("id", id)
    .single();

  let updateResult = await supabase
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

  if (updateResult.error && updateResult.error.message.includes("session_time")) {
    updateResult = await supabase
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
        syllabus: syllabus || []
      })
      .eq("id", id)
      .select()
      .single();
  }

  if (updateResult.error) return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
  const data = updateResult.data;

  // Handle Athlete Enrollments
  if (assigned_athletes) {
    // Current active athletes
    const { data: currentEnrolled } = await supabase
      .from("user_programs")
      .select("user_id")
      .eq("program_id", id)
      .eq("status", "active");

    const currentIds = currentEnrolled ? currentEnrolled.map(e => e.user_id) : [];
    
    // Athletes to add
    const toAdd = assigned_athletes.filter((userId: string) => !currentIds.includes(userId));
    if (toAdd.length > 0) {
      const enrollments = toAdd.map((userId: string) => ({
        user_id: userId,
        program_id: id,
        status: "active",
        approval_status: "approved",
        payment_status: "confirmed"
      }));
        const { error: enrollError } = await supabase.from("user_programs").upsert(enrollments, { onConflict: 'user_id, program_id' });
        if (!enrollError) {
          await notifyAthletes(supabase, toAdd, data.id, title, category, level);
        } else {
          console.error("Failed to enroll athletes:", enrollError);
        }
    }

    // Athletes to remove
    const toRemove = currentIds.filter(userId => !assigned_athletes.includes(userId));
    if (toRemove.length > 0) {
      await supabase
        .from("user_programs")
        .update({ status: "dropped" })
        .eq("program_id", id)
        .in("user_id", toRemove);
    }
  }

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
        const scheduleHtml = await getScheduleHtml(supabase, data.id);
        
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
                ${scheduleHtml}
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
