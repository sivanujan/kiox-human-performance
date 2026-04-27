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


export default function WeeklySchedule() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<any[]>([]);
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
      // Fetch starting from current view date
      const res = await fetch(`/api/athlete/bookings?date=${dateStr}`);
      const data = await res.json();
      if (!data.error) {
        setSessions(data);
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
      const daySessions = sessions.filter(s => s.scheduled_date === format(d, 'yyyy-MM-dd'));
      return { 
        day: format(d, 'EEE').toUpperCase(), 
        date: d, 
        sessions: daySessions 
      };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-black/20 border border-white/5 rounded-3xl">
        <Loader2 className="text-[#22c55e] animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white/[0.03] p-6 rounded-3xl border border-white/5">
        <div className="space-y-1">
          <h3 className="text-gray-400 font-display text-[11px] tracking-[0.3em] uppercase flex items-center gap-3">
            <CalendarIcon size={14} className="text-[#22c55e]" /> 
            TACTICAL SCHEDULE // {format(currentWeekStart, 'MMM dd')} - {format(addDays(currentWeekStart, 6), 'MMM dd')}
          </h3>
          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Global matrix deployment window</p>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
           <button onClick={prevWeek} className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/40 hover:text-white">
              <ChevronRight className="rotate-180" size={16} />
           </button>
           <button onClick={currentWeek} className="px-4 py-2 hover:bg-white/5 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white border border-white/10">
              TODAY
           </button>
           <button onClick={nextWeek} className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/40 hover:text-white">
              <ChevronRight size={16} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {weekDays.map((dayObj, i) => (
          <div key={i} className="group flex flex-col md:flex-row items-stretch md:items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
            {/* Day Column */}
            <div className="w-16 shrink-0 flex flex-col items-center justify-center py-2 border-r border-white/5">
              <span className="text-[10px] font-black text-[#22c55e] tracking-widest leading-none mb-1">{dayObj.day}</span>
              <span className="text-sm font-display text-white/40">{format(dayObj.date, 'dd')}</span>
            </div>

            {/* Sessions Column */}
            <div className="flex-1 space-y-3">
              {dayObj.sessions.length === 0 ? (
                <span className="text-[10px] font-bold text-white/5 uppercase tracking-[0.4em] ml-2">No active operations detected</span>
              ) : (
                <div className="space-y-3">
                  {dayObj.sessions.map((session: any) => (
                    <div key={session.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.03] p-5 rounded-2xl border border-white/5 group-hover:border-[#22c55e]/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${session.is_special ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-[#22c55e]/10 text-[#22c55e]'}`}>
                           {session.is_special ? <Zap size={18} /> : <Target size={18} />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <h4 className="text-sm font-black text-white uppercase tracking-widest">{session.title}</h4>
                             {session.is_special && (
                               <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[7px] font-black text-amber-500 uppercase tracking-widest">Special Ops</span>
                             )}
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Clock size={12} className="text-[#22c55e]" /> {session.start_time.substring(0, 5)}</span>
                            <span className="flex items-center gap-1.5">
                              <Users size={12} className={session.confirmed_count >= session.max_capacity ? 'text-red-500' : 'text-[#22c55e]'} /> 
                              {session.confirmed_count} / {session.max_capacity || 20} SPOTS
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        {session.user_booking_status ? (
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
                            disabled={session.confirmed_count >= (session.max_capacity || 20)}
                            className="w-full md:w-auto px-6 py-2 bg-[#22c55e] hover:bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:bg-white/10 disabled:text-white/20"
                          >
                            {session.confirmed_count >= (session.max_capacity || 20) ? 'Session Full' : 'Book Session'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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
