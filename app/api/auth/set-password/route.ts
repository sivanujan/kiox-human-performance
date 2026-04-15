import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Verify Active Session via Cookie Authority
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Set Password Auth Error:", authError?.message);
      return NextResponse.json({ error: "Session expired or invalid. Please re-authenticate." }, { status: 401 });
    }

    const { password } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // 2. Perform Server-Side Credential Provisioning via Admin Client
    const adminClient = createAdminClient();
    
    const { data, error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error("Admin Credential Update Failure:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 3. Optional: Trigger sign-out of all other sessions for security
    // This ensures only the current fresh session remains valid (or all are wiped)
    await adminClient.auth.admin.signOut(data.user.id);

    return NextResponse.json({ success: true, message: "Credential established successfully." });
  } catch (err: any) {
    console.error("Internal Credential Exception:", err);
    return NextResponse.json({ error: "Internal security server error." }, { status: 500 });
  }
}
