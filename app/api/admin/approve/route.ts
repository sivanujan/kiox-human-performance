import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendApprovalEmail } from '@/lib/email';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin actions
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Auth & Role check
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId, programId, staffId, action } = await request.json();

    if (action === 'approve') {
      const { data: athlete, error: updateError } = await supabase
        .from('profiles')
        .update({
          status: 'approved',
          assigned_program: programId,
          assigned_staff: staffId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('first_name, last_name')
        .single();

      if (updateError) throw updateError;

      // Fetch program name
      let programName = "";
      if (programId) {
        const { data: program } = await supabase
          .from('programs')
          .select('title')
          .eq('id', programId)
          .single();
        programName = program?.title || "";
      }

      // Fetch athlete email from auth.users (requires service role)
      const { data: { user: athleteAuth }, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (athleteAuth?.email) {
        await sendApprovalEmail(athleteAuth.email, athlete.first_name, programName);
      }
    } else if (action === 'reject') {
      await supabase
        .from('profiles')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
