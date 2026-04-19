import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { recalculateAthleteMetrics } from '@/utils/analytics-engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const athleteId = resolvedParams.id;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth & Role Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'superadmin' && profile?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const { alertId } = await request.json();

    const supabaseAdmin = createAdminClient();

    // 2. Clear Active Injuries for Athlete
    const { error: injError } = await supabaseAdmin
      .from('athlete_injury_logs')
      .update({ status: 'Cleared' })
      .eq('athlete_id', athleteId)
      .neq('status', 'Cleared');

    if (injError) {
      console.error("Injury Clear Error:", injError);
      throw injError;
    }

    // 3. Resolve the Clearance Alert
    if (alertId) {
      await supabaseAdmin
        .from('athlete_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq('id', alertId);
    }

    // 4. Update Profile Risk to Low (Trigger should handle this, but let's be explicit)
    await supabaseAdmin.from('profiles').update({ injury_risk: 'low' }).eq('id', athleteId);

    // 5. Recalculate Metrics (Sync readiness score)
    await recalculateAthleteMetrics(supabaseAdmin, athleteId);

    // 6. Notify athlete
    await supabaseAdmin.from('system_notifications').insert({
      recipient_id: athleteId,
      sender_id: user.id,
      title: "MEDICAL CLEARANCE GRANTED",
      message: "Congratulations. Command staff has verified your recovery. You are cleared for operational training.",
      type: 'UPDATE'
    });

    return NextResponse.json({ success: true, message: 'Athlete cleared for performance duties.' });

  } catch (error: any) {
    console.error("Clearance Approval Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
