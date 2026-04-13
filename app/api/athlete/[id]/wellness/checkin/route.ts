import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const athleteId = params.id;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    const { sleep_score, soreness_score, hydration_status, mood, stress_level, hrv_ms, resting_hr_bpm } = await request.json();

    // 1. Generate Automated Recommendations (Elite Logic Engine)
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
    const { data, error } = await supabase
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
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Update Profile Summary Status (Rule-Based)
    let trainingStatus = 'ready';
    if (soreness_score > 7 || sleep_score < 5) trainingStatus = 'modified';
    
    await supabase.from('profiles').update({ training_status: trainingStatus }).eq('id', athleteId);

    // 4. Send Success Notification
    await supabase.from('notifications').insert({
      user_id: athleteId,
      message: "Wellness Check-in Synchronized. Recommendations Generated.",
      type: 'success'
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
