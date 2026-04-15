import { createAdminClient } from "@/utils/supabase/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Verify Admin Session
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    if (adminProfile?.role !== 'superadmin') {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 2. Process Reset
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "Missing Target User ID" }, { status: 400 });

    const adminClient = createAdminClient();

    // Trigger a password reset email
    // Or we can generate a recovery link and send it via our own email service if needed,
    // but the simplest is to use Supabase's built-in reset.
    const { data: userData } = await adminClient.auth.admin.getUserById(userId);
    if (!userData.user?.email) return NextResponse.json({ error: "User or Email not found" }, { status: 404 });

    const { error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: userData.user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
      }
    });

    if (error) {
      console.error("Reset Link Generation Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Alternatively, if we want to send the standard Supabase recovery email:
    const { error: resetError } = await adminClient.auth.resetPasswordForEmail(userData.user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
    });

    if (resetError) {
      console.error("Reset Email Error:", resetError);
      return NextResponse.json({ error: resetError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Recovery email dispatched." });
  } catch (err) {
    console.error("Staff Reset Route Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
