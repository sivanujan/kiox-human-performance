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
  const { userId, role, status, avatar_url, confirmEmail } = body;

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
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { email, password, first_name, last_name, username, avatar_url, role = "athlete" } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name, username }
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  // 2. Update the profile (the trigger should have already created the id)
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name,
      last_name,
      username,
      avatar_url,
      role: role,
      status: "active"
    })
    .eq("id", authData.user.id)
    .select()
    .single();

  if (profileError) {
    // If update fails, we still have the user in Auth, but the profile is incomplete
    return NextResponse.json({ 
      error: "User created but profile update failed: " + profileError.message,
      user: authData.user 
    }, { status: 500 });
  }

  return NextResponse.json(profileData);
}
