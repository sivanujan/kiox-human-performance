"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useCoachAvailability() {
  const supabase = createClient();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      // Fetch all staff members from profiles
      const { data: staffProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff');

      if (profileError) throw profileError;

      // Fetch availability and schedule for these coaches
      const { data: availability, error: availError } = await supabase
        .from('coach_availability')
        .select('*');

      if (availError) throw availError;

      const { data: schedules, error: schedError } = await supabase
        .from('coach_schedule')
        .select('*');

      if (schedError) throw schedError;

      // Merge data
      const mergedCoaches = staffProfiles.map(profile => ({
        ...profile,
        availability: availability.find(a => a.coach_id === profile.id) || null,
        schedule: schedules.filter(s => s.coach_id === profile.id) || []
      }));

      setCoaches(mergedCoaches);
    } catch (err) {
      console.error('Error fetching coach availability:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async (coachId, scheduleData, params = {}) => {
    try {
      // 1. Update schedule
      const { error: schedError } = await supabase
        .from('coach_schedule')
        .upsert(
          scheduleData.map(day => ({
            coach_id: coachId,
            day_name: day.day_name,
            is_working: day.is_working,
            start_time: day.start_time,
            end_time: day.end_time,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'coach_id,day_name' }
        );

      if (schedError) throw schedError;

      // 2. Update availability metadata
      const { data: { user } } = await supabase.auth.getUser();
      const { error: availError } = await supabase
        .from('coach_availability')
        .upsert({ 
          coach_id: coachId,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
          session_duration: params.session_duration || 60,
          max_capacity: params.max_capacity || 1
        }, { onConflict: 'coach_id' });

      if (availError) throw availError;

      await fetchCoaches();
      return { success: true };
    } catch (err) {
      console.error('Error saving schedule:', err);
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    fetchCoaches();

    // Set up real-time subscriptions
    const availChannel = supabase
      .channel('coach-availability-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_availability' }, () => {
        fetchCoaches();
      })
      .subscribe();

    const schedChannel = supabase
      .channel('coach-schedule-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_schedule' }, () => {
        fetchCoaches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(availChannel);
      supabase.removeChannel(schedChannel);
    };
  }, []);

  return { coaches, loading, error, refetch: fetchCoaches, saveSchedule };
}
