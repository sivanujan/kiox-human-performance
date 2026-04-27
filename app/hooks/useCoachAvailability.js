"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useCoachAvailability() {
  const supabase = createClient();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isFetching = useRef(false);

  const fetchCoaches = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    
    try {
      console.log('[Matrix] Synchronizing operational staff...');
      
      // 1. Fetch profiles
      const { data: staffProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff');

      if (profileError) throw profileError;

      // 2. Fetch metadata
      const [availRes, schedRes] = await Promise.all([
        supabase.from('coach_availability').select('*'),
        supabase.from('coach_schedule').select('*')
      ]);

      if (availRes.error) throw availRes.error;
      if (schedRes.error) throw schedRes.error;

      // 3. Merge
      const mergedCoaches = (staffProfiles || []).map(profile => ({
        ...profile,
        availability: availRes.data?.find(a => a.coach_id === profile.id) || null,
        schedule: schedRes.data?.filter(s => s.coach_id === profile.id) || []
      }));

      setCoaches(mergedCoaches);
      setError(null);
      console.log(`[Matrix] Synchronization complete. ${mergedCoaches.length} units detected.`);
    } catch (err) {
      console.error('[Matrix] Synchronization failure:', err);
      setError(err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [supabase]);

  useEffect(() => {
    fetchCoaches();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchCoaches();
      }
    });

    const availChannel = supabase
      .channel('avail-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_availability' }, () => fetchCoaches())
      .subscribe();

    const schedChannel = supabase
      .channel('sched-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_schedule' }, () => fetchCoaches())
      .subscribe();

  return () => {
      subscription.unsubscribe();
      supabase.removeChannel(availChannel);
      supabase.removeChannel(schedChannel);
    };
  }, [fetchCoaches, supabase]);

  const saveSchedule = async (coachId, scheduleData, params = {}) => {
    try {
      setLoading(true);
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

      // 2. Update metadata
      const { data: { session } } = await supabase.auth.getSession();
      const { error: availError } = await supabase
        .from('coach_availability')
        .upsert({ 
          coach_id: coachId,
          updated_by: session?.user?.id,
          updated_at: new Date().toISOString(),
          session_duration: params.session_duration || 60,
          max_capacity: params.max_capacity || 1,
          timezone: params.timezone || 'UTC',
          country: params.country || null,
          country_code: params.country_code || null
        }, { onConflict: 'coach_id' });

      if (availError) throw availError;

      await fetchCoaches();
      return { success: true };
    } catch (err) {
      console.error('Save failed:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { coaches, loading, error, refetch: fetchCoaches, saveSchedule };
}
