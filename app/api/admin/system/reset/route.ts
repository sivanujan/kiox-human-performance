import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(cookieStore);

    // 1. Verify user is superadmin
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabaseAuth
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. Requires Super Admin level access.' }, { status: 403 });
    }

    // 2. Initialize Service Role Client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 3. Delete tables in order to respect foreign key constraints
    const tablesToClear = [
      'athlete_alerts',
      'athlete_injury_logs',
      'wellness_logs',
      'session_athlete_loads',
      'training_sessions',
      'bookings',
      'programs'
    ];

    for (const table of tablesToClear) {
      // Deleting where id is not null safely clears the table
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .not('id', 'is', null);

      if (error) {
        // Fallback for tables without an 'id' column, though all listed above should have one.
        // We'll try a generic filter if needed, but 'id' is standard.
        console.error(`Failed to clear ${table}:`, error.message);
        throw new Error(`Failed to clear ${table}: ${error.message}`);
      }
    }

    // 4. Optionally reset biometrics on profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        sleep_score: 0,
        soreness: 0,
        recovery_index: 0,
        weekly_load: 0,
        injury_risk: 'low',
        training_status: 'ready'
      })
      .eq('role', 'athlete');

    if (profileError) {
      console.error('Failed to reset profile biometrics:', profileError.message);
      throw new Error(`Failed to reset profile biometrics: ${profileError.message}`);
    }

    return NextResponse.json({ success: true, message: 'System purged successfully' });
  } catch (error: any) {
    console.error('System reset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
