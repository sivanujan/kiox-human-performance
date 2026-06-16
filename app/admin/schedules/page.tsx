"use client";

import { useEffect, useState } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameDay, 
  isSameMonth, 
  eachDayOfInterval 
} from "date-fns";
import { createClient } from "@/utils/supabase/client";
import CreateSessionModal from "@/components/modals/CreateSessionModal";
import SessionDetailsModal from "@/components/modals/SessionDetailsModal";
import { TrainingSession } from "@/hooks/useSessions";

export default function AdminSchedules() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [selectedDateForCreation, setSelectedDateForCreation] = useState<string | undefined>(undefined);
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = format(startOfWeek(startOfMonth(currentMonth)), "yyyy-MM-dd");
      const end = format(endOfWeek(endOfMonth(currentMonth)), "yyyy-MM-dd");

      // STRICTLY fetch schedule and emergency sessions (where is_curriculum = false)
      const [sessionRes, athleteRes] = await Promise.all([
        supabase
          .from("training_sessions")
          .select("*, coach:profiles!coach_id(first_name, last_name)")
          .eq("is_curriculum", false)
          .gte("scheduled_date", start)
          .lte("scheduled_date", end),
        supabase
          .from("profiles")
          .select("*")
          .eq("role", "athlete")
      ]);

      if (sessionRes.error) {
        console.error("Session fetch error:", sessionRes.error.message, sessionRes.error.details, sessionRes.error.hint);
        setError(`Failed to load schedule sessions: ${sessionRes.error.message}`);
      } else {
        setSessions(sessionRes.data || []);
      }

      if (athleteRes.error) {
        console.error("Athlete fetch error:", athleteRes.error.message, athleteRes.error.details, athleteRes.error.hint);
        setError(`Failed to load athlete profiles: ${athleteRes.error.message}`);
      } else {
        setAthletes(athleteRes.data || []);
      }
    } catch (err: any) {
      console.error("Critical scheduling data synchronization error:", err);
      setError(err?.message || "A network or connection error occurred while syncing schedules.");
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const getSessionStyle = (session: TrainingSession) => {
    if (session.is_emergency) {
      return "bg-red-500/10 border-red-500/20 text-red-500 hover:border-red-500/40";
    }
    if (session.is_external) {
      return "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-500/40";
    }
    switch (session.session_type?.toUpperCase()) {
      case 'STRENGTH': return "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:border-amber-500/40";
      case 'TACTICAL': return "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-500/40";
      case 'CONDITIONING': return "bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e] hover:border-[#22c55e]/40";
      case 'RECOVERY': return "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:border-purple-500/40";
      case 'MEAL': return "bg-green-400/10 border-green-400/20 text-green-400 hover:border-green-400/40";
      case 'CURFEW': return "bg-zinc-600/10 border-zinc-600/20 text-zinc-400 hover:border-zinc-600/40";
      case 'LOGISTICS': return "bg-sky-400/10 border-sky-400/20 text-sky-400 hover:border-sky-400/40";
      default: return "bg-white/5 border-white/10 text-white/60 hover:border-white/20";
    }
  };

  const getSessionIndicatorColor = (session: TrainingSession) => {
    if (session.is_emergency) return "bg-red-500";
    if (session.is_external) return "bg-blue-500";
    switch (session.session_type?.toUpperCase()) {
      case 'STRENGTH': return "bg-amber-500";
      case 'TACTICAL': return "bg-blue-500";
      case 'CONDITIONING': return "bg-[#22c55e]";
      case 'RECOVERY': return "bg-purple-500";
      case 'MEAL': return "bg-green-400";
      case 'CURFEW': return "bg-zinc-600";
      case 'LOGISTICS': return "bg-sky-400";
      default: return "bg-white/40";
    }
  };

  const openCreateModalForDate = (date: Date) => {
    setSelectedDateForCreation(format(date, "yyyy-MM-dd"));
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Month Control */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <CalendarIcon className="text-[#22c55e]" size={12} />
            <span className="text-[8px] font-black text-[#22c55e] uppercase tracking-[2px]">Operational Scheduler</span>
          </div>
          <h1 className="font-display text-xl text-white uppercase tracking-wider">Schedules Matrix</h1>
        </div>

        <div className="flex items-center gap-2 bg-[#111] border border-white/5 p-1 rounded-xl">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5 transition-all text-white/40 hover:text-white">
            <ChevronLeft size={14} />
          </button>
          <div className="px-3 border-x border-white/5">
            <div className="text-white font-display text-xs tracking-[0.1em] uppercase min-w-[120px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </div>
          </div>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5 transition-all text-white/40 hover:text-white">
            <ChevronRight size={14} />
          </button>
        </div>

        <button 
          onClick={() => {
            setSelectedDateForCreation(undefined);
            setIsCreateModalOpen(true);
          }}
          className="bg-[#22c55e] text-black px-4 py-2.5 rounded-lg font-display text-[10px] tracking-[0.1em] hover:bg-white transition-all uppercase flex items-center justify-center gap-1.5"
        >
          <Plus size={12} /> INITIALIZE SESSION
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[48px] overflow-hidden shadow-2xl relative">
        {loading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
             <Loader2 size={48} className="animate-spin text-[#22c55e]" />
          </div>
        )}

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="py-6 text-center text-[10px] font-black text-gray-500 tracking-[4px] border-r last:border-r-0 border-white/5 bg-white/[0.02]">
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
                onClick={() => openCreateModalForDate(day)}
                className={`min-h-[160px] p-4 border-r border-b border-white/5 transition-all ${
                  !isCurrentMonth ? 'opacity-20' : ''
                } ${isToday ? 'bg-[#22c55e]/[0.02]' : ''} hover:bg-white/[0.03] last:border-r-0 cursor-pointer`}
              >
                <div className="flex justify-between items-start mb-4">
                   <span className={`font-display text-xl tracking-widest ${isToday ? 'text-[#22c55e]' : 'text-white/40'}`}>
                      {format(day, "dd")}
                   </span>
                </div>

                <div className="space-y-2">
                   {daySessions.map(session => (
                     <button
                       key={session.id}
                       onClick={(e) => { 
                         e.stopPropagation(); 
                         setSelectedSession(session); 
                       }}
                       className={`w-full text-left p-3 rounded-xl border relative group transition-all hover:translate-y-[-2px] hover:shadow-xl ${getSessionStyle(session)}`}
                     >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${getSessionIndicatorColor(session)}`} />
                        
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="text-white font-bold text-xs uppercase truncate tracking-wide flex-1">{session.title}</div>
                          <div className="text-[8px] font-black text-white/40 uppercase tracking-widest shrink-0 mt-0.5">
                            {session.start_time.slice(0, 5)}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          {session.coach ? (
                            <div className="text-[8px] text-white/50 font-bold uppercase tracking-wider">
                              Coach: {session.coach.first_name} {session.coach.last_name || ""}
                            </div>
                          ) : (
                            <div className="text-[8px] text-white/30 font-bold uppercase tracking-wider">
                              Coach: Unassigned
                            </div>
                          )}

                          {session.is_external && session.external_player_name && (
                            <div className="text-[8px] text-gray-500 font-mono truncate">
                              Client: {session.external_player_name}
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                          {session.is_emergency && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[6px] font-black tracking-widest uppercase">
                              🚨 EMERGENCY
                            </span>
                          )}

                          {session.is_external && (
                            <span className={`px-1.5 py-0.5 rounded text-[6px] font-black tracking-widest uppercase border ${
                              session.payment_status === 'CONFIRMED'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                              {session.payment_status || 'PENDING'}
                            </span>
                          )}
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
        defaultDate={selectedDateForCreation}
        defaultIsCurriculum={false}
      />
      
      <SessionDetailsModal 
        isOpen={!!selectedSession}
        onClose={() => { setSelectedSession(null); fetchData(); }}
        session={selectedSession}
      />
    </div>
  );
}
