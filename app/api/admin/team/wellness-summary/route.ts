import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Fetch Today's Date
  const today = new Date().toISOString().split('T')[0];

  // 2. Fetch Aggregated Statistics for Today
  const { data: logs, error } = await supabase
    .from('wellness_logs')
    .select('sleep_score, soreness_score, mood, hydration_status')
    .eq('date', today);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (logs.length === 0) {
    return NextResponse.json({
      completion_count: 0,
      avg_sleep: 0,
      avg_soreness: 0,
      mood_distribution: {},
      hydration_flag: false
    });
  }

  // 3. Compute Averages & Distributions
  const avgSleep = logs.reduce((acc, log) => acc + log.sleep_score, 0) / logs.length;
  const avgSoreness = logs.reduce((acc, log) => acc + log.soreness_score, 0) / logs.length;
  
  const moodDistribution: Record<string, number> = {};
  logs.forEach(log => {
     if (log.mood) moodDistribution[log.mood] = (moodDistribution[log.mood] || 0) + 1;
  });

  const lowHydrationCount = logs.filter(log => log.hydration_status === 'low').length;

  return NextResponse.json({
    completion_count: logs.length,
    avg_sleep: parseFloat(avgSleep.toFixed(1)),
    avg_soreness: parseFloat(avgSoreness.toFixed(1)),
    mood_distribution: moodDistribution,
    hydration_flag: lowHydrationCount > (logs.length * 0.2) // Flag if >20% of team is low
  });
}
