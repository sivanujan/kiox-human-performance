"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTimezone } from "./useTimezone";

export interface FlatTrainingSession {
  id: string; // Composite unique key: `${session.id}-${athlete.id}` or `${session.id}-external`
  session_id: string;
  title: string;
  session_type: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location: string;
  status: string;
  is_curriculum: boolean;
  
  // Athlete info
  athlete_id: string | null;
  athlete_name: string;
  athlete_avatar: string | null;
  
  // Coach info
  coach_id: string | null;
  coach_name: string;
  coach_avatar: string | null;
}

export function useTrainingToday() {
  const supabase = createClient();
  const { userTimezone } = useTimezone();
  const [sessions, setSessions] = useState<FlatTrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getEndTime = (startTimeStr: string, durationMinutes: number): string => {
    if (!startTimeStr) return "";
    const parts = startTimeStr.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes)) return startTimeStr;
    
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(endHours)}:${pad(endMinutes)}`;
  };

  const fetchTodaySessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Resolve today's date in user's timezone
      const tz = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      let todayDateStr = new Date().toISOString().split("T")[0];
      try {
        const formatter = new Intl.DateTimeFormat("en-CA", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
        todayDateStr = formatter.format(new Date());
      } catch (e) {
        console.error("Timezone formatting error, falling back to local system date:", e);
      }

      // 2. Fetch sessions matching today's date
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("training_sessions")
        .select(`
          *,
          coach:profiles!coach_id(id, first_name, last_name, avatar_url)
        `)
        .eq("scheduled_date", todayDateStr);

      if (sessionsError) throw sessionsError;

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // 3. Collect all unique assigned athlete IDs
      const athleteIds = Array.from(
        new Set(
          sessionsData
            .flatMap((s: any) => s.assigned_athletes || [])
            .filter(Boolean)
        )
      ) as string[];

      // 4. Fetch profiles for these athletes
      let athletesMap: Record<string, { first_name: string; last_name: string; avatar_url: string | null }> = {};
      if (athleteIds.length > 0) {
        const { data: athletesData, error: athletesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", athleteIds);

        if (athletesError) {
          console.error("Error fetching athlete profiles for training today:", athletesError);
        } else if (athletesData) {
          athletesData.forEach((a: any) => {
            athletesMap[a.id] = {
              first_name: a.first_name,
              last_name: a.last_name,
              avatar_url: a.avatar_url
            };
          });
        }
      }

      // 5. Flatten sessions so each row represents an athlete-session pair
      const flattened: FlatTrainingSession[] = [];
      sessionsData.forEach((s: any) => {
        const coachName = s.coach 
          ? `${s.coach.first_name} ${s.coach.last_name || ""}`.trim()
          : "Unassigned";
        const coachAvatar = s.coach ? s.coach.avatar_url : null;
        const endTime = getEndTime(s.start_time, s.duration_minutes || 60);
        const formattedStartTime = s.start_time ? s.start_time.slice(0, 5) : "";

        // Handle standard internal athletes
        const hasAthletes = s.assigned_athletes && s.assigned_athletes.length > 0;
        
        if (hasAthletes) {
          s.assigned_athletes.forEach((athleteId: string) => {
            const athleteInfo = athletesMap[athleteId];
            const athleteName = athleteInfo 
              ? `${athleteInfo.first_name} ${athleteInfo.last_name || ""}`.trim()
              : "Unknown Athlete";
            const athleteAvatar = athleteInfo ? athleteInfo.avatar_url : null;

            flattened.push({
              id: `${s.id}-${athleteId}`,
              session_id: s.id,
              title: s.title,
              session_type: s.session_type || "CUSTOM",
              scheduled_date: s.scheduled_date,
              start_time: formattedStartTime,
              end_time: endTime,
              duration_minutes: s.duration_minutes || 60,
              location: s.location || "HQ FIELD",
              status: s.status || "SCHEDULED",
              is_curriculum: s.is_curriculum || false,
              athlete_id: athleteId,
              athlete_name: athleteName,
              athlete_avatar: athleteAvatar,
              coach_id: s.coach_id,
              coach_name: coachName,
              coach_avatar: coachAvatar
            });
          });
        } else if (s.is_external && s.external_player_name) {
          // Handle external athletes
          flattened.push({
            id: `${s.id}-external`,
            session_id: s.id,
            title: s.title,
            session_type: s.session_type || "CUSTOM",
            scheduled_date: s.scheduled_date,
            start_time: formattedStartTime,
            end_time: endTime,
            duration_minutes: s.duration_minutes || 60,
            location: s.location || "HQ FIELD",
            status: s.status || "SCHEDULED",
            is_curriculum: s.is_curriculum || false,
            athlete_id: null,
            athlete_name: `${s.external_player_name} (Guest)`,
            athlete_avatar: null,
            coach_id: s.coach_id,
            coach_name: coachName,
            coach_avatar: coachAvatar
          });
        } else {
          // No athletes assigned yet (open slot)
          flattened.push({
            id: `${s.id}-open`,
            session_id: s.id,
            title: s.title,
            session_type: s.session_type || "CUSTOM",
            scheduled_date: s.scheduled_date,
            start_time: formattedStartTime,
            end_time: endTime,
            duration_minutes: s.duration_minutes || 60,
            location: s.location || "HQ FIELD",
            status: s.status || "SCHEDULED",
            is_curriculum: s.is_curriculum || false,
            athlete_id: null,
            athlete_name: "Open Slot / No Athlete",
            athlete_avatar: null,
            coach_id: s.coach_id,
            coach_name: coachName,
            coach_avatar: coachAvatar
          });
        }
      });

      // 6. Sort by start_time ascending
      flattened.sort((a, b) => a.start_time.localeCompare(b.start_time));
      setSessions(flattened);
    } catch (err: any) {
      console.error("Error in useTrainingToday hook:", err);
      setError(err.message || "Failed to load today's sessions.");
    } finally {
      setLoading(false);
    }
  }, [supabase, userTimezone]);

  useEffect(() => {
    fetchTodaySessions();

    // 7. Subscribe to real-time updates for training_sessions table
    const channel = supabase
      .channel("training_sessions_today_feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "training_sessions"
        },
        () => {
          fetchTodaySessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchTodaySessions]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchTodaySessions
  };
}
