import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Verify Session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== 'staff' && profile?.role !== 'superadmin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Process Updates
    const { first_name, last_name, username, phone_number, password } = await request.json();
    
    const adminClient = createAdminClient();

    // Update Auth (Password) if provided
    if (password) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(user.id, {
        password: password
      });
      if (authError) {
        console.error("Auth Update Error:", authError);
        return NextResponse.json({ error: authError.message }, { status: 500 });
      }
    }

    // Update Profile
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        first_name,
        last_name,
        username,
        phone_number,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile Update Error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Profile synchronized." });
  } catch (err) {
    console.error("Staff Profile Route Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
