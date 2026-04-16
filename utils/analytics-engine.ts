import { SupabaseClient } from "@supabase/supabase-js";

export async function recalculateAthleteMetrics(
  supabase: SupabaseClient,
  athleteId: string
) {
  console.log(`[AnalyticsEngine] Recalculating metrics for: ${athleteId}`);

  try {
    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    const twentyEightDaysAgoStr = twentyEightDaysAgo.toISOString().split("T")[0];

    // 1. Fetch Performance Logs (Last 28 days)
    const { data: perfLogs } = await supabase
      .from("performance_logs")
      .select("training_load_au, date")
      .eq("user_id", athleteId)
      .gte("date", twentyEightDaysAgoStr);

    const acuteLogs = perfLogs?.filter(l => l.date >= sevenDaysAgoStr) || [];
    const acuteLoad = acuteLogs.reduce((acc, curr) => acc + (curr.training_load_au || 0), 0);
    const chronicLoad = perfLogs?.reduce((acc, curr) => acc + (curr.training_load_au || 0), 0) || 0;

    // 2. Fetch Latest Wellness Log
    const { data: latestWellness } = await supabase
      .from("wellness_logs")
      .select("*")
      .eq("user_id", athleteId)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    // 3. Calculate Derived Metrics
    
    // TRAINING LOAD: 7-day sum
    const currentWeeklyLoad = acuteLoad;

    // INJURY RISK (ACWR): Acute / (Chronic / 4)
    let riskStatus = "LOW";
    if (chronicLoad > 0) {
      const averageChronic = chronicLoad / 4;
      const acwr = acuteLoad / (averageChronic || 1);
      if (acwr > 1.5) riskStatus = "HIGH";
      else if (acwr > 1.3) riskStatus = "MEDIUM";
    }

    // RECOVERY INDEX: (0-100)
    let recoveryScore = 0;
    if (latestWellness) {
      const sleepWeight = (latestWellness.sleep_score || 0) / 10;
      const sorenessWeight = (10 - (latestWellness.soreness_score || 0)) / 10;
      
      let stressWeight = 0.5;
      if (latestWellness.stress_level === 'low') stressWeight = 1.0;
      if (latestWellness.stress_level === 'high') stressWeight = 0.1;

      let hydrationWeight = 1.0;
      if (latestWellness.hydration_status === 'low') hydrationWeight = 0.3;

      recoveryScore = Math.round(((sleepWeight + sorenessWeight + stressWeight + hydrationWeight) / 4) * 100);
    }

    // WEEKLY SCORE: (0-100) - Compliance based
    // (Days active in last 7 days)
    const activeDays = new Set(acuteLogs.map(l => l.date)).size;
    const wellnessDays = latestWellness ? 1 : 0; // Simple check for now
    const weeklyScore = Math.min(100, Math.round(((activeDays / 4) * 60) + (wellnessDays * 40)));

    // 4. Update Profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        weekly_load: currentWeeklyLoad,
        injury_risk: riskStatus,
        recovery_index: recoveryScore,
        weekly_score: weeklyScore,
        updated_at: new Date().toISOString()
      })
      .eq("id", athleteId);

    if (updateError) throw updateError;

    console.log(`[AnalyticsEngine] Success: Load=${currentWeeklyLoad}, Risk=${riskStatus}, Recovery=${recoveryScore}%`);
    return { success: true, metrics: { currentWeeklyLoad, riskStatus, recoveryScore, weeklyScore } };

  } catch (err) {
    console.error("[AnalyticsEngine] Critical Error:", err);
    return { success: false, error: err };
  }
}
