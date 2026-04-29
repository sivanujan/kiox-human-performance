"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format, addMinutes, isBefore, isAfter } from 'date-fns';
import { convertTimeOnly } from '@/lib/timezone';
import { useAuth } from '@/components/providers/AuthProvider';

export function useTrainingReminders() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [lastNotified, setLastNotified] = useState<string | null>(null);
  const [userTz, setUserTz] = useState('UTC');

  useEffect(() => {
    if (profile?.timezone) {
      setUserTz(profile.timezone);
    }
  }, [profile]);

  useEffect(() => {
    const checkSchedule = async () => {
      if (!user) return;

      // 1. Get active program
      const { data: enrollment } = await supabase
        .from('user_programs')
        .select('program_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!enrollment) return;

      // 2. Fetch program schedule
      const res = await fetch(`/api/coach/program-schedule?programId=${enrollment.program_id}`);
      const schedule = await res.json();
      if (schedule.error || !Array.isArray(schedule)) return;

      const now = new Date();
      
      // 3. Find if any session is starting in the next 15 minutes
      const upcomingSession = schedule.find((s: any) => {
        const coachTz = s.program?.coach?.timezone || 'UTC';
        
        // Convert coach's start_time to athlete's local time
        const localTimeStr = convertTimeOnly(s.start_time, coachTz, userTz);
        
        const [hours, minutes] = localTimeStr.split(':').map(Number);
        const sessionStartTime = new Date();
        sessionStartTime.setHours(hours, minutes, 0, 0);

        // Handle day wraps (if conversion pushes it to yesterday or tomorrow, this logic might need refinement, 
        // but for now HH:mm conversion on "currentDay" is the primary target)
        if (s.day_of_week !== now.getDay()) {
           // We'd need to check if conversion changed the day, but that's complex.
           // For now, assume same day.
           return false;
        }

        const fifteenMinsFromNow = addMinutes(now, 15);
        
        return isAfter(sessionStartTime, now) && isBefore(sessionStartTime, fifteenMinsFromNow);
      });

      if (upcomingSession && lastNotified !== upcomingSession.id) {
        // Show browser notification if permitted
        if (Notification.permission === "granted") {
          new Notification("KIO-X TACTICAL REMINDER", {
            body: `DEPLOYMENT IMMINENT: "${upcomingSession.title}" starts in 15 minutes. Prepare for operations.`,
            icon: "/icon.png"
          });
          setLastNotified(upcomingSession.id);
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission();
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkSchedule, 5 * 60 * 1000);
    checkSchedule(); // Initial check

    return () => clearInterval(interval);
  }, [lastNotified]);

  return null;
}
