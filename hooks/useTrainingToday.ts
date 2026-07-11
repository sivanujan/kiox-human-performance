"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export interface TrainingTodayRow {
  id: string; // generated client-side or session ID
  sessionId: string;
  athleteId: string;
  athleteName: string;
  athleteAvatar: string | null;
  trainingType: string;
  startTime: string;
  endTime: string;
  assignedCoach: string;
  location: string;
  isCurriculum: boolean;
}

export function useTrainingToday() {
  const [sessions, setSessions] = useState<TrainingTodayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTodaySessions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get today's local date string (YYYY-MM-DD) based on current timezone
      const todayStr = new Date().toISOString().split("T")[0];

      // Fetch training sessions scheduled for today
      const { data: sessionsData, error: sErr } = await supabase
        .from("training_sessions")
        .select(`
          id,
          title,
          session_type,
          start_time,
          end_time,
          duration_minutes,
          location,
          is_curriculum,
          assigned_athletes,
          coach_id,
          profiles:coach_id (first_name, last_name)
        `)
        .eq("scheduled_date", todayStr);

      if (sErr) throw sErr;

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Collect all assigned athlete IDs to fetch their names in a batch
      const allAthleteIds = new Set<string>();
      sessionsData.forEach((s: any) => {
        if (s.assigned_athletes) {
          s.assigned_athletes.forEach((id: string) => allAthleteIds.add(id));
        }
      });

      let athleteProfilesMap: Record<string, { name: string; avatar_url: string | null }> = {};
      if (allAthleteIds.size > 0) {
        const { data: profilesData, error: pErr } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", Array.from(allAthleteIds));

        if (!pErr && profilesData) {
          profilesData.forEach((p: any) => {
            athleteProfilesMap[p.id] = {
              name: `${p.first_name || ""} ${p.last_name || ""}`.trim(),
              avatar_url: p.avatar_url || null,
            };
          });
        }
      }

      // Format/Flatten sessions into single athlete rows
      const formattedRows: TrainingTodayRow[] = [];

      sessionsData.forEach((session: any) => {
        const coachProfile = session.profiles;
        const coachName = coachProfile 
          ? `${coachProfile.first_name || ""} ${coachProfile.last_name || ""}`.trim()
          : "Unassigned";

        const startStr = session.start_time || "00:00:00";
        // Calculate end time based on start_time and duration_minutes if end_time isn't provided
        let endStr = session.end_time;
        if (!endStr && session.start_time && session.duration_minutes) {
          try {
            const [h, m, s] = session.start_time.split(":").map(Number);
            const date = new Date();
            date.setHours(h, m + session.duration_minutes, s || 0);
            endStr = date.toTimeString().split(" ")[0];
          } catch (e) {
            endStr = startStr;
          }
        }
        if (!endStr) {
          endStr = startStr;
        }

        // Format to hh:mm
        const formatTime = (timeStr: string) => {
          if (!timeStr) return "";
          const parts = timeStr.split(":");
          if (parts.length < 2) return timeStr;
          return `${parts[0]}:${parts[1]}`;
        };

        const duration = session.duration_minutes ? `${session.duration_minutes} minutes` : "";

        // If no athletes are assigned, show as an "Open Slot" row so coaches know there is a session
        if (!session.assigned_athletes || session.assigned_athletes.length === 0) {
          formattedRows.push({
            id: `${session.id}-open`,
            sessionId: session.id,
            athleteId: "",
            athleteName: "Open Slot / No Athlete",
            athleteAvatar: null,
            trainingType: session.session_type || "CUSTOM",
            startTime: formatTime(startStr),
            endTime: formatTime(endStr),
            assignedCoach: coachName,
            location: session.location || "KIOX Facility",
            isCurriculum: !!session.is_curriculum,
          });
        } else {
          session.assigned_athletes.forEach((athleteId: string) => {
            const athleteInfo = athleteProfilesMap[athleteId];
            const athleteName = athleteInfo 
              ? athleteInfo.name
              : "Unknown Athlete";
            const athleteAvatar = athleteInfo ? athleteInfo.avatar_url : null;

            formattedRows.push({
              id: `${session.id}-${athleteId}`,
              sessionId: session.id,
              athleteId,
              athleteName,
              athleteAvatar,
              trainingType: session.session_type || "CUSTOM",
              startTime: formatTime(startStr),
              endTime: formatTime(endStr),
              assignedCoach: coachName,
              location: session.location || "KIOX Facility",
              isCurriculum: !!session.is_curriculum,
            });
          });
        }
      });

      // Sort by start time ascending
      formattedRows.sort((a, b) => a.startTime.localeCompare(b.startTime));

      setSessions(formattedRows);
    } catch (err: any) {
      console.error("Error fetching today sessions:", err);
      setError(err.message || "Failed to load today's sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaySessions();

    // Subscribe to changes in training_sessions to automatically update
    const channel = supabase
      .channel("training-sessions-today-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "training_sessions" },
        () => {
          fetchTodaySessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { sessions, loading, error, refetch: fetchTodaySessions };
}
