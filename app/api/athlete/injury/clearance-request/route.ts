import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const athleteId = user.id;

  try {
    // 2. Check for active injuries
    const { data: activeInjuries, error: injError } = await supabase
      .from('athlete_injury_logs')
      .select('*')
      .eq('athlete_id', athleteId)
      .neq('status', 'Cleared')
      .order('logged_at', { ascending: false });

    if (injError) throw injError;
    if (!activeInjuries || activeInjuries.length === 0) {
      // SELF-HEALING: If athlete is "RESTRICTED" but has no logs, reset their profile status
      const { data: profile } = await supabase.from('profiles').select('training_status').eq('id', athleteId).single();
      
      if (profile?.training_status === 'INJURED' || profile?.training_status === 'NOT READY') {
        console.log(`[Self-Healing] Reconciling stuck injury status for: ${athleteId}`);
        await require('@/utils/analytics-engine').recalculateAthleteMetrics(supabase, athleteId);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Clinical status synchronized manually. Access restored.' 
        }, { status: 200 });
      }

      return NextResponse.json({ 
        success: false, 
        message: 'No clinical injury records found requiring command clearance at this time.' 
      }, { status: 200 });
    }

    const latestInjury = activeInjuries[0];

    // 3. Check if a request already exists in active alerts
    const { data: existingAlert } = await supabase
      .from('athlete_alerts')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('alert_type', 'MEDICAL_CLEARANCE_REQUEST')
      .eq('is_resolved', false)
      .single();

    if (existingAlert) {
      return NextResponse.json({ message: 'Clearance request is already pending review.' }, { status: 200 });
    }

    // 4. Create MEDICAL_CLEARANCE_REQUEST alert for Staff
    const { error: alertError } = await supabase
      .from('athlete_alerts')
      .insert({
        athlete_id: athleteId,
        alert_type: 'MEDICAL_CLEARANCE_REQUEST',
        severity: 'MEDIUM',
        message: `Athlete is requesting medical clearance for: ${latestInjury.injury_type} (${latestInjury.body_part || 'Unspecified area'})`,
      });

    if (alertError) throw alertError;

    // 5. Notify Staff via system_notifications
    const { data: staffProfiles } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['superadmin', 'staff']);

    if (staffProfiles && staffProfiles.length > 0) {
      const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', athleteId).single();
      const athleteName = profile ? `${profile.first_name} ${profile.last_name}` : 'An Athlete';

      const notifications = staffProfiles.map(staff => ({
        recipient_id: staff.id,
        sender_id: athleteId,
        title: "CLEARANCE REQUEST",
        message: `${athleteName} has submitted a request for medical clearance.`,
        type: 'UPDATE'
      }));

      await supabase.from('system_notifications').insert(notifications);
    }

    return NextResponse.json({ success: true, message: 'Medical clearance request submitted to command staff.' });

  } catch (error: any) {
    console.error("Clearance Request Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
