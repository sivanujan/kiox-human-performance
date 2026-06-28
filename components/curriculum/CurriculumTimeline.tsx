"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  AlertCircle,
  UserCheck,
  Info
} from "lucide-react";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import CreateSessionModal from "@/components/modals/CreateSessionModal";
import SessionDetailsModal from "@/components/modals/SessionDetailsModal";
import { useAuth } from "@/components/providers/AuthProvider";

export default function CurriculumTimeline() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [monthCurriculumDates, setMonthCurriculumDates] = useState<Set<string>>(new Set());
  
  const [athletes, setAthletes] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const supabase = createClient();
  const isWritable = profile?.role === 'superadmin' || profile?.role === 'staff';

  useEffect(() => {
    fetchDayData();
    fetchMonthCurriculumDates();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDayData(true);
        fetchMonthCurriculumDates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [selectedDate]);

  useEffect(() => {
    fetchMonthCurriculumDates();
  }, [currentCalendarMonth]);

  const fetchMonthCurriculumDates = async () => {
    try {
      const start = format(startOfMonth(currentCalendarMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentCalendarMonth), "yyyy-MM-dd");

      const { data, error: err } = await supabase
        .from("training_sessions")
        .select("scheduled_date")
        .eq("is_curriculum", true)
        .gte("scheduled_date", start)
        .lte("scheduled_date", end);

      if (!err && data) {
        const datesSet = new Set<string>(data.map((d: any) => d.scheduled_date as string));
        setMonthCurriculumDates(datesSet);
      }
    } catch (e) {
      console.error("Error fetching month dates:", e);
    }
  };

  const fetchDayData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    if (!isBackground) setLoadStatus("Fetching sessions...");
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // 1. Fetch sessions for the selected day
      const sessionRes = await supabase
        .from("training_sessions")
        .select("*")
        .eq("scheduled_date", dateStr)
        .eq("is_curriculum", true)
        .order("start_time", { ascending: true });

      if (sessionRes.error) {
        console.error("Session fetch error:", sessionRes.error);
        if (!isBackground) setError("Failed to load timeline items.");
      } else {
        setSessions(sessionRes.data || []);
      }

      if (!isBackground) setLoadStatus("Fetching profiles...");
      // 2. Fetch profiles
      const [athletesRes, coachesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "athlete"),
        supabase.from("profiles").select("*").in("role", ["staff", "superadmin"])
      ]);

      if (!athletesRes.error) setAthletes(athletesRes.data || []);
      if (!coachesRes.error) setCoaches(coachesRes.data || []);
      
      if (!isBackground) setLoadStatus("Data processing complete.");
    } catch (err: any) {
      console.error("Timeline data synchronization error:", err);
      if (!isBackground) {
        setError(err?.message || "Error syncing day timeline.");
        setLoadStatus("Error occurred.");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const nextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const prevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const setToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentCalendarMonth(now);
  };

  // Small Calendar calculations
  const calendarDays = useMemo<(Date | null)[]>(() => {
    const start = startOfMonth(currentCalendarMonth);
    const end = endOfMonth(currentCalendarMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Day of week offset for padding
    const startDayOfWeek = start.getDay(); // 0 is Sun
    const paddingDays: null[] = Array.from({ length: startDayOfWeek }).fill(null) as null[];

    return [...paddingDays, ...days];
  }, [currentCalendarMonth]);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'STRENGTH': 
        return { border: "border-amber-500/30", bg: "bg-amber-500/10", accent: "bg-amber-500", text: "text-amber-400" };
      case 'TACTICAL': 
        return { border: "border-blue-500/30", bg: "bg-blue-500/10", accent: "bg-blue-500", text: "text-blue-400" };
      case 'CONDITIONING': 
        return { border: "border-[#22c55e]/30", bg: "bg-[#22c55e]/10", accent: "bg-[#22c55e]", text: "text-[#22c55e]" };
      case 'RECOVERY': 
        return { border: "border-purple-500/30", bg: "bg-purple-500/10", accent: "bg-purple-500", text: "text-purple-400" };
      case 'MEAL': 
        return { border: "border-green-400/30", bg: "bg-green-400/10", accent: "bg-green-400", text: "text-green-400" };
      case 'CURFEW': 
        return { border: "border-zinc-500/30", bg: "bg-zinc-700/20", accent: "bg-zinc-600", text: "text-zinc-400" };
      case 'LOGISTICS': 
        return { border: "border-sky-400/30", bg: "bg-sky-400/10", accent: "bg-sky-400", text: "text-sky-400" };
      default: 
        return { border: "border-[var(--border-primary)]", bg: "bg-[var(--bg-secondary)]", accent: "bg-[var(--border-primary)]", text: "text-[var(--text-secondary)]" };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20 items-start">
      {/* Main Timeline View */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-[28px] shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="text-[var(--accent-green)]" size={14} />
              <span className="text-[10px] font-black text-[var(--accent-green)] uppercase tracking-[4px]">Operational Calendar Timeline</span>
            </div>
            <h1 className="text-3xl font-display font-black text-[var(--text-primary)] uppercase tracking-wider">Daily Program</h1>
          </div>

          <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-1.5 rounded-2xl w-full sm:w-auto justify-between">
            <button onClick={prevDay} className="p-2.5 rounded-xl hover:bg-[var(--bg-card-hover)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex flex-col items-center min-w-[140px] px-4">
              <span className="text-[var(--text-primary)] font-bold text-xs uppercase tracking-widest">{format(selectedDate, "eeee")}</span>
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">{format(selectedDate, "MMM dd, yyyy")}</span>
            </div>

            <button onClick={nextDay} className="p-2.5 rounded-xl hover:bg-[var(--bg-card-hover)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <ChevronRight size={18} />
            </button>

            <button onClick={setToday} className="px-3 py-1.5 border border-[var(--border-primary)] rounded-lg text-[9px] font-black uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-active)]/40 transition-all">
              Today
            </button>
          </div>

          {isWritable && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto px-6 py-4 bg-[var(--accent-green)] text-[var(--text-on-green)] text-[10px] font-black uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 hover:opacity-80 transition-all shadow-md"
            >
              <Plus size={14} /> Initialize Session
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Timeline Sequence */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[36px] p-8 min-h-[400px] relative">

          {/* Loading status badge — always visible in top-right of outer card */}
          {loading && (
            <div className="absolute top-5 right-5 z-10 flex items-center gap-2 px-3 py-1.5 text-[10px] text-[var(--accent-green)] font-mono bg-[var(--bg-card)] rounded-lg border border-[var(--accent-green)]/25 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse shrink-0" />
              STATUS: {loadStatus}
            </div>
          )}

          {loading ? (
            // Skeleton rows
            <div className="relative border-l-2 border-[var(--border-primary)] ml-4 sm:ml-24 pl-8 py-4 space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="relative">
                  <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-[var(--border-primary)] animate-pulse" />
                  <div className="absolute right-full mr-8 top-1 hidden sm:flex flex-col items-end gap-1">
                    <div className="h-4 w-14 bg-[var(--border-primary)] rounded animate-pulse" />
                    <div className="h-2 w-10 bg-[var(--border-primary)] rounded animate-pulse" />
                  </div>
                  <div className="w-full bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-2xl space-y-3">
                    <div className="h-4 w-1/3 bg-[var(--border-primary)] rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-[var(--border-primary)] rounded animate-pulse" />
                    <div className="h-2 w-1/4 bg-[var(--border-primary)] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Info size={40} className="text-[var(--text-muted)] mb-4" />
              <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[4px]">Matrix Core Idle</h4>
              <p className="text-[9px] text-[var(--text-muted)] uppercase mt-2 max-w-[280px]">No sessions or curriculum items scheduled for this date.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-[var(--border-primary)] ml-4 sm:ml-24 pl-8 py-4 space-y-12">
              {sessions.map((session) => {
                const styles = getCategoryStyles(session.session_type);
                const assignedCoach = coaches.find(c => c.id === session.coach_id);
                
                return (
                  <div key={session.id} className="relative group">
                    
                    {/* Time Label (Left) */}
                    <div className="absolute right-full mr-8 top-1 hidden sm:flex flex-col items-end min-w-[70px]">
                      <span className="text-sm font-black text-[var(--text-primary)] font-mono">
                        {(() => {
                          const parts = session.start_time.split(":");
                          let hours = parseInt(parts[0], 10);
                          const minutes = parts[1] || "00";
                          const ampm = hours >= 12 ? "PM" : "AM";
                          hours = hours % 12;
                          hours = hours ? hours : 12;
                          return `${hours}:${minutes} ${ampm}`;
                        })()}
                      </span>
                      <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">{session.duration_minutes} MIN</span>
                    </div>

                    {/* Timeline Node Dot */}
                    <div className={`absolute -left-[41px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-[var(--bg-primary)] ${styles.accent} shadow-lg transition-transform group-hover:scale-125 z-10`} />

                    {/* Timeline Main Card */}
                    <div 
                      onClick={() => setSelectedSession(session)}
                      className={`w-full bg-[var(--bg-card)] border ${styles.border} p-6 rounded-2xl hover:border-[var(--border-active)]/40 transition-all cursor-pointer relative overflow-hidden`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.accent}`} />
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          <div className="sm:hidden flex items-center gap-2 text-[9px] font-black text-[var(--text-muted)] uppercase">
                            <Clock size={10} /> 
                            {(() => {
                              const parts = session.start_time.split(":");
                              let hours = parseInt(parts[0], 10);
                              const minutes = parts[1] || "00";
                              const ampm = hours >= 12 ? "PM" : "AM";
                              hours = hours % 12;
                              hours = hours ? hours : 12;
                              return `${hours}:${minutes} ${ampm}`;
                            })()}
                             ({session.duration_minutes} MIN)
                          </div>

                          <div className="flex items-center gap-3">
                            <h3 className="text-md font-bold text-[var(--text-primary)] uppercase tracking-wider">{session.title}</h3>
                            <span className={`px-2 py-0.5 border text-[7px] font-black uppercase tracking-widest rounded ${styles.text} ${styles.bg}`}>
                              {session.session_type === 'LOGISTICS' ? 'LOGISTICS/GENERAL' : session.session_type}
                            </span>
                          </div>

                          {session.notes && (
                            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans line-clamp-2 max-w-2xl">{session.notes}</p>
                          )}

                          <div className="flex flex-wrap gap-4 text-[9px] text-[var(--text-muted)] font-black uppercase tracking-wider pt-2">
                            {session.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={10} className="text-[var(--accent-green)]" /> {session.location}
                              </span>
                            )}
                            {assignedCoach && (
                              <span className="flex items-center gap-1">
                                <UserCheck size={10} className="text-[var(--accent-green)]" /> Coach: {assignedCoach.first_name} {assignedCoach.last_name || ''}
                              </span>
                            )}
                            {!session.is_program && session.assigned_athletes && (
                              <span className="flex items-center gap-1">
                                <Users size={10} /> {session.assigned_athletes.length} Assigned
                              </span>
                            )}
                          </div>
                        </div>

                        {session.max_capacity && (
                          <div className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">
                            Slots: {session.confirmed_count || 0} / {session.max_capacity}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Small Calendar Sidebar Block */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl p-6 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border-primary)] mb-4">
            <h4 className="text-[10px] font-black text-[var(--accent-green)] uppercase tracking-[3px] flex items-center gap-2">
              <CalendarIcon size={12} /> Curriculum Calendar
            </h4>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              {format(currentCalendarMonth, "MMMM yyyy")}
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentCalendarMonth(prev => subMonths(prev, 1))}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setCurrentCalendarMonth(prev => addMonths(prev, 1))}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <span key={idx} className="text-[9px] font-black text-[var(--text-muted)] uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayItem, idx) => {
              if (!dayItem) {
                return <div key={`pad-${idx}`} className="h-8" />;
              }

              const dateKey = format(dayItem, "yyyy-MM-dd");
              const hasCurriculum = monthCurriculumDates.has(dateKey);
              const isSelected = isSameDay(dayItem, selectedDate);
              const isCurrentDay = isToday(dayItem);

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dayItem)}
                  className={`h-8 rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition-all ${
                    isSelected 
                      ? "bg-[var(--accent-green)] text-[var(--text-on-green)] shadow-md" 
                      : isCurrentDay 
                        ? "border border-[var(--accent-green)] text-[var(--accent-green)] bg-[var(--accent-green)]/10" 
                        : "hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span>{format(dayItem, "d")}</span>
                  {hasCurriculum && (
                    <span 
                      className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${
                        isSelected ? "bg-black" : "bg-[var(--accent-green)]"
                      }`} 
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between text-[9px] text-[var(--text-muted)] font-black uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-green)]" /> Scheduled Date
            </span>
            <span>Click date to view</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateSessionModal 
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); fetchDayData(); fetchMonthCurriculumDates(); }}
        onSuccess={(dates: string[]) => {
          if (dates && dates.length > 0) {
            const parts = dates[0].split("-");
            const newDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            setSelectedDate(newDate);
            setCurrentCalendarMonth(newDate);
          }
          setIsCreateModalOpen(false);
          fetchDayData();
          fetchMonthCurriculumDates();
        }}
        athletes={athletes}
        coaches={coaches}
        defaultIsCurriculum={true}
      />

      <SessionDetailsModal 
        isOpen={!!selectedSession}
        onClose={() => { setSelectedSession(null); fetchDayData(); fetchMonthCurriculumDates(); }}
        session={selectedSession}
      />
    </div>
  );
}
