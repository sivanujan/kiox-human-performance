import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { recalculateAthleteMetrics } from '@/utils/analytics-engine';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const athleteIdParam = params.id;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get the actual authenticated user ID (Safest for RLS)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
  }
  const athleteId = user.id;

  try {
    const { sleep_score, soreness_score, hydration_status, mood, stress_level, hrv_ms, resting_hr_bpm } = await request.json();

    // 1. Generate Automated Recommendations
    console.log("Wellness Check-in Starting for:", athleteId);
    const recommendations: string[] = [];
    if (sleep_score < 7) {
      recommendations.push("PROTOCOL: Extended recovery sleep required. Aim for 9h tomorrow.");
      recommendations.push("NUTRITION: Increase magnesium intake before rest.");
    }
    if (soreness_score > 6) {
      recommendations.push("PHYSICAL: High muscle fatigue detected. Protocol suggests 20min ice bath.");
      recommendations.push("TRAINING: Suggesting modified load for next field session.");
    }
    if (hydration_status === 'low') {
      recommendations.push("HYDRATION: Critical fluid deficit. Protocol: 1.5L electrolyte intake immediately.");
    }
    if (stress_level === 'high') {
      recommendations.push("COGNITIVE: High neural stress. recommend 10min focused breathing session.");
    }

    if (recommendations.length === 0) {
      recommendations.push("SYSTEM: Biometrics optimal. Continue planned training intensity.");
    }

    // 2. Insert into Wellness Logs
    console.log("Step 2: Upserting Wellness Logs");
    const { data: logData, error: logError } = await supabase
      .from('wellness_logs')
      .upsert({
        user_id: athleteId,
        date: new Date().toISOString().split('T')[0],
        sleep_score,
        soreness_score,
        hydration_status,
        mood,
        stress_level,
        hrv_ms,
        resting_hr_bpm,
        recommendations
      }, { 
        onConflict: 'user_id,date' 
      })
      .select()
      .single();

    if (logError) {
      console.error("Wellness log error:", logError);
      throw logError;
    }

    // 3. Update Profile Summary Status (Rule-Based)
    console.log("Step 3: Updating Profile Stats");
    
    // Check for active injuries to override status
    const { data: activeInjuries } = await supabase
      .from("athlete_injury_logs")
      .select("id")
      .eq("athlete_id", athleteId)
      .eq("status", "Active Injury");
    
    const isInjured = (activeInjuries?.length || 0) > 0;
    
    let trainingStatus = 'ready';
    if (soreness_score > 7 || sleep_score < 5) trainingStatus = 'modified';
    if (isInjured) trainingStatus = 'injured';

    const { error: profileError } = await supabase.from('profiles').update({ 
      training_status: trainingStatus,
      sleep_score,
      soreness: soreness_score,
      hrv: hrv_ms,
      resting_hr: resting_hr_bpm,
      hydration: hydration_status,
      mood,
      stress_level
    }).eq('id', athleteId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      throw profileError;
    }

    // --- BACKGROUND ANALYTICS SYNC ---
    await recalculateAthleteMetrics(supabase, athleteId);

    // 4. Send Realtime Push Notifications
    try {
      console.log("Step 4: Sending Notifications");
      
      // 4A. Notify the athlete that it was successful
      await supabase.from('system_notifications').insert({
        recipient_id: athleteId,
        sender_id: null,
        title: "WELLNESS SYNCED",
        message: "Your daily wellness log has been analyzed and recorded.",
        type: 'SUCCESS'
      });

      // 4B. Notify all Admins/Staff with Detailed Status
      const { data: staffProfiles } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['superadmin', 'staff']);
        
      if (staffProfiles && staffProfiles.length > 0) {
        const { data: athleteProfile } = await supabase.from('profiles').select('first_name, last_name').eq('id', athleteId).single();
        const athName = athleteProfile ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'An Athlete';
        
        // Custom message based on status
        let statusMessage = `${athName} just submitted their daily check-in.`;
        let statusTitle = "WELLNESS SUBMITTED";

        if (trainingStatus === 'ready') {
          statusMessage = `${athName} is READY for full training intensity. Biometrics optimal.`;
          statusTitle = "ATHLETE READY ✓";
        } else if (trainingStatus === 'modified') {
          statusMessage = `${athName} is reporting high FATIGUE. Modified load suggested.`;
          statusTitle = "WELLNESS ALERT ⚠️";
        } else if (trainingStatus === 'injured') {
          statusMessage = `${athName} is still flagged as INJURED. Check medical protocol.`;
          statusTitle = "MEDICAL CONSTRAINT 🩺";
        }
        
        const staffNotifications = staffProfiles.map(staff => ({
          recipient_id: staff.id,
          sender_id: athleteId,
          title: statusTitle,
          message: statusMessage,
          type: trainingStatus === 'ready' ? 'SUCCESS' : 'UPDATE'
        }));
        
        await supabase.from('system_notifications').insert(staffNotifications);
      }
      
    } catch (notifErr) {
      console.warn("Notification failed (non-critical):", notifErr);
    }

    // 5. Revalidate Dashboard
    console.log("Step 5: Revalidating Dashboard Path");
    revalidatePath('/dashboard');

    return NextResponse.json({ success: true, data: logData });
  } catch (error: any) {
    console.error("FATAL Check-in Error:", error);
    return NextResponse.json({ 
      error: error.message,
      details: error.details || "Check database constraints or RLS policies.",
      hint: "Make sure you ran the fix_wellness_sync.sql script in Supabase."
    }, { status: 500 });
  }
}
