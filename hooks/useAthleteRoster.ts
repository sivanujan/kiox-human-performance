"use client";

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

export type AthleteStatus = 'READY' | 'MONITOR' | 'ALERT' | 'INJURED' | 'REST';

export interface AthleteData {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  sport: string;
  position_played: string;
  avatar_url: string;
  weekly_load: number;
  injury_risk: 'low' | 'medium' | 'high';
  training_status: string;
  load_trend: 'up' | 'down' | 'stable';
  last_session?: {
    title: string;
    date: string;
  };
  computed_status: AthleteStatus;
  alert_count: number;
}

export function useAthleteRoster() {
  const [athletes, setAthletes] = useState<AthleteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AthleteStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'LOAD' | 'RISK' | 'STATUS'>('NAME');
  
  const supabase = createClient();

  useEffect(() => {
    fetchRoster();

    // Re-fetch when the user navigates back to this tab/page
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchRoster();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/athletes');
      if (!res.ok) {
        console.error("Roster API response error:", res.statusText);
        setLoading(false);
        return;
      }
      
      const profiles = await res.json();
      if (profiles.error) {
        console.error("Roster API returned data error:", profiles.error);
        setLoading(false);
        return;
      }

      const processed = (profiles || []).map((p: any) => {
        // 1. Resolve Status
        const activeInjuries = p.athlete_injury_logs?.filter((l: any) => l.status !== 'Cleared') || [];
        const isInjured = activeInjuries.some((l: any) => l.severity === 'High');
        const criticalAlerts = p.athlete_alerts?.filter((a: any) => !a.is_resolved && a.severity === 'critical') || [];
        const hasAlert = criticalAlerts.length > 0;
        const isMonitoring = (p.weekly_load || 0) > 800;

        let computedStatus: AthleteStatus = 'READY';
        if (isInjured) computedStatus = 'INJURED';
        else if (hasAlert) computedStatus = 'ALERT';
        else if (isMonitoring) computedStatus = 'MONITOR';

        // 2. Resolve Last Session
        const sessions = (p.session_athlete_loads || [])
          .map((l: any) => ({
            title: l.training_sessions?.title,
            date: l.training_sessions?.scheduled_date
          }))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 3. Resolve Trend
        const mockTrend: 'up' | 'down' | 'stable' = p.weekly_load > 600 ? 'up' : p.weekly_load < 300 ? 'down' : 'stable';

        return {
          ...p,
          sport: 'Football', // Fallback
          computed_status: computedStatus,
          last_session: sessions[0],
          load_trend: mockTrend,
          alert_count: p.athlete_alerts?.filter((a: any) => !a.is_resolved).length || 0,
          recovery_score: (() => {
            if (isInjured) return 0;
            const sleep = p.sleep_score || 0;
            const soreness = p.soreness || 0;
            return Math.round(((sleep + (10 - soreness)) / 20) * 100);
          })()
        };
      });

      setAthletes(processed as any);
    } catch (err) {
      console.error("Unhandled error in fetchRoster:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = useMemo(() => {
    return athletes
      .filter(a => {
        const matchesSearch = `${a.first_name} ${a.last_name} ${a.username}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || a.computed_status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME') return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        if (sortBy === 'LOAD') return b.weekly_load - a.weekly_load;
        if (sortBy === 'RISK') {
          const riskMap = { high: 0, medium: 1, low: 2 };
          return riskMap[a.injury_risk as keyof typeof riskMap] - riskMap[b.injury_risk as keyof typeof riskMap];
        }
        return 0;
      });
  }, [athletes, searchQuery, statusFilter, sortBy]);

  const stats = useMemo(() => ({
    total: athletes.length,
    ready: athletes.filter(a => a.computed_status === 'READY').length,
    monitor: athletes.filter(a => a.computed_status === 'MONITOR').length,
    alert: athletes.filter(a => a.computed_status === 'ALERT').length,
    injured: athletes.filter(a => a.computed_status === 'INJURED').length,
  }), [athletes]);

  return {
    athletes: filteredAthletes,
    allAthletes: athletes,
    loading,
    stats,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    refresh: fetchRoster
  };
}
