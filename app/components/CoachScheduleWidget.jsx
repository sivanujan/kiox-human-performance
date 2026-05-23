"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useOnlineStatus } from '@/app/hooks/useOnlineStatus';
import CoachStatusDot from './CoachStatusDot';
import { motion } from 'framer-motion';
import { Calendar, Clock, Check, X, Loader2 } from 'lucide-react';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

export default function CoachScheduleWidget({ coach: initialCoach }) {
  const supabase = createClient();
  const [coach, setCoach] = useState(initialCoach);
  const [loading, setLoading] = useState(!initialCoach?.schedule);
  const { isOnline, todaySchedule } = useOnlineStatus(coach?.schedule);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!initialCoach?.id) return;
      
      // If we already have schedule, don't fetch unless we want to refresh
      if (initialCoach.schedule) {
        setCoach(initialCoach);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: schedule, error: schedError } = await supabase
          .from('coach_schedule')
          .select('*')
          .eq('coach_id', initialCoach.id);

        if (schedError) throw schedError;

        const { data: availability, error: availError } = await supabase
          .from('coach_availability')
          .select('*')
          .eq('coach_id', initialCoach.id)
          .maybeSingle();

        // It's okay if availability doesn't exist yet
        
        setCoach({
          ...initialCoach,
          schedule: schedule || [],
          availability: availability || null
        });
      } catch (err) {
        console.error('Error fetching own schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();

    // Subscribe to changes for this specific coach
    const channel = supabase
      .channel(`own-schedule-${initialCoach?.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'coach_schedule',
        filter: `coach_id=eq.${initialCoach?.id}`
      }, () => {
        // Refetch or update
        fetchSchedule();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialCoach?.id]);

  if (!initialCoach) return null;

  if (loading) return (
    <div className="bg-[#111] border border-[#22c55e]/20 rounded-3xl p-10 flex flex-col items-center justify-center gap-4">
      <Loader2 className="text-[#22c55e] animate-spin" size={32} />
      <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest animate-pulse">Syncing Schedule...</span>
    </div>
  );

  return (
    <div className="w-full bg-[#111] border border-[#22c55e]/20 rounded-3xl p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="text-[#22c55e] font-display text-sm tracking-[0.2em] uppercase flex items-center gap-3">
          <Calendar size={18} /> MY SCHEDULE
        </div>
        <CoachStatusDot isOnline={isOnline} showLabel={true} />
      </div>

      <div className="space-y-2">
        {DAYS_FULL.map((dayName, idx) => {
          const day = coach?.schedule?.find(s => s.day_name === dayName);
          const isToday = dayName === todaySchedule?.day_name;
          
          return (
            <div 
              key={dayName}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isToday 
                  ? 'bg-[#22c55e]/10 border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                  : 'bg-black/20 border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-[#22c55e]' : 'text-gray-500'}`}>
                  {DAYS_SHORT[idx]}
                </span>
                <span className={`text-xs font-bold uppercase ${isToday ? 'text-white' : 'text-white/60'}`}>
                  {day?.is_working ? `${formatTime(day.start_time)} - ${formatTime(day.end_time)}` : 'Day Off'}
                </span>
              </div>
              
              {day?.is_working ? (
                <Check size={14} className="text-[#22c55e]" />
              ) : (
                <X size={14} className="text-gray-700" />
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute -bottom-6 -right-6 text-7xl opacity-[0.03] font-display pointer-events-none uppercase">
        AVAIL
      </div>
    </div>
  );
}
