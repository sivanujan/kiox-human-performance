"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";

export interface TrainingSession {
  id: string;
  title: string;
  session_type: 'STRENGTH' | 'TACTICAL' | 'CONDITIONING' | 'RECOVERY' | 'CUSTOM' | 'MEAL' | 'CURFEW' | 'LOGISTICS';
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  location?: string;
  assigned_athletes: string[];
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  target_load_au?: number;
  assigned_by?: string;
  notes?: string;
  coach_timezone?: string;
  created_at?: string;
  coach_id?: string;
  is_curriculum?: boolean;
  is_emergency?: boolean;
  is_external?: boolean;
  external_player_name?: string | null;
  payment_status?: 'PENDING' | 'CONFIRMED';
  confirmed_by_admin?: boolean;
  session_category?: 'CURRICULUM' | 'SCHEDULE' | 'EMERGENCY';
}

export function useSessions() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchSessions = async (date: Date = new Date()) => {
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    
    const { data, error } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("scheduled_date", dateStr)
      .order("start_time", { ascending: true });

    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  const updateSessionStatus = async (sessionId: string, status: TrainingSession['status']) => {
    setLoading(true);
    const { error } = await supabase
      .from("training_sessions")
      .update({ status })
      .eq("id", sessionId);

    if (!error) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status } : s));
    }
    setLoading(false);
    return { success: !error, error: error?.message || null };
  };

  const createSession = async (sessionData: Partial<TrainingSession>) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("training_sessions")
      .insert(sessionData)
      .select()
      .single();

    if (!error && data) {
      setSessions(prev => [...prev, data]);
    }
    setLoading(false);
    return { success: !error, data, error: error?.message || null };
  };

  const getSessionLoads = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("session_athlete_loads")
      .select(`
        *,
        athlete:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq("session_id", sessionId);
    
    return { data, error };
  };

  const logSessionCompletion = async (sessionId: string, athleteLogs: any[]) => {
    setLoading(true);
    
    // 1. Insert/Update athlete loads
    const { error: logError } = await supabase
      .from("session_athlete_loads")
      .upsert(athleteLogs.map(log => ({ ...log, session_id: sessionId })));

    if (logError) {
      setLoading(false);
      return { success: false, error: logError };
    }

    // 2. Mark session as COMPLETED (this triggers the SQL sync to athlete_training_loads)
    const result = await updateSessionStatus(sessionId, 'COMPLETED');
    setLoading(false);
    return result;
  };

  return {
    sessions,
    loading,
    fetchSessions,
    updateSessionStatus,
    createSession,
    getSessionLoads,
    logSessionCompletion
  };
}
