import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function useTrainingLoad() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // 1. Fetch team-wide aggregated loads for current week
  const getTeamWeeklyLoads = async () => {
    setLoading(true);
    try {
      const weekStart = getMondayOfCurrentWeek();
      
      const { data, error } = await supabase
        .from("athlete_training_loads")
        .select(`
          load_value,
          logged_date,
          athlete:profiles(id, first_name, last_name)
        `)
        .gte("logged_date", weekStart.toISOString().split("T")[0]);

      if (error) throw error;

      // Group by athlete for the chart
      const aggregates = data?.reduce((acc: any, curr: any) => {
        if (!curr.athlete) return acc; // Skip if athlete relation is missing due to RLS
        
        const name = `${curr.athlete.first_name} ${curr.athlete.last_name}`;
        if (!acc[name]) acc[name] = { name, weekly_total: 0 };
        acc[name].weekly_total += curr.load_value;
        return acc;
      }, {}) || {};

      return Object.values(aggregates);
    } catch (err: any) {
      console.error("Matrix Load Sync Error:", err.message || err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 2. Log new training load record
  const logLoad = async (athleteId: string, value: number, type: string, date: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("athlete_training_loads")
        .insert({
          athlete_id: athleteId,
          load_value: value,
          session_type: type,
          logged_date: date,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch personal load trend (4 weeks)
  const getAthletePersonalTrend = async (athleteId: string) => {
    setLoading(true);
    try {
      // Get data for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 28);

      const { data, error } = await supabase
        .from("athlete_training_loads")
        .select("load_value, logged_date")
        .eq("athlete_id", athleteId)
        .gte("logged_date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("logged_date", { ascending: true });

      if (error) throw error;

      // Aggregate by week for sparkline
      const weeklyTrend = data.reduce((acc: any, curr: any) => {
        const weekKey = `Week ${getWeekNumber(new Date(curr.logged_date))}`;
        if (!acc[weekKey]) acc[weekKey] = { name: weekKey, au: 0 };
        acc[weekKey].au += curr.load_value;
        return acc;
      }, {});

      return Object.values(weeklyTrend);
    } catch (err) {
      console.error("Personal Load Trend Error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { getTeamWeeklyLoads, logLoad, getAthletePersonalTrend, loading };
}

// Utility Helpers
function getMondayOfCurrentWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  return new Date(d.setDate(diff));
}

function getWeekNumber(d: Date) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}
