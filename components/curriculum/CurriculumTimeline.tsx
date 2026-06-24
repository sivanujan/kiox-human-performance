"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Loader2,
  AlertCircle,
  Phone,
  UserCheck,
  Edit2,
  Check,
  X,
  PlusCircle,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import CreateSessionModal from "@/components/modals/CreateSessionModal";
import SessionDetailsModal from "@/components/modals/SessionDetailsModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTimezone } from "@/hooks/useTimezone";

export default function CurriculumTimeline() {
  const { user, profile } = useAuth();
  const { formatTimeOnly } = useTimezone();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  
  // Contact Info Settings State
  const [contactInfo, setContactInfo] = useState({
    name: "Coach Alexander",
    role: "Program Director",
    phone: "+1 (555) 901-2026"
  });
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editContactData, setEditContactData] = useState({ ...contactInfo });
  const [savingContact, setSavingContact] = useState(false);

  const supabase = createClient();
  const isWritable = profile?.role === 'superadmin' || profile?.role === 'staff';

  useEffect(() => {
    fetchDayData();

    // Re-fetch when navigating back to this page
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDayData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [selectedDate]);

  const fetchDayData = async () => {
    setLoading(true);
    setError(null);
    setLoadStatus("Fetching sessions...");
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
        setError("Failed to load timeline items.");
      } else {
        setSessions(sessionRes.data || []);
      }

      setLoadStatus("Fetching profiles & settings...");
      // 2. Fetch profiles
      const [athletesRes, coachesRes, contactRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "athlete"),
        supabase.from("profiles").select("*").in("role", ["staff", "superadmin"]),
        supabase.from("system_settings").select("*").eq("key", "staff_contact_info").maybeSingle()
      ]);

      if (!athletesRes.error) setAthletes(athletesRes.data || []);
      if (!coachesRes.error) setCoaches(coachesRes.data || []);
      if (!contactRes.error && contactRes.data) {
        setContactInfo(contactRes.data.value);
        setEditContactData(contactRes.data.value);
      }
      setLoadStatus("Data processing complete.");
    } catch (err: any) {
      console.error("Timeline data synchronization error:", err);
      setError(err?.message || "Error syncing day timeline.");
      setLoadStatus("Error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const saveContactInfo = async () => {
    setSavingContact(true);
    try {
      const { error: saveError } = await supabase
        .from("system_settings")
        .upsert({
          key: "staff_contact_info",
          value: editContactData
        });

      if (saveError) {
        alert("Failed to save changes: " + saveError.message);
      } else {
        setContactInfo(editContactData);
        setIsEditingContact(false);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingContact(false);
    }
  };

  const nextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const prevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const setToday = () => setSelectedDate(new Date());

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'STRENGTH': 
        return {
          border: "border-amber-500/30",
          bg: "bg-amber-500/10",
          accent: "bg-amber-500",
          text: "text-amber-400"
        };
      case 'TACTICAL': 
        return {
          border: "border-blue-500/30",
          bg: "bg-blue-500/10",
          accent: "bg-blue-500",
          text: "text-blue-400"
        };
      case 'CONDITIONING': 
        return {
          border: "border-[#22c55e]/30",
          bg: "bg-[#22c55e]/10",
          accent: "bg-[#22c55e]",
          text: "text-[#22c55e]"
        };
      case 'RECOVERY': 
        return {
          border: "border-purple-500/30",
          bg: "bg-purple-500/10",
          accent: "bg-purple-500",
          text: "text-purple-400"
        };
      case 'MEAL': 
        return {
          border: "border-green-400/30",
          bg: "bg-green-400/10",
          accent: "bg-green-400",
          text: "text-green-400"
        };
      case 'CURFEW': 
        return {
          border: "border-zinc-500/30",
          bg: "bg-zinc-700/20",
          accent: "bg-zinc-600",
          text: "text-zinc-400"
        };
      case 'LOGISTICS': 
        return {
          border: "border-sky-400/30",
          bg: "bg-sky-400/10",
          accent: "bg-sky-400",
          text: "text-sky-400"
        };
      default: 
        return {
          border: "border-white/10",
          bg: "bg-white/5",
          accent: "bg-gray-500",
          text: "text-gray-400"
        };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20 items-start">
      {/* Main Timeline View */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#0c0c0c] border border-white/5 p-6 rounded-[28px] shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="text-[#22c55e]" size={14} />
              <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px]">Operational Calendar Timeline</span>
            </div>
            <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">Daily Program</h1>
          </div>

          <div className="flex items-center gap-3 bg-[#111] border border-white/5 p-1.5 rounded-2xl w-full sm:w-auto justify-between">
            <button onClick={prevDay} className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-white/40 hover:text-white">
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex flex-col items-center min-w-[140px] px-4">
              <span className="text-white font-bold text-xs uppercase tracking-widest">{format(selectedDate, "eeee")}</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{format(selectedDate, "MMM dd, yyyy")}</span>
            </div>

            <button onClick={nextDay} className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-white/40 hover:text-white">
              <ChevronRight size={18} />
            </button>

            <button onClick={setToday} className="px-3 py-1.5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-gray-400 hover:text-white hover:border-white/20 transition-all">
              Today
            </button>
          </div>

          {isWritable && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto px-6 py-4 bg-[#22c55e] text-black text-[10px] font-black uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-all shadow-md"
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
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[36px] p-8 min-h-[400px] relative">

          {loading ? (
            // Skeleton rows — show timeline structure while loading
            <div className="relative border-l-2 border-white/5 ml-4 sm:ml-24 pl-8 py-4 space-y-8">
              <div className="absolute top-0 right-0 p-2 text-[10px] text-green-500 font-mono bg-black/40 rounded border border-green-500/20">
                STATUS: {loadStatus}
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-white/[0.06] animate-pulse" />
                  {/* Time label */}
                  <div className="absolute right-full mr-8 top-1 hidden sm:flex flex-col items-end gap-1">
                    <div className="h-4 w-14 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-2 w-10 bg-white/[0.04] rounded animate-pulse" />
                  </div>
                  {/* Card */}
                  <div className="w-full bg-[#111] border border-white/5 p-6 rounded-2xl space-y-3">
                    <div className="h-4 w-1/3 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-white/[0.04] rounded animate-pulse" />
                    <div className="h-2 w-1/4 bg-white/[0.03] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Info size={40} className="text-gray-600 mb-4" />
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-[4px]">Matrix Core Idle</h4>
              <p className="text-[9px] text-gray-600 uppercase mt-2 max-w-[280px]">No sessions or curriculum items scheduled for this date.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-white/5 ml-4 sm:ml-24 pl-8 py-4 space-y-12">
              {sessions.map((session) => {
                const styles = getCategoryStyles(session.session_type);
                const assignedCoach = coaches.find(c => c.id === session.coach_id);
                
                return (
                  <div key={session.id} className="relative group">
                    
                    {/* Time Label (Left) */}
                    <div className="absolute right-full mr-8 top-1 hidden sm:flex flex-col items-end min-w-[70px]">
                      <span className="text-sm font-black text-white font-mono">
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
                      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{session.duration_minutes} MIN</span>
                    </div>

                    {/* Timeline Node Dot */}
                    <div className={`absolute -left-[41px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-[#0a0a0a] ${styles.accent} shadow-lg transition-transform group-hover:scale-125 z-10`} />

                    {/* Timeline Main Card */}
                    <div 
                      onClick={() => setSelectedSession(session)}
                      className={`w-full bg-[#111] border ${styles.border} p-6 rounded-2xl hover:border-white/20 transition-all cursor-pointer relative overflow-hidden`}
                    >
                      {/* Left Colored Accent Strip */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.accent}`} />
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          {/* Mobile Time Label */}
                          <div className="sm:hidden flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase">
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
                            <h3 className="text-md font-bold text-white uppercase tracking-wider">{session.title}</h3>
                            <span className={`px-2 py-0.5 border text-[7px] font-black uppercase tracking-widest rounded ${styles.text} ${styles.bg}`}>
                              {session.session_type === 'LOGISTICS' ? 'LOGISTICS/GENERAL' : session.session_type}
                            </span>
                          </div>

                          {session.notes && (
                            <p className="text-[11px] text-white/50 leading-relaxed font-sans line-clamp-2 max-w-2xl">{session.notes}</p>
                          )}

                          {/* Location & Coach Details */}
                          <div className="flex flex-wrap gap-4 text-[9px] text-gray-500 font-black uppercase tracking-wider pt-2">
                            {session.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={10} className="text-[#22c55e]" /> {session.location}
                              </span>
                            )}
                            {assignedCoach && (
                              <span className="flex items-center gap-1">
                                <UserCheck size={10} className="text-[#22c55e]" /> Coach: {assignedCoach.first_name} {assignedCoach.last_name || ''}
                              </span>
                            )}
                            {!session.is_program && session.assigned_athletes && (
                              <span className="flex items-center gap-1">
                                <Users size={10} /> {session.assigned_athletes.length} Assigned
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Booking Count Indicator */}
                        {session.max_capacity && (
                          <div className="px-3 py-1.5 bg-black/40 border border-white/5 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
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

      {/* Staff Contact Info Sidebar Block */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none text-white">
            <Phone size={80} />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h4 className="text-[10px] font-black text-[#22c55e] uppercase tracking-[3px]">Command Contact</h4>
              {isWritable && !isEditingContact && (
                <button 
                  onClick={() => setIsEditingContact(true)}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>

            {isEditingContact ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Director Name</label>
                  <input 
                    value={editContactData.name}
                    onChange={e => setEditContactData({...editContactData, name: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#22c55e] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Role / Title</label>
                  <input 
                    value={editContactData.role}
                    onChange={e => setEditContactData({...editContactData, role: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#22c55e] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Phone Number</label>
                  <input 
                    value={editContactData.phone}
                    onChange={e => setEditContactData({...editContactData, phone: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#22c55e] outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    disabled={savingContact}
                    onClick={() => {
                      setIsEditingContact(false);
                      setEditContactData({ ...contactInfo });
                    }}
                    className="flex-1 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-[9px] font-black uppercase text-gray-500"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={savingContact}
                    onClick={saveContactInfo}
                    className="flex-1 py-2 bg-[#22c55e] text-black rounded-lg text-[9px] font-black uppercase hover:bg-white transition-all flex items-center justify-center gap-1"
                  >
                    {savingContact ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-white font-bold text-sm uppercase tracking-wide">{contactInfo.name}</p>
                  <p className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mt-0.5">{contactInfo.role}</p>
                </div>

                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e]">
                    <Phone size={14} />
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-wider leading-none">Operational Phone</p>
                    <a 
                      href={`tel:${contactInfo.phone}`}
                      className="text-white font-mono text-xs font-bold hover:text-[#22c55e] transition-colors mt-1 block"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateSessionModal 
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); fetchDayData(); }}
        athletes={athletes}
        coaches={coaches}
        defaultIsCurriculum={true}
      />

      <SessionDetailsModal 
        isOpen={!!selectedSession}
        onClose={() => { setSelectedSession(null); fetchDayData(); }}
        session={selectedSession}
      />
    </div>
  );
}
