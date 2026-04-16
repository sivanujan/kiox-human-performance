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
import { Anton } from "next/font/google";
import BookSessionModal from "@/components/modals/BookSessionModal";

const anton = Anton({ weight: '400', subsets: ['latin'] });

export default function WeeklySchedule() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchWeeklySessions();
  }, []);

  const fetchWeeklySessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/athlete/bookings');
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

  const dayAbbreviations = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const weekDays = dayAbbreviations.map((day, i) => {
      const d = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      const daySessions = sessions.filter(s => s.scheduled_date === format(d, 'yyyy-MM-dd'));
      return { day, date: d, sessions: daySessions };
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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white/30 font-['Anton'] text-[11px] tracking-[0.3em] uppercase flex items-center gap-3">
          <CalendarIcon size={14} /> DEP_OPS SCHEDULE // CURRENT WEEK
        </h3>
        <div className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full">
           <span className="text-[9px] font-black text-[#22c55e] uppercase tracking-widest">REALTIME_SYNC</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {weekDays.map((dayObj, i) => (
          <div key={i} className="group flex flex-col md:flex-row items-stretch md:items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
            {/* Day Column */}
            <div className="w-16 shrink-0 flex flex-col items-center justify-center py-2 border-r border-white/5">
              <span className="text-[10px] font-black text-[#22c55e] tracking-widest leading-none mb-1">{dayObj.day}</span>
              <span className="text-sm font-['Anton'] text-white/40">{format(dayObj.date, 'dd')}</span>
            </div>

            {/* Sessions Column */}
            <div className="flex-1 min-w-0">
              {dayObj.sessions.length === 0 ? (
                <div className="flex items-center gap-3 h-full">
                   <span className="text-[10px] font-black text-white/10 uppercase tracking-[2px] italic py-2">No active operations detected</span>
                </div>
              ) : (
                <div className="space-y-2">
                   {dayObj.sessions.map((session, sIdx) => (
                     <div key={sIdx} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                           <div className={`p-2 rounded-lg ${
                             session.session_type === 'STRENGTH' ? 'bg-amber-500/10 text-amber-500' :
                             session.session_type === 'TACTICAL' ? 'bg-blue-500/10 text-blue-500' :
                             session.session_type === 'MATCH_PREP' ? 'bg-[#22c55e]/10 text-[#22c55e]' :
                             'bg-purple-500/10 text-purple-500'
                           }`}>
                              {session.session_type === 'STRENGTH' ? <Zap size={14} /> : 
                               session.session_type === 'TACTICAL' ? <Target size={14} /> : 
                               <ShieldCheck size={14} />}
                           </div>
                           <div className="min-w-0">
                              <h4 className="text-[11px] font-black text-white uppercase tracking-wider truncate mb-0.5">{session.title}</h4>
                              <div className="flex items-center gap-3 opacity-30">
                                 <span className="text-[9px] font-black uppercase flex items-center gap-1"><Clock size={10} /> {session.start_time.slice(0, 5)}</span>
                                 <span className="text-[9px] font-black uppercase flex items-center gap-1"><Users size={10} /> {session.confirmed_count}/{session.max_capacity}</span>
                              </div>
                           </div>
                        </div>

                        {/* Status/Action */}
                        <div>
                           {session.user_booking_status === 'CONFIRMED' ? (
                             <div className="flex items-center gap-2 text-[#22c55e] px-4 py-2 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg">
                                <CheckCircle2 size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">BOOKED</span>
                             </div>
                           ) : session.user_booking_status === 'PENDING' ? (
                             <div className="flex items-center gap-2 text-amber-500 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-pulse">
                                <Clock size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#22c55e]">PENDING</span>
                             </div>
                           ) : session.user_booking_status === 'WAITLISTED' ? (
                             <div className="flex items-center gap-2 text-purple-500 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                <Users size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#22c55e]">WAITLIST</span>
                             </div>
                           ) : session.spots_remaining === 0 ? (
                             <button 
                                onClick={() => { setSelectedSession(session); setIsModalOpen(true); }}
                                className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-black transition-all"
                             >
                                <span className="text-[9px] font-black uppercase tracking-widest">JOIN WAITLIST</span>
                             </button>
                           ) : (
                             <button 
                                onClick={() => { setSelectedSession(session); setIsModalOpen(true); }}
                                className="px-6 py-2 bg-[#22c55e] text-black rounded-lg hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_5px_15px_rgba(34,197,94,0.3)]"
                             >
                                <span className="text-[9px] font-black uppercase tracking-widest">BOOK SESSION</span>
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
