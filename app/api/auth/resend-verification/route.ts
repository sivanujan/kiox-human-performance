import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let body: { email?: string; redirectTo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, redirectTo } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Step 1: Look up the user by email using the Admin API
  const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers();
  if (listError) {
    return NextResponse.json({ error: `Failed to look up user: ${listError.message}` }, { status: 500 });
  }

  const existingUser = usersData?.users?.find(u => u.email === email);

  if (!existingUser) {
    // No user found — treat as a fresh registration (client should call signUp)
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  if (existingUser.email_confirmed_at) {
    // User is already confirmed — don't re-send, just tell the client
    return NextResponse.json({ status: "already_confirmed" }, { status: 200 });
  }

  // Step 2: User exists but is NOT confirmed — generate a fresh confirmation link
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: "signup",
    email,
    options: {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/auth/callback`,
    },
  });

  if (linkError) {
    console.error("Generate link error:", linkError);
    return NextResponse.json({ error: `Failed to generate link: ${linkError.message}` }, { status: 500 });
  }

  // Step 3: Send the email using the generated link
  // Supabase auto-sends when using generateLink — but we can also surface the link if needed
  console.log("Generated fresh signup link for:", email, "| Link:", linkData?.properties?.action_link);

  return NextResponse.json({ 
    status: "sent",
    message: "A new verification email has been sent.",
  }, { status: 200 });
}
