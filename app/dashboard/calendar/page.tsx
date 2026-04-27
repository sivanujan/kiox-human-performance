"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap, Target, Users, Clock, Loader2, Calendar as CalendarIcon } from "lucide-react";

export default function AthleteCalendarPage() {
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  useEffect(() => {
    fetchMonthSessions();
  }, [currentDate]);

  const fetchMonthSessions = async () => {
    setLoading(true);
    try {
      const start = format(startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const res = await fetch(`/api/athlete/calendar?start=${start}&end=${end}`);
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      setSessions(data || []);
    } catch (err) {
      console.error("Calendar fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const selectedDaySessions = sessions.filter(s => isSameDay(new Date(s.scheduled_date), selectedDay!));

  return (
    <div className="p-4 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-[#22c55e]/10 rounded-xl">
                <CalendarIcon className="text-[#22c55e]" size={20} />
             </div>
             <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[5px]">Tactical Timeline</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl text-white uppercase tracking-wider">
             Monthly Calendar
          </h1>
        </div>

        <div className="flex items-center gap-4 bg-[#111] p-2 rounded-2xl border border-white/5 shadow-2xl">
           <button onClick={prevMonth} className="p-3 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
              <ChevronLeft size={24} />
           </button>
           <div className="px-6 text-center min-w-[180px]">
              <div className="text-[10px] font-black text-[#22c55e] uppercase tracking-[3px] mb-1">{format(currentDate, 'yyyy')}</div>
              <div className="text-white font-display text-2xl uppercase tracking-widest">{format(currentDate, 'MMMM')}</div>
           </div>
           <button onClick={nextMonth} className="p-3 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
              <ChevronRight size={24} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <div className="bg-[#111] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
            {/* Day Names */}
            <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                <div key={d} className="py-6 text-center text-[10px] font-black text-gray-500 tracking-[4px]">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 relative">
              {loading && (
                <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                   <Loader2 className="animate-spin text-[#22c55e]" size={40} />
                </div>
              )}
              
              {calendarDays.map((day, i) => {
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isTodayDate = isToday(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const daySessions = sessions.filter(s => isSameDay(new Date(s.scheduled_date), day));
                
                return (
                  <motion.div 
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    className={`
                      min-h-[140px] p-4 border-r border-b border-white/5 cursor-pointer transition-all relative group
                      ${!isCurrentMonth ? 'opacity-20 grayscale' : 'hover:bg-white/[0.02]'}
                      ${isSelected ? 'bg-[#22c55e]/5' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span className={`
                         text-sm font-display 
                         ${isTodayDate ? 'text-[#22c55e]' : isSelected ? 'text-white' : 'text-white/40'}
                       `}>
                          {format(day, 'dd')}
                       </span>
                       {daySessions.length > 0 && (
                         <div className="flex gap-1">
                           {daySessions.slice(0, 3).map((s, si) => (
                             <div key={si} className={`w-1.5 h-1.5 rounded-full ${s.is_special ? 'bg-amber-500 shadow-[0_0_5px_#f59e0b]' : 'bg-[#22c55e] shadow-[0_0_5px_#22c55e]'}`} />
                           ))}
                         </div>
                       )}
                    </div>

                    <div className="space-y-1 overflow-hidden">
                       {daySessions.slice(0, 2).map((s, si) => (
                         <div key={si} className={`
                           px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider truncate
                           ${s.is_special ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'}
                         `}>
                           {s.start_time.slice(0, 5)} {s.title}
                         </div>
                       ))}
                       {daySessions.length > 2 && (
                         <div className="text-[7px] font-black text-gray-500 text-center mt-1">
                           + {daySessions.length - 2} MORE
                         </div>
                       )}
                    </div>

                    {isTodayDate && (
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#22c55e] shadow-[0_0_10px_#22c55e]" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedDay?.toISOString()}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#111] border border-white/5 rounded-[40px] p-8 space-y-8 sticky top-24"
            >
               <div>
                  <div className="text-[#22c55e] text-[10px] font-black uppercase tracking-[3px] mb-2">{format(selectedDay!, 'EEEE')}</div>
                  <h3 className="text-white font-display text-3xl uppercase tracking-wider">{format(selectedDay!, 'MMMM dd')}</h3>
               </div>

               <div className="space-y-4">
                  {selectedDaySessions.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
                       <p className="text-white/20 text-[10px] font-black uppercase tracking-[3px]">No Operations Scheduled</p>
                    </div>
                  ) : (
                    selectedDaySessions.map((session) => (
                      <div key={session.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:border-[#22c55e]/30 transition-all group">
                         <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${session.is_special ? 'bg-amber-500/10 text-amber-500 pulse-amber' : 'bg-[#22c55e]/10 text-[#22c55e]'}`}>
                               {session.is_special ? <Zap size={14} /> : <Target size={14} />}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${session.is_special ? 'text-amber-500' : 'text-[#22c55e]'}`}>
                               {session.is_special ? 'Special Ops' : session.session_type}
                            </span>
                         </div>
                         <h4 className="text-white font-display text-lg uppercase tracking-wider mb-4 group-hover:text-[#22c55e] transition-colors">{session.title}</h4>
                         <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                               <Clock size={12} className="text-[#22c55e]" /> {session.start_time.slice(0, 5)}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                               <Users size={12} className="text-[#22c55e]" /> {session.max_capacity || 20} MAX
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
