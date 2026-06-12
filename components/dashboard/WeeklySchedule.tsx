"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Target
} from "lucide-react";
import BookSessionModal from "@/components/modals/BookSessionModal";
import { useTimezone } from "@/hooks/useTimezone";


export default function WeeklySchedule() {
  const supabase = createClient();
  const { formatTimeOnly } = useTimezone();
  const [sessions, setSessions] = useState<any[]>([]);
  const [programSchedule, setProgramSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  useEffect(() => {
    fetchWeeklySessions();
  }, [currentWeekStart]);

  const fetchWeeklySessions = async () => {
    setLoading(true);
    try {
      const dateStr = format(currentWeekStart, 'yyyy-MM-dd');
      
      // 1. Fetch normal bookings
      const res = await fetch(`/api/athlete/bookings?date=${dateStr}`);
      const data = await res.json();
      if (!data.error) setSessions(data);

      // 2. Fetch user's program schedule
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: enrollments } = await supabase
          .from('user_programs')
          .select('program_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        
        if (enrollments) {
          const progRes = await fetch(`/api/coach/program-schedule?programId=${enrollments.program_id}`);
          const progData = await progRes.json();
          if (!progData.error) setProgramSchedule(progData);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const nextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const prevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const currentWeek = () => setCurrentWeekStart(new Date());

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(currentWeekStart, i);
      const dayIdx = d.getDay(); // 0=Sun, 1=Mon...
      
      // Filter normal sessions
      const daySessions = sessions.filter(s => s.scheduled_date === format(d, 'yyyy-MM-dd'));
      
      // Map program schedule items into "virtual sessions"
      const progSessions = programSchedule
        .filter(s => s.day_of_week === dayIdx)
        .map(s => ({
          ...s,
          is_program: true,
          scheduled_date: format(d, 'yyyy-MM-dd'),
          coach_timezone: (s.program as any)?.coach?.timezone || 'UTC'
        }));

      return { 
        day: format(d, 'EEE').toUpperCase(), 
        date: d, 
        sessions: [...daySessions, ...progSessions].sort((a, b) => a.start_time.localeCompare(b.start_time))
      };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-bg-secondary/30 border border-border-primary/30 rounded-3xl">
        <Loader2 className="text-accent-green animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-bg-card p-6 rounded-3xl border border-border-primary/50">
        <div className="space-y-1">
          <h3 className="text-text-secondary font-display text-[11px] tracking-[0.3em] uppercase flex items-center gap-3">
            <CalendarIcon size={14} className="text-accent-green" /> 
            TACTICAL SCHEDULE // {format(currentWeekStart, 'MMM dd')} - {format(addDays(currentWeekStart, 6), 'MMM dd')}
          </h3>
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Global matrix deployment window</p>
        </div>

        <div className="flex items-center gap-2 bg-bg-secondary/50 p-1.5 rounded-2xl border border-border-primary/30">
           <button onClick={prevWeek} className="p-2 hover:bg-bg-secondary rounded-xl transition-all text-text-secondary hover:text-text-primary">
              <ChevronRight className="rotate-180" size={16} />
           </button>
           <button onClick={currentWeek} className="px-4 py-2 hover:bg-bg-secondary rounded-xl transition-all text-[9px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary border border-border-primary/40">
              TODAY
           </button>
           <button onClick={nextWeek} className="p-2 hover:bg-bg-secondary rounded-xl transition-all text-text-secondary hover:text-text-primary">
              <ChevronRight size={16} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {weekDays.map((dayObj, i) => (
          <div key={i} className="group flex flex-col md:flex-row items-stretch md:items-center gap-4 p-4 bg-bg-card border border-border-primary/30 rounded-2xl hover:bg-bg-card-hover transition-all">
            {/* Day Column */}
            <div className="w-16 shrink-0 flex flex-col items-center justify-center py-2 border-r border-border-primary/30">
              <span className="text-[10px] font-black text-accent-green tracking-widest leading-none mb-1">{dayObj.day}</span>
              <span className="text-sm font-display text-text-secondary">{format(dayObj.date, 'dd')}</span>
            </div>

            {/* Sessions Column */}
            <div className="flex-1 space-y-3">
              {dayObj.sessions.length === 0 ? (
                <span className="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.4em] ml-2">No active operations detected</span>
              ) : (
                <div className="space-y-3">
                  {dayObj.sessions.map((session: any) => {
                    const sessionDateTime = new Date(`${session.scheduled_date}T${session.start_time}`);
                    const isPast = sessionDateTime < new Date();
                    
                    return (
                    <div key={session.id} className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-secondary/40 p-5 rounded-2xl border transition-all ${session.is_program ? 'border-accent-green/30 bg-accent-green/5' : 'border-border-primary/30 group-hover:border-accent-green/30'} ${isPast ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${session.is_program ? 'bg-accent-green text-text-on-green shadow-accent-glow' : session.is_special ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-accent-green/10 text-accent-green'}`}>
                           {session.is_program ? <ShieldCheck size={18} /> : session.is_special ? <Zap size={18} /> : <Target size={18} />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <h4 className="text-sm font-black text-text-primary uppercase tracking-widest">{session.title}</h4>
                             {session.is_program && (
                               <span className="px-1.5 py-0.5 bg-accent-green text-text-on-green rounded text-[7px] font-black uppercase tracking-widest">Protocol Core</span>
                             )}
                             {session.is_special && (
                               <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[7px] font-black text-amber-500 uppercase tracking-widest">Special Ops</span>
                             )}
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1.5">
                              <Clock size={12} className="text-accent-green" /> 
                              {formatTimeOnly(session.start_time, session.coach_timezone || 'UTC')}
                            </span>
                            {!session.is_program && (
                              <span className="flex items-center gap-1.5">
                                <Users size={12} className={session.confirmed_count >= session.max_capacity ? 'text-red-500' : 'text-accent-green'} /> 
                                {session.confirmed_count} / {session.max_capacity || 20} SPOTS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        {session.is_program ? (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-accent-green/10 text-accent-green border-accent-green/20">
                             <CheckCircle2 size={12} /> ACTIVE ENROLLMENT
                          </div>
                        ) : session.user_booking_status ? (
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                            session.user_booking_status === 'CONFIRMED' 
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                             {session.user_booking_status === 'CONFIRMED' ? <CheckCircle2 size={12} /> : <Loader2 size={12} className="animate-spin" />}
                             {session.user_booking_status}
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setSelectedSession(session);
                              setIsModalOpen(true);
                            }}
                            disabled={isPast || session.confirmed_count >= (session.max_capacity || 20)}
                            className="w-full md:w-auto px-6 py-2 bg-accent-green hover:bg-text-primary hover:text-bg-primary text-text-on-green rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:bg-bg-secondary/40 disabled:text-text-muted/40"
                          >
                            {isPast ? 'Session Closed' : session.confirmed_count >= (session.max_capacity || 20) ? 'Session Full' : 'Book Session'}
                          </button>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <BookSessionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        session={selectedSession}
        onSuccess={fetchWeeklySessions}
      />
    </div>
  );
}
