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
  is_training_session?: boolean;
  is_curriculum?: boolean;
  is_emergency?: boolean;
  is_external?: boolean;
  external_player_name?: string;
  payment_status?: string;
  session_category?: string;
}

export default function SharedCalendarPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  // Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Viewport resize effect to default to week view on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("week");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobile swipe gestures
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };
  
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
      const [eventsRes, sessionsRes] = await Promise.all([
        supabase
          .from("coach_calendar_events")
          .select(`
            *,
            coach:profiles!coach_id(first_name, last_name, avatar_url, username)
          `)
          .order("event_date", { ascending: true })
          .order("event_time", { ascending: true }),
        supabase
          .from("training_sessions")
          .select(`
            *,
            coach:profiles!coach_id(first_name, last_name, avatar_url, username)
          `)
          .order("scheduled_date", { ascending: true })
          .order("start_time", { ascending: true })
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (sessionsRes.error) throw sessionsRes.error;

      // Do not filter out curriculum sessions; show ALL to everyone in this shared calendar view
      let sessionsData = sessionsRes.data || [];

      const mappedSessions = sessionsData.map((s: any) => ({
        id: s.id,
        title: s.title,
        event_date: s.scheduled_date,
        event_time: s.start_time,
        session_type: s.session_type,
        notes: s.notes || "",
        coach_id: s.coach_id || "",
        created_at: s.created_at,
        coach: s.coach,
        is_training_session: true,
        is_curriculum: s.is_curriculum,
        is_emergency: s.is_emergency,
        is_external: s.is_external,
        external_player_name: s.external_player_name,
        payment_status: s.payment_status,
        session_category: s.session_category
      }));

      const combined = [...(eventsRes.data || []), ...mappedSessions].sort((a, b) => {
        const dateCompare = a.event_date.localeCompare(b.event_date);
        if (dateCompare !== 0) return dateCompare;
        return a.event_time.localeCompare(b.event_time);
      });

      setEvents(combined);
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

  const getTypeStyle = (event: any) => {
    if (!event) return { bg: "", dot: "", border: "", text: "", bgSolid: "", label: "" };
    
    // Determine category based on session_category or boolean fallbacks
    const category = event.is_training_session 
      ? (event.session_category || (event.is_emergency ? 'EMERGENCY' : (event.is_curriculum ? 'CURRICULUM' : 'SCHEDULE')))
      : 'SCHEDULE';

    if (category === 'EMERGENCY') {
      return {
        bg: "bg-red-500/10 border-red-500/20 text-red-500 hover:border-red-500/40",
        dot: "bg-red-500 shadow-[0_0_8px_#ef4444]",
        border: "border-l-red-500",
        text: "text-red-500 font-bold",
        bgSolid: "bg-red-500 hover:bg-white text-black",
        label: "EMERGENCY"
      };
    }
    
    if (category === 'CURRICULUM') {
      return {
        bg: "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-500/40",
        dot: "bg-blue-500 shadow-[0_0_8px_#3b82f6]",
        border: "border-l-blue-500",
        text: "text-blue-400 font-bold",
        bgSolid: "bg-blue-500 hover:bg-white text-black",
        label: "CURRICULUM"
      };
    }

    // Default SCHEDULE category is green (#22c55e or #00ff88 depending on theme context)
    return {
      bg: "bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e] hover:border-[#22c55e]/40",
      dot: "bg-[#22c55e] shadow-[0_0_8px_#22c55e]",
      border: "border-l-[#22c55e]",
      text: "text-[#22c55e] font-bold",
      bgSolid: "bg-[#22c55e] hover:bg-white text-black",
      label: event.is_external ? "EXTERNAL SCHEDULE" : "SCHEDULE"
    };
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

        // Notify coach of update if they are not the updater
        if (payload.coach_id && payload.coach_id !== user.id) {
          await supabase.from("system_notifications").insert({
            recipient_id: payload.coach_id,
            sender_id: user.id,
            title: "SCHEDULE ASSIGNMENT UPDATED",
            message: `You are assigned to "${payload.title}" on ${payload.event_date} at ${payload.event_time.slice(0, 5)}.`,
            type: "UPDATE"
          });
        }

        setSuccessMessage("Operational session updated successfully.");
      } else {
        const { error: insertErr } = await supabase
          .from("coach_calendar_events")
          .insert([payload]);

        if (insertErr) throw insertErr;

        // Notify coach of assignment if they are not the creator
        if (payload.coach_id && payload.coach_id !== user.id) {
          await supabase.from("system_notifications").insert({
            recipient_id: payload.coach_id,
            sender_id: user.id,
            title: "NEW SCHEDULE ASSIGNMENT",
            message: `You are assigned to "${payload.title}" on ${payload.event_date} at ${payload.event_time.slice(0, 5)}.`,
            type: "UPDATE"
          });
        }

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
        <Loader2 className="text-[#00ff88] animate-spin" size={40} />
        <span className="text-[10px] font-black text-[#00ff88] uppercase tracking-[3px] animate-pulse">Syncing Shared Calendar Matrix...</span>
      </div>
    );
  }

  const isAdmin = profile?.role === "superadmin";

  // Mini Week At A Glance calculation
  const todayDate = new Date();
  const currentWeekStart = startOfWeek(todayDate, { weekStartsOn: 1 });
  const currentWeekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(todayDate, { weekStartsOn: 1 })
  });
  
  const todayEventsCount = getDayEvents(todayDate).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-white font-display text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <CalendarDays className="text-[#00ff88]" size={36} /> Operational Calendar
          </h1>
          <p className="text-gray-400 font-label mt-2 text-xs md:text-sm tracking-[0.2em] uppercase">
            Shared Performance Grid // Realtime Sync Active
          </p>
        </div>

        <button
          onClick={() => openCreateModal()}
          className="bg-[#00ff88] text-black font-button text-xs font-black px-6 py-4 rounded-2xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,136,0.3)] flex items-center gap-2 active-scale"
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
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-[#00ff88] text-xs font-bold uppercase tracking-widest"
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
        <div className="flex items-center bg-black/40 border border-white/5 p-1.5 rounded-2xl">
          <button 
            onClick={handlePrev}
            className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all active-scale"
          >
            <ChevronLeft size={16} />
          </button>
          
          <h2 className="text-white font-display text-sm md:text-base font-black uppercase tracking-wider px-4 min-w-[160px] text-center">
            {viewMode === "month" 
              ? format(currentDate, "MMMM yyyy")
              : `Week of ${format(weekStart, "MMM d, yyyy")}`
            }
          </h2>

          <button 
            onClick={handleNext}
            className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all active-scale"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("month")}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                viewMode === "month"
                  ? "bg-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.2)]"
                  : "bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-[#00ff88]/30"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                viewMode === "week"
                  ? "bg-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.2)]"
                  : "bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-[#00ff88]/30"
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Week at a Glance Strip */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="text-[#00ff88] animate-pulse" size={16} />
            <h3 className="text-white font-display text-xs font-black uppercase tracking-widest">
              Tactical Week At A Glance
            </h3>
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-black/40 border border-[#00ff88]/20 px-3 py-1.5 rounded-xl">
            Today's Deployments: <span className="text-[#00ff88] font-mono ml-1">{todayEventsCount}</span>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {currentWeekDays.map((day, idx) => {
            const dayEvents = getDayEvents(day);
            const isDayToday = isToday(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            const cardBg = isDayToday
              ? "bg-[#00ff88]/10 border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.1)]"
              : isWeekend
                ? "bg-[#0d0d0d] border-[#1a1a1a] hover:border-[#00ff88]/20"
                : "bg-black/20 border-[#1a1a1a] hover:border-[#00ff88]/20";

            return (
              <div 
                key={idx} 
                className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1 ${cardBg}`}
              >
                <span className={`text-[8px] font-black uppercase tracking-wider ${isDayToday ? "text-[#00ff88]" : "text-gray-500"}`}>
                  {format(day, "eee")}
                </span>
                <span className="text-xs font-mono font-black text-white">
                  {format(day, "d")}
                </span>
                <span className={`text-[9px] font-mono font-black mt-1.5 px-2 py-0.5 rounded-md ${
                  dayEvents.length > 0
                    ? isDayToday ? "bg-[#00ff88] text-black" : "bg-[#00ff88]/20 text-[#00ff88]"
                    : "bg-white/5 text-gray-600"
                }`}>
                  {dayEvents.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid container */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-3xl overflow-hidden shadow-2xl">
        {viewMode === "month" ? (
          /* ====================================
             MONTH VIEW
             ==================================== */
          <div className="flex flex-col">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 border-b border-[#00ff88] bg-[#0a0a0a]">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, index) => {
                const isWeekend = d === "Sat" || d === "Sun";
                return (
                  <div 
                    key={d} 
                    className={`p-4 text-center font-label text-[9px] font-black uppercase tracking-[2px] ${
                      isWeekend ? "bg-[#0d0d0d] text-[#555]" : "bg-[#111] text-[#00ff88]"
                    }`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>

            {/* Monthly Grid */}
            <div className="grid grid-cols-7 grid-rows-6 md:min-h-[580px] border-b border-[#1a1a1a]">
              {monthDays.map((day, idx) => {
                const dayEvents = getDayEvents(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelectedToday = isToday(day);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                // Establish clean cell backgrounds and neon accents
                const cellBgClass = isCurrentMonth 
                  ? (isWeekend ? "bg-[#0d0d0d] hover:bg-white/[0.02] cursor-pointer" : "bg-[#111] hover:bg-white/[0.02] cursor-pointer") 
                  : "bg-[#0a0a0a] cursor-default";

                const todayBorderGlow = (isSelectedToday && isCurrentMonth)
                  ? "border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.15)] z-10"
                  : "border-[#1a1a1a]";

                return (
                  <div
                    key={idx}
                    className={`min-h-[90px] md:min-h-[110px] border-r border-b p-2 flex flex-col justify-between transition-all group relative ${cellBgClass} ${todayBorderGlow}`}
                  >
                    {/* Day number & add icon */}
                    <div className="flex justify-between items-center mb-1.5 z-10">
                      <span className={`text-[10px] font-mono font-black rounded-md w-6 h-6 flex items-center justify-center ${
                        isSelectedToday && isCurrentMonth
                          ? "bg-[#00ff88] text-black font-black"
                          : isCurrentMonth ? "text-white" : "text-[#2a2a2a]"
                      }`}>
                        {format(day, "d")}
                      </span>
                      
                      {dayEvents.length > 0 && isCurrentMonth && (
                        <button
                          onClick={() => openCreateModal(day)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88] hover:text-black transition-all"
                          title="Deploy session to this day"
                        >
                          <Plus size={10} />
                        </button>
                      )}
                    </div>

                    {/* Empty cell invite button */}
                    {dayEvents.length === 0 && isCurrentMonth && (
                      <button
                        onClick={() => openCreateModal(day)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Deploy session to this day"
                      >
                        <Plus size={18} className="text-[#00ff88]" />
                      </button>
                    )}

                    {/* Events list */}
                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[60px] md:max-h-[80px] custom-scrollbar">
                      {dayEvents.map(event => {
                        const style = getTypeStyle(event);
                        const coachName = event.coach 
                          ? `${event.coach.first_name || event.coach.username}`
                          : "Coach";
                        return (
                          <button
                            key={event.id}
                            onClick={() => openDetailModal(event)}
                            className={`w-full text-left px-2 py-1.5 ${style.bgSolid} text-[9px] font-black uppercase rounded border-l-[3px] ${style.border} flex flex-col gap-0.5 transition-all shadow-sm`}
                          >
                            <span className="font-bold truncate w-full">{event.is_emergency ? "🚨 " : ""}{event.title} — {formatTime(event.event_time)}</span>
                            <span className="text-[8px] opacity-75 font-normal truncate w-full">Coach: {coachName}</span>
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
             WEEK VIEW (WITH MOBILE SWIPE SUPPORT)
             ==================================== */
          <div 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="grid grid-cols-1 md:grid-cols-7 min-h-[500px] divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a]"
          >
            {weekDays.map((day, idx) => {
              const dayEvents = getDayEvents(day);
              const isSelectedToday = isToday(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              const cellBgClass = isSelectedToday 
                ? "bg-[#00ff88]/[0.02] shadow-[inset_0_0_15px_rgba(0,255,136,0.05)]" 
                : (isWeekend ? "bg-[#0d0d0d]" : "bg-[#111]");

              const todayBorderGlow = isSelectedToday 
                ? "border border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.15)] z-10 rounded-2xl" 
                : "border-transparent";

              return (
                <div 
                  key={idx} 
                  className={`p-4 flex flex-col min-h-[180px] md:min-h-0 transition-all ${cellBgClass} ${todayBorderGlow}`}
                >
                  {/* Day Header */}
                  <div className="flex justify-between items-baseline mb-6 border-b border-[#1a1a1a] pb-3">
                    <div>
                      <h4 className={`text-[10px] font-black uppercase tracking-[2px] ${isSelectedToday ? "text-[#00ff88]" : "text-gray-500"}`}>
                        {format(day, "EEEE")}
                      </h4>
                      <span className="text-xs font-mono font-black text-white/90">
                        {format(day, "MMM d")}
                      </span>
                    </div>

                    <button
                      onClick={() => openCreateModal(day)}
                      className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:border-[#00ff88]/30 text-gray-400 hover:text-white transition-all active-scale"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Day Events Stack */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] md:max-h-none pr-1">
                    {dayEvents.length === 0 ? (
                      <div className="py-8 text-center text-[9px] font-black text-gray-500 uppercase tracking-widest border border-dashed border-[#1a1a1a] rounded-2xl flex flex-col items-center justify-center gap-1">
                        Clear Grid
                      </div>
                    ) : (
                      dayEvents.map(event => {
                        const style = getTypeStyle(event);
                        const coachName = event.coach 
                          ? `${event.coach.first_name || event.coach.username}`
                          : "Coach";

                        return (
                          <div
                            key={event.id}
                            onClick={() => openDetailModal(event)}
                            className={`p-3 rounded-xl ${style.bgSolid} cursor-pointer transition-all flex flex-col gap-1 relative group hover:scale-[1.02] border-l-[3px] ${style.border}`}
                          >
                            <div className="flex justify-between items-baseline gap-2">
                              <span className="font-display font-black text-[10px] uppercase tracking-wider line-clamp-2 flex-1">
                                {event.is_emergency ? "🚨 " : ""}{event.title}
                              </span>
                              <span className="text-[9px] font-mono font-black shrink-0">
                                {formatTime(event.event_time)}
                              </span>
                            </div>

                            <div className="text-[8px] opacity-75 font-normal pt-1">
                              <span>Coach: {coachName}</span>
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
              className="relative w-full max-w-lg mx-auto bg-[#0a0a0a] border border-white/10 rounded-[8px] overflow-hidden shadow-2xl z-10"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#00ff88]/[0.03] to-transparent flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-[#00ff88]">
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
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-[#00ff88] rounded-[8px] py-3 px-4 text-white text-xs font-bold outline-none transition-all uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Session Type</label>
                    <div className="relative">
                      <select
                        value={formData.session_type}
                        onChange={e => setFormData(prev => ({ ...prev, session_type: e.target.value }))}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-[#00ff88] rounded-[8px] py-3 pr-10 pl-4 text-white text-xs font-bold outline-none appearance-none cursor-pointer no-custom-bg"
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                      >
                        {SESSION_TYPES.map(t => (
                          <option key={t} value={t} className="bg-[#0a0a0a] text-white">
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00ff88] pointer-events-none" />
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
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-[#00ff88] rounded-[8px] py-3 pr-10 pl-4 text-white text-xs font-bold outline-none appearance-none cursor-pointer no-custom-bg"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                        >
                          {coaches.map(c => (
                            <option key={c.id} value={c.id} className="bg-[#0a0a0a] text-white">
                              {`${c.first_name || ""} ${c.last_name || ""}`.trim() || c.username}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00ff88] pointer-events-none" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.username || "Self"}
                        className="w-full bg-[#1a1a1a]/50 border border-[#2a2a2a] rounded-[8px] py-3 px-4 text-gray-500 text-xs font-bold outline-none cursor-not-allowed"
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
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-[#00ff88] rounded-[8px] py-3 px-4 text-white text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Start Time</label>
                    <input
                      type="time"
                      required
                      value={formData.event_time}
                      onChange={e => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-[#00ff88] rounded-[8px] py-3 px-4 text-white text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Notes / Focus Areas</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="SPECIFY TARGET REPS, EQUIPMENTS, OR INTENSITY..."
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-[#00ff88] rounded-[8px] py-3 px-4 text-white text-xs font-medium outline-none min-h-[100px] resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 py-3.5 bg-[#111] border border-[#333] rounded-[8px] text-[10px] text-white font-black uppercase tracking-[2px] hover:bg-white/5 transition-all active-scale text-center"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 bg-[#00ff88] text-black rounded-[8px] text-[10px] font-black uppercase tracking-[2px] hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 active-scale"
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
              <div className={`h-1.5 w-full ${getTypeStyle(selectedEvent).dot.split(" ")[0]}`} />

              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider border ${
                      getTypeStyle(selectedEvent).bg
                    }`}>
                      {getTypeStyle(selectedEvent).label}
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
                    <CalendarDays size={14} className="text-[#00ff88]" />
                    <span className="font-bold">
                      {format(parseISO(selectedEvent.event_date), "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-300">
                    <Clock size={14} className="text-[#00ff88]" />
                    <span className="font-bold">
                      {formatTime(selectedEvent.event_time)}
                    </span>
                  </div>

                  {selectedEvent.is_external && selectedEvent.external_player_name && (
                    <div className="flex items-center gap-3 text-xs text-[#00ff88]">
                      <User size={14} className="text-[#00ff88]" />
                      <span className="font-bold">
                        Player: <span className="text-white font-mono">{selectedEvent.external_player_name}</span>
                        {selectedEvent.payment_status && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] font-black ${
                            selectedEvent.payment_status === 'CONFIRMED' ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'bg-amber-500/15 text-amber-500'
                          }`}>
                            {selectedEvent.payment_status}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-300">
                    <User size={14} className="text-[#00ff88]" />
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
                  const canEdit = (isAdmin || isOwner) && !selectedEvent.is_training_session;

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
                        className="flex-1 py-3 bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] rounded-xl text-[9px] font-black uppercase tracking-[2px] hover:bg-[#00ff88] hover:text-black transition-all flex items-center justify-center gap-2 active-scale"
                      >
                        <Edit2 size={12} />
                        Edit Details
                      </button>
                    </div>
                  ) : selectedEvent.is_training_session ? (
                    <div className="pt-4 text-center border-t border-white/5">
                      <p className="text-amber-500 text-[9px] font-black uppercase tracking-[3px]">
                        Curriculum Training Session // Manage via Global Schedules or Curriculum
                      </p>
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
