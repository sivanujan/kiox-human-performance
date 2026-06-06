"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Clock, 
  User, 
  Edit2, 
  Trash2, 
  FileText, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Layers,
  ChevronDown
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  isSameDay, 
  isSameMonth, 
  isToday,
  parseISO
} from "date-fns";
import Avatar from "@/components/ui/Avatar";

const SESSION_TYPES = ["STRENGTH", "TACTICAL", "CONDITIONING", "RECOVERY", "CUSTOM"];

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  session_type: string;
  notes: string;
  coach_id: string;
  created_at: string;
  coach?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export default function SharedCalendarPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  // Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  
  // Data State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    session_type: "STRENGTH",
    event_date: "",
    event_time: "",
    notes: "",
    coach_id: ""
  });

  const initializedRef = useRef(false);

  // Check auth and fetch initial data
  useEffect(() => {
    if (!authLoading && user && !initializedRef.current) {
      initializedRef.current = true;
      fetchEvents();
      fetchCoaches();
      
      // Subscribe to Realtime Postgres Changes
      const channel = supabase
        .channel("coach-calendar-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "coach_calendar_events" },
          () => {
            fetchEvents();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, authLoading]);

  // Success message auto-dismiss
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchEvents = async () => {
    try {
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from("coach_calendar_events")
        .select(`
          *,
          coach:profiles!coach_id(first_name, last_name, avatar_url, username)
        `)
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true });

      if (fetchErr) throw fetchErr;
      setEvents(data || []);
    } catch (err: any) {
      console.error("Error fetching calendar events:", err);
      const errMsg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err)) || "Unknown connection error";
      setError(`Failed to sync calendar matrix: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      const { data, error: coachErr } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, username")
        .in("role", ["staff", "superadmin"]);
      
      if (coachErr) throw coachErr;
      setCoaches(data || []);
    } catch (err) {
      console.error("Error fetching coaches:", err);
    }
  };

  // UI Helpers
  const handlePrev = () => {
    setCurrentDate(prev => viewMode === "month" ? subMonths(prev, 1) : subWeeks(prev, 1));
  };

  const handleNext = () => {
    setCurrentDate(prev => viewMode === "month" ? addMonths(prev, 1) : addWeeks(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    const [hours, minutes] = parts;
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getTypeStyle = (type: string) => {
    switch (type?.toUpperCase()) {
      case "STRENGTH":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40",
          dot: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
          text: "text-emerald-400"
        };
      case "TACTICAL":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:border-amber-500/40",
          dot: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
          text: "text-amber-400"
        };
      case "CONDITIONING":
        return {
          bg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40",
          dot: "bg-cyan-500 shadow-[0_0_8px_#06b6d4]",
          text: "text-cyan-400"
        };
      case "RECOVERY":
        return {
          bg: "bg-violet-500/10 border-violet-500/20 text-violet-400 hover:border-violet-500/40",
          dot: "bg-violet-500 shadow-[0_0_8px_#8b5cf6]",
          text: "text-violet-400"
        };
      default:
        return {
          bg: "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:border-rose-500/40",
          dot: "bg-rose-500 shadow-[0_0_8px_#f43f5e]",
          text: "text-rose-400"
        };
    }
  };

  // Actions
  const openCreateModal = (date?: Date) => {
    setError(null);
    setFormData({
      id: "",
      title: "",
      session_type: "STRENGTH",
      event_date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      event_time: "09:00",
      notes: "",
      coach_id: profile?.role === "superadmin" ? (coaches[0]?.id || user?.id || "") : (user?.id || "")
    });
    setIsEditing(false);
    setIsCreateOpen(true);
  };

  const openDetailModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleEditClick = () => {
    if (!selectedEvent) return;
    setError(null);
    setFormData({
      id: selectedEvent.id,
      title: selectedEvent.title,
      session_type: selectedEvent.session_type,
      event_date: selectedEvent.event_date,
      event_time: selectedEvent.event_time.slice(0, 5),
      notes: selectedEvent.notes || "",
      coach_id: selectedEvent.coach_id
    });
    setIsEditing(true);
    setIsDetailOpen(false);
    setIsCreateOpen(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);

    const payload = {
      title: formData.title,
      session_type: formData.session_type,
      event_date: formData.event_date,
      event_time: `${formData.event_time}:00`, // db format
      notes: formData.notes,
      coach_id: formData.coach_id || user.id
    };

    try {
      if (isEditing && formData.id) {
        // Enforce update protection: only admin or the coach owning the event can update
        const isAdmin = profile?.role === "superadmin";
        const isOwner = selectedEvent?.coach_id === user.id;
        
        if (!isAdmin && !isOwner) {
          throw new Error("Security check failed: Unauthorized deployment change.");
        }

        const { error: updateErr } = await supabase
          .from("coach_calendar_events")
          .update(payload)
          .eq("id", formData.id);

        if (updateErr) throw updateErr;
        setSuccessMessage("Operational session updated successfully.");
      } else {
        const { error: insertErr } = await supabase
          .from("coach_calendar_events")
          .insert([payload]);

        if (insertErr) throw insertErr;
        setSuccessMessage("New operational session deployed to matrix.");
      }

      setIsCreateOpen(false);
      fetchEvents();
    } catch (err: any) {
      console.error("Database CRUD Error:", err);
      setError(err.message || "Failed to commit operational data to calendar matrix.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !user) return;
    
    // Enforce delete protection: only admin or the coach owning the event can delete
    const isAdmin = profile?.role === "superadmin";
    const isOwner = selectedEvent.coach_id === user.id;
    
    if (!isAdmin && !isOwner) {
      setError("Security violation: Only deployment organizers or superadmins may delete.");
      return;
    }

    if (!confirm("Are you sure you want to terminate this operational session?")) return;

    setIsDeleting(true);
    setError(null);

    try {
      const { error: deleteErr } = await supabase
        .from("coach_calendar_events")
        .delete()
        .eq("id", selectedEvent.id);

      if (deleteErr) throw deleteErr;

      setSuccessMessage("Session deleted from tactical matrix.");
      setIsDetailOpen(false);
      fetchEvents();
    } catch (err: any) {
      console.error("Error deleting event:", err);
      setError("Failed to terminate operational session.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Render variables
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getDayEvents = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    return events.filter(e => e.event_date === formatted);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-[#22c55e] animate-spin" size={40} />
        <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[3px] animate-pulse">Syncing Shared Calendar Matrix...</span>
      </div>
    );
  }

  const isAdmin = profile?.role === "superadmin";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-white font-display text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <CalendarDays className="text-[#22c55e]" size={36} /> Operational Calendar
          </h1>
          <p className="text-gray-400 font-label mt-2 text-xs md:text-sm tracking-[0.2em] uppercase">
            Shared Performance Grid // Realtime Sync Active
          </p>
        </div>

        <button
          onClick={() => openCreateModal()}
          className="bg-[#22c55e] text-black font-button text-xs font-black px-6 py-4 rounded-2xl hover:bg-white transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center gap-2 active-scale"
        >
          <Plus size={16} /> Deploy Session
        </button>
      </div>

      {/* Message banners */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-bold uppercase tracking-widest"
          >
            <CheckCircle size={16} /> {successMessage}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest"
          >
            <AlertTriangle size={16} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Controls */}
      <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrev}
            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-[#22c55e]/30 text-gray-400 hover:text-white transition-all active-scale"
          >
            <ChevronLeft size={16} />
          </button>
          
          <h2 className="text-white font-display text-lg md:text-xl font-black uppercase tracking-wider min-w-[200px] text-center">
            {viewMode === "month" 
              ? format(currentDate, "MMMM yyyy")
              : `Week of ${format(weekStart, "MMM d, yyyy")}`
            }
          </h2>

          <button 
            onClick={handleNext}
            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-[#22c55e]/30 text-gray-400 hover:text-white transition-all active-scale"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-[#22c55e]/30 text-[10px] font-black uppercase tracking-widest transition-all active-scale"
          >
            Today
          </button>

          <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("month")}
              className={`px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                viewMode === "month"
                  ? "bg-[#22c55e] text-black shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                viewMode === "week"
                  ? "bg-[#22c55e] text-black shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Grid container */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        {viewMode === "month" ? (
          /* ====================================
             MONTH VIEW
             ==================================== */
          <div className="flex flex-col">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.01]">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                <div key={d} className="p-4 text-center text-gray-600 font-label text-[9px] font-black uppercase tracking-[2px]">
                  {d}
                </div>
              ))}
            </div>

            {/* Monthly Grid */}
            <div className="grid grid-cols-7 grid-rows-6 md:min-h-[700px] border-b border-white/5">
              {monthDays.map((day, idx) => {
                const dayEvents = getDayEvents(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelectedToday = isToday(day);

                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] md:min-h-[130px] border-r border-b border-white/5 p-2 flex flex-col justify-between transition-all group ${
                      isCurrentMonth ? "bg-black/20" : "bg-white/[0.01] opacity-30"
                    } hover:bg-white/[0.02] relative`}
                  >
                    {/* Day number & add icon */}
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-mono font-black rounded-md w-6 h-6 flex items-center justify-center ${
                        isSelectedToday
                          ? "bg-[#22c55e] text-black font-black"
                          : isCurrentMonth ? "text-white" : "text-gray-600"
                      }`}>
                        {format(day, "d")}
                      </span>
                      
                      <button
                        onClick={() => openCreateModal(day)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e] hover:text-black transition-all"
                        title="Deploy session to this day"
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    {/* Events list */}
                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[80px] md:max-h-[110px] custom-scrollbar">
                      {dayEvents.map(event => {
                        const style = getTypeStyle(event.session_type);
                        return (
                          <button
                            key={event.id}
                            onClick={() => openDetailModal(event)}
                            className={`w-full text-left p-1.5 rounded-lg border text-[9px] font-bold uppercase truncate flex items-center gap-1.5 transition-all ${style.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                            <span className="truncate flex-1">{event.title}</span>
                            <span className="text-[7.5px] opacity-60 font-mono shrink-0 font-light">{event.event_time.slice(0, 5)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ====================================
             WEEK VIEW
             ==================================== */
          <div className="grid grid-cols-1 md:grid-cols-7 min-h-[600px] divide-y md:divide-y-0 md:divide-x divide-white/5">
            {weekDays.map((day, idx) => {
              const dayEvents = getDayEvents(day);
              const isSelectedToday = isToday(day);

              return (
                <div 
                  key={idx} 
                  className={`p-4 flex flex-col min-h-[180px] md:min-h-0 ${
                    isSelectedToday ? "bg-[#22c55e]/[0.02]" : "bg-black/10"
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex justify-between items-baseline mb-6 border-b border-white/5 pb-3">
                    <div>
                      <h4 className={`text-[10px] font-black uppercase tracking-[2px] ${isSelectedToday ? "text-[#22c55e]" : "text-gray-500"}`}>
                        {format(day, "EEEE")}
                      </h4>
                      <span className="text-xs font-mono font-black text-white/90">
                        {format(day, "MMM d")}
                      </span>
                    </div>

                    <button
                      onClick={() => openCreateModal(day)}
                      className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:border-[#22c55e]/30 text-gray-400 hover:text-white transition-all active-scale"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Day Events Stack */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] md:max-h-none pr-1">
                    {dayEvents.length === 0 ? (
                      <div className="py-8 text-center text-[9px] font-black text-gray-700 uppercase tracking-widest border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1">
                        Clear Grid
                      </div>
                    ) : (
                      dayEvents.map(event => {
                        const style = getTypeStyle(event.session_type);
                        const coachName = event.coach 
                          ? `${event.coach.first_name?.[0] || ""}${event.coach.last_name?.[0] || ""}`.toUpperCase() 
                          : "??";

                        return (
                          <div
                            key={event.id}
                            onClick={() => openDetailModal(event)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 relative group hover:scale-[1.02] ${style.bg}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-display font-black text-[10px] uppercase tracking-wider line-clamp-2 flex-1">
                                {event.title}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[8px] font-mono opacity-80 pt-2 border-t border-white/5">
                              <span className="flex items-center gap-1 font-bold">
                                <Clock size={8} /> {formatTime(event.event_time)}
                              </span>

                              <div className="flex items-center gap-1.5" title={`Coach: ${event.coach?.first_name || "Unknown"}`}>
                                <div className="w-4 h-4 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-[7px] font-black uppercase text-[#22c55e]">
                                  {coachName}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====================================
         CREATE / EDIT MODAL
         ==================================== */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl z-10"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#22c55e]/[0.03] to-transparent flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e]">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <h3 className="text-white font-display text-lg font-black uppercase tracking-wider">
                      {isEditing ? "Modify Deployment" : "Initialize Session"}
                    </h3>
                    <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest">
                      Shared Operational Grid
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-2 bg-white/5 border border-white/10 rounded-full text-gray-500 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Session Name</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="EX: CORE CAPACITY DRILLS"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs font-bold focus:border-[#22c55e] outline-none transition-all uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Session Type</label>
                    <div className="relative">
                      <select
                        value={formData.session_type}
                        onChange={e => setFormData(prev => ({ ...prev, session_type: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs font-bold focus:border-[#22c55e] outline-none appearance-none cursor-pointer"
                      >
                        {SESSION_TYPES.map(t => (
                          <option key={t} value={t} className="bg-[#0a0a0a] text-white">
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Organizer / Coach</label>
                    {isAdmin ? (
                      <div className="relative">
                        <select
                          required
                          value={formData.coach_id}
                          onChange={e => setFormData(prev => ({ ...prev, coach_id: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs font-bold focus:border-[#22c55e] outline-none appearance-none cursor-pointer"
                        >
                          {coaches.map(c => (
                            <option key={c.id} value={c.id} className="bg-[#0a0a0a] text-white">
                              {`${c.first_name || ""} ${c.last_name || ""}`.trim() || c.username}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.username || "Self"}
                        className="w-full bg-white/[0.01] border border-white/5 rounded-xl p-4 text-gray-500 text-xs font-bold outline-none cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Scheduled Date</label>
                    <input
                      type="date"
                      required
                      value={formData.event_date}
                      onChange={e => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs font-bold focus:border-[#22c55e] outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Start Time</label>
                    <input
                      type="time"
                      required
                      value={formData.event_time}
                      onChange={e => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs font-bold focus:border-[#22c55e] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Notes / Focus Areas</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="SPECIFY TARGET REPS, EQUIPMENTS, OR INTENSITY..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs font-medium focus:border-[#22c55e] outline-none min-h-[100px] resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 py-4 border border-white/10 rounded-2xl text-[10px] text-gray-400 font-black uppercase tracking-[2px] hover:border-white/20 transition-all active-scale"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-[#22c55e] text-black rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 active-scale"
                  >
                    {isSubmitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Commit Deployment"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================
         DETAILS MODAL
         ==================================== */}
      <AnimatePresence>
        {isDetailOpen && selectedEvent && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl z-10"
            >
              {/* Type Accent Line */}
              <div className={`h-1.5 w-full ${getTypeStyle(selectedEvent.session_type).dot.split(" ")[0]}`} />

              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider border ${
                      getTypeStyle(selectedEvent.session_type).bg
                    }`}>
                      {selectedEvent.session_type}
                    </span>
                    <h3 className="text-white font-display text-xl font-black uppercase tracking-wider mt-3 leading-snug">
                      {selectedEvent.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="p-2 bg-white/5 border border-white/10 rounded-full text-gray-500 hover:text-white transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Event Details Grid */}
                <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-3 text-xs text-gray-300">
                    <CalendarDays size={14} className="text-[#22c55e]" />
                    <span className="font-bold">
                      {format(parseISO(selectedEvent.event_date), "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-300">
                    <Clock size={14} className="text-[#22c55e]" />
                    <span className="font-bold">
                      {formatTime(selectedEvent.event_time)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-300">
                    <User size={14} className="text-[#22c55e]" />
                    <div className="flex items-center gap-2">
                      <Avatar 
                        src={selectedEvent.coach?.avatar_url}
                        name={`${selectedEvent.coach?.first_name || ""} ${selectedEvent.coach?.last_name || ""}`.trim() || selectedEvent.coach?.username}
                        size="sm"
                        className="w-5 h-5 border-none"
                      />
                      <span className="font-bold text-white/90">
                        {`${selectedEvent.coach?.first_name || ""} ${selectedEvent.coach?.last_name || ""}`.trim() || selectedEvent.coach?.username || "Unknown Coach"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedEvent.notes && (
                  <div className="space-y-2">
                    <h5 className="text-[9px] font-black text-gray-500 uppercase tracking-[2px] flex items-center gap-1.5">
                      <FileText size={10} /> Notes & Focus
                    </h5>
                    <p className="text-gray-300 text-xs leading-relaxed font-sans italic p-4 bg-white/[0.01] border border-white/5 rounded-xl">
                      "{selectedEvent.notes}"
                    </p>
                  </div>
                )}

                {/* Permissions check for actions */}
                {(() => {
                  const isOwner = selectedEvent.coach_id === user?.id;
                  const canEdit = isAdmin || isOwner;

                  return canEdit ? (
                    <div className="pt-4 flex gap-3 border-t border-white/5">
                      <button
                        onClick={handleDeleteEvent}
                        disabled={isDeleting}
                        className="flex-1 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-[2px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 active-scale"
                      >
                        {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Delete Session
                      </button>

                      <button
                        onClick={handleEditClick}
                        className="flex-1 py-3 bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] rounded-xl text-[9px] font-black uppercase tracking-[2px] hover:bg-[#22c55e] hover:text-black transition-all flex items-center justify-center gap-2 active-scale"
                      >
                        <Edit2 size={12} />
                        Edit Details
                      </button>
                    </div>
                  ) : (
                    <div className="pt-4 text-center border-t border-white/5">
                      <p className="text-gray-600 text-[8px] font-black uppercase tracking-[3px]">
                        Secure View Only // Created by {selectedEvent.coach?.first_name || "another coach"}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
