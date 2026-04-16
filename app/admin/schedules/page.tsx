"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Activity, 
  Clock, 
  MapPin, 
  Users,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { Anton } from "next/font/google";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from "date-fns";
import { createClient } from "@/utils/supabase/client";
import CreateSessionModal from "@/components/modals/CreateSessionModal";
import SessionDetailsModal from "@/components/modals/SessionDetailsModal";
import { TrainingSession } from "@/hooks/useSessions";

const anton = Anton({ weight: '400', subsets: ['latin'] });

export default function AdminSchedules() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    const start = format(startOfWeek(startOfMonth(currentMonth)), "yyyy-MM-dd");
    const end = format(endOfWeek(endOfMonth(currentMonth)), "yyyy-MM-dd");

    const [sessionRes, athleteRes] = await Promise.all([
      supabase.from("training_sessions").select("*").gte("scheduled_date", start).lte("scheduled_date", end),
      supabase.from("profiles").select("*").eq("role", "athlete")
    ]);

    if (!sessionRes.error) setSessions(sessionRes.data || []);
    if (!athleteRes.error) setAthletes(athleteRes.data || []);
    setLoading(false);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STRENGTH': return "bg-amber-500";
      case 'TACTICAL': return "bg-blue-500";
      case 'CONDITIONING': return "bg-[#22c55e]";
      case 'RECOVERY': return "bg-purple-500";
      default: return "bg-white/20";
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Month Control */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="text-[#22c55e]" size={16} />
            <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[5px]">Fleet Operations Hub</span>
          </div>
          <h1 className={`${anton.className} text-6xl text-white uppercase tracking-wider`}>Global Schedules</h1>
        </div>

        <div className="flex items-center gap-6 bg-[#111] border border-white/5 p-4 rounded-[28px] shadow-2xl">
          <button onClick={prevMonth} className="p-3 rounded-xl hover:bg-white/5 transition-all text-white/40 hover:text-white">
            <ChevronLeft size={24} />
          </button>
          <div className="px-6 border-x border-white/5">
            <div className="text-white font-['Anton'] text-2xl tracking-[0.2em] uppercase min-w-[200px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </div>
          </div>
          <button onClick={nextMonth} className="p-3 rounded-xl hover:bg-white/5 transition-all text-white/40 hover:text-white">
            <ChevronRight size={24} />
          </button>
        </div>

        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#22c55e] text-black px-10 py-5 rounded-[24px] font-['Anton'] text-sm tracking-[0.2em] hover:bg-white transition-all uppercase shadow-xl flex items-center justify-center gap-3"
        >
          <Plus size={20} /> INITIALIZE SESSION
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[48px] overflow-hidden shadow-2xl relative">
        {loading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
             <Loader2 size={48} className="animate-spin text-[#22c55e]" />
          </div>
        )}

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="py-6 text-center text-[10px] font-black text-white/20 tracking-[4px] border-r last:border-r-0 border-white/5 bg-white/[0.02]">
               {day}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const daySessions = sessions.filter(s => isSameDay(new Date(s.scheduled_date), day));
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div 
                key={idx}
                className={`min-h-[160px] p-4 border-r border-b border-white/5 transition-all ${!isCurrentMonth ? 'opacity-20' : ''} ${isToday ? 'bg-[#22c55e]/[0.02]' : ''} hover:bg-white/[0.03] last:border-r-0`}
              >
                <div className="flex justify-between items-start mb-4">
                   <span className={`font-['Anton'] text-xl tracking-widest ${isToday ? 'text-[#22c55e]' : 'text-white/40'}`}>
                      {format(day, "dd")}
                   </span>
                </div>

                <div className="space-y-2">
                   {daySessions.map(session => (
                     <button
                       key={session.id}
                       onClick={() => setSelectedSession(session)}
                       className={`w-full text-left p-3 rounded-xl border border-white/5 relative group transition-all hover:translate-y-[-2px] hover:shadow-xl ${getTypeColor(session.session_type)} bg-opacity-10`}
                     >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${getTypeColor(session.session_type)}`} />
                        <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">{session.start_time.slice(0, 5)}</div>
                        <div className="text-white font-bold text-[10px] uppercase truncate tracking-wide">{session.title}</div>
                        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="w-1 h-1 rounded-full bg-white/20" />
                           <div className="text-[7px] text-white/40 font-black uppercase tracking-widest">ACTIVE OPS</div>
                        </div>
                     </button>
                   ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <CreateSessionModal 
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); fetchData(); }}
        athletes={athletes}
      />
      
      <SessionDetailsModal 
        isOpen={!!selectedSession}
        onClose={() => { setSelectedSession(null); fetchData(); }}
        session={selectedSession}
      />
    </div>
  );
}
