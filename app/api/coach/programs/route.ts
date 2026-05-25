import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'staff' && profile.role !== 'superadmin')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, syllabus } = body;

  if (!id) return NextResponse.json({ error: "Missing program ID" }, { status: 400 });

  // Verify ownership if not superadmin
  if (profile.role !== 'superadmin') {
    const { data: program } = await supabase
      .from('programs')
      .select('coach_id')
      .eq('id', id)
      .single();

    if (!program || program.coach_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You are not the lead coach for this program" }, { status: 403 });
    }
  }

  // Update syllabus using service role for internal bypass if needed, 
  // but here we can just use the authenticated client if RLS allows.
  // Let's use service role to ensure it works regardless of RLS complexity for now, 
  // since we already verified authority.
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await adminSupabase
    .from("programs")
    .update({ syllabus: syllabus || [] })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
