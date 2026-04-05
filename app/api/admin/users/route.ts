import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { userId, role, status, confirmEmail } = body;

  if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

  // Handle Manual Email Confirmation
  if (confirmEmail) {
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
    return NextResponse.json({ message: "Email confirmed via authority override" });
  }

  const updateData: any = {};
  if (role) updateData.role = role;
  if (status) updateData.status = status;

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
