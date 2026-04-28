import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, programId, notes, payment_reference } = body;

    if (!userId || !programId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check for existing active or pending enrollment
    const { data: existing } = await supabase
      .from("user_programs")
      .select("id, status, payment_status")
      .eq("user_id", userId)
      .eq("program_id", programId)
      .single();

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ error: "You are already active in this protocol." }, { status: 400 });
      }
      if (existing.payment_status === 'pending') {
        return NextResponse.json({ error: "You already have a pending request for this protocol." }, { status: 400 });
      }
    }

    // 2. Create the enrollment request
    const { data, error } = await supabase
      .from("user_programs")
      .insert([{
        user_id: userId,
        program_id: programId,
        status: 'dropped', // Not active yet
        payment_status: 'pending',
        approval_status: 'requested',
        payment_reference,
        notes
      }])
      .select(`
        *,
        program:programs!program_id (title, coach_id)
      `)
      .single();

    if (error) throw error;

    // 3. Notify the assigned Coach & Superadmins
    const coachId = (data.program as any).coach_id;
    
    // Get all superadmins to notify them as well (since they handle payments)
    const { data: superadmins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'superadmin');

    const notificationPromises = [];

    // Notify Coach
    if (coachId) {
      notificationPromises.push(
        supabase.from('staff_notifications').insert({
          staff_id: coachId,
          type: 'PROGRAM_REQUESTED',
          message: `ENROLLMENT REQUEST: A new athlete has requested access to "${(data.program as any).title}". Payment confirmation required.`,
          related_id: data.id
        })
      );
    }

    // Notify Superadmins
    if (superadmins) {
      for (const admin of superadmins) {
        if (admin.id !== coachId) { // Avoid duplicate notification if coach is also superadmin
          notificationPromises.push(
            supabase.from('staff_notifications').insert({
              staff_id: admin.id,
              type: 'PROGRAM_REQUESTED',
              message: `TRANSFER VERIFICATION REQUIRED: New request for "${(data.program as any).title}". Check reference: ${payment_reference}`,
              related_id: data.id
            })
          );
        }
      }
    }

    if (notificationPromises.length > 0) {
      await Promise.all(notificationPromises);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Program Request Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
