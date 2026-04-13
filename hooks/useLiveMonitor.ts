"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export interface LiveAthleteMetric {
  athlete_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  heart_rate: number;
  speed: number;
  hr_history: number[];
  is_active: boolean;
}

export function useLiveMonitor() {
  const [activeAthletes, setActiveAthletes] = useState<Record<string, LiveAthleteMetric>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    initializeMonitor();

    // Subscribe to REAL-TIME sensor updates
    const channelId = `live_monitor_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "athlete_live_metrics" },
        (payload) => {
          handleNewMetric(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const initializeMonitor = async () => {
    setLoading(true);
    
    // 1. Fetch active sessions with athlete profiles
    const { data: sessions, error: sError } = await supabase
      .from("athlete_live_sessions")
      .select(`
        athlete_id,
        athlete:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq("is_active", true);

    if (sError || !sessions) {
      setLoading(false);
      return;
    }

    const initialData: Record<string, LiveAthleteMetric> = {};

    // 2. For each active athlete, fetch the last 10 HR values for sparkline
    for (const session of sessions) {
      const athlete = session.athlete as any;
      if (!athlete) continue;

      const { data: metrics } = await supabase
        .from("athlete_live_metrics")
        .select("heart_rate, speed, recorded_at")
        .eq("athlete_id", athlete.id)
        .order("recorded_at", { ascending: false })
        .limit(10);

      const latest = metrics?.[0] || { heart_rate: 0, speed: 0 };
      const hrHistory = metrics?.map(m => m.heart_rate).reverse() || [];

      initialData[athlete.id] = {
        athlete_id: athlete.id,
        first_name: athlete.first_name,
        last_name: athlete.last_name,
        avatar_url: athlete.avatar_url,
        heart_rate: latest.heart_rate,
        speed: latest.speed,
        hr_history: hrHistory,
        is_active: true
      };
    }

    setActiveAthletes(initialData);
    setLoading(false);
  };

  const handleNewMetric = (newMetric: any) => {
    setActiveAthletes(prev => {
      const athleteId = newMetric.athlete_id;
      if (!prev[athleteId]) return prev; // Only update if session is active

      const current = prev[athleteId];
      const newHistory = [...current.hr_history, newMetric.heart_rate].slice(-10);

      return {
        ...prev,
        [athleteId]: {
          ...current,
          heart_rate: newMetric.heart_rate,
          speed: newMetric.speed,
          hr_history: newHistory
        }
      };
    });
  };

  return {
    athletes: Object.values(activeAthletes),
    loading,
    refresh: initializeMonitor
  };
}
