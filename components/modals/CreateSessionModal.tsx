"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MapPin, Activity, Save, Loader2, AlertCircle, Globe, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useSessions } from "@/hooks/useSessions";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTimezone } from "@/hooks/useTimezone";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (dates: string[]) => void;
  athletes?: any[];
  coaches?: any[];
  defaultDate?: string;
  defaultIsCurriculum?: boolean;
}

interface ExternalClientEntry {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  payment_status: 'PENDING' | 'CONFIRMED';
  payment_notes: string;
  training_start_date: string;
  training_end_date: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  start_time: string;
  duration_minutes: number;
  location: string;
  coach_id: string;
  notes: string;
  is_curriculum: boolean;
  is_emergency: boolean;
  is_external: boolean;
  external_clients: ExternalClientEntry[];
  session_category: 'CURRICULUM' | 'SCHEDULE' | 'EMERGENCY';
  session_type: 'STRENGTH' | 'TACTICAL' | 'CONDITIONING' | 'RECOVERY' | 'CUSTOM' | 'MEAL' | 'CURFEW' | 'LOGISTICS';
  assigned_athletes: string[];
}

export default function CreateSessionModal({ isOpen, onClose, onSuccess, athletes, coaches, defaultDate, defaultIsCurriculum }: CreateSessionModalProps) {
  const { user, profile } = useAuth();
  const { userTimezone } = useTimezone();
  const { createSession, loading: sessionLoading } = useSessions();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const [localCoaches, setLocalCoaches] = useState<any[]>(coaches || []);
  const [localAthletes, setLocalAthletes] = useState<any[]>(athletes || []);
  
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    { 
      id: "1", 
      title: "", 
      start_time: "09:00", 
      duration_minutes: 60, 
      location: "HQ FIELD", 
      coach_id: "", 
      notes: "",
      is_curriculum: defaultIsCurriculum || false,
      is_emergency: false,
      is_external: false,
      external_clients: [
        {
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          payment_status: "PENDING",
          payment_notes: "",
          training_start_date: defaultDate || format(new Date(), "yyyy-MM-dd"),
          training_end_date: defaultDate || format(new Date(), "yyyy-MM-dd")
        }
      ],
      session_category: defaultIsCurriculum ? 'CURRICULUM' : (defaultIsCurriculum === false ? 'SCHEDULE' : 'SCHEDULE'),
      session_type: 'TACTICAL',
      assigned_athletes: []
    }
  ]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const initialDate = defaultDate || format(new Date(), "yyyy-MM-dd");
      setSelectedDates(defaultDate ? [defaultDate] : [initialDate]);
      if (defaultDate) {
        setCurrentMonth(new Date(defaultDate));
      }
      setScheduleItems([
        { 
          id: "1", 
          title: "", 
          start_time: "09:00", 
          duration_minutes: 60, 
          location: "HQ FIELD", 
          coach_id: "", 
          notes: "",
          is_curriculum: defaultIsCurriculum || false,
          is_emergency: false,
          is_external: false,
          external_clients: [
            {
              first_name: "",
              last_name: "",
              email: "",
              phone: "",
              payment_status: "PENDING",
              payment_notes: "",
              training_start_date: initialDate,
              training_end_date: initialDate
            }
          ],
          session_category: defaultIsCurriculum ? 'CURRICULUM' : 'SCHEDULE',
          session_type: 'TACTICAL',
          assigned_athletes: []
        }
      ]);
    }
  }, [isOpen, defaultDate, defaultIsCurriculum]);

  useEffect(() => {
    if (coaches) {
      setLocalCoaches(coaches);
    } else {
      const fetchCoaches = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .in("role", ["staff", "superadmin"]);
        if (data) {
          setLocalCoaches(data);
        }
      };
      fetchCoaches();
    }
  }, [coaches]);

  useEffect(() => {
    if (athletes) {
      setLocalAthletes(athletes);
    } else {
      const fetchAthletes = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "athlete");
        if (data) {
          setLocalAthletes(data);
        }
      };
      fetchAthletes();
    }
  }, [athletes]);

  if (!mounted || !isOpen) return null;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedDates.length === 0) {
      setError("At least one date must be selected.");
      return;
    }

    // Validation check for external player name
    for (const item of scheduleItems) {
      if (item.is_external) {
        if (item.external_clients.length === 0) {
          setError("Please add at least one external client.");
          return;
        }
        for (const client of item.external_clients) {
          if (!client.first_name.trim() || !client.last_name.trim() || !client.email.trim()) {
            setError("First Name, Last Name, and Email are required for all external clients.");
            return;
          }
        }
      }
    }

    setLoading(true);
    try {
      const insertPromises = selectedDates.flatMap((dateStr) => {
        return scheduleItems.map(async (item) => {
          if (item.is_external) {
            const res = await fetch('/api/admin/sessions/external', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_data: {
                  title: item.title,
                  start_time: item.start_time,
                  duration_minutes: item.duration_minutes,
                  location: item.location,
                  notes: item.notes,
                  coach_id: item.coach_id || null
                },
                dates: [dateStr],
                external_clients: item.external_clients
              })
            });
            const data = await res.json();
            if (!res.ok) {
              return { success: false, error: data.error || "Failed to create external sessions" };
            }
            return { success: true, data };
          } else {
            const sessionRes = await createSession({
              title: item.title,
              session_type: item.session_type,
              scheduled_date: dateStr,
              start_time: `${item.start_time}:00`,
              duration_minutes: item.duration_minutes,
              location: item.location || "HQ FIELD",
              target_load_au: undefined,
              assigned_athletes: item.assigned_athletes || [],
              notes: item.notes,
              assigned_by: user?.id,
              coach_timezone: userTimezone,
              coach_id: item.coach_id || undefined,
              is_curriculum: item.session_category === 'CURRICULUM',
              is_emergency: item.session_category === 'EMERGENCY',
              is_external: false,
              payment_status: 'PENDING',
              confirmed_by_admin: false
            });

            if (sessionRes.success && sessionRes.data) {
              // Notification dispatch flow
              if (item.session_category === 'EMERGENCY') {
                // Get all coaches (staff)
                const { data: staffProfiles } = await supabase
                  .from("profiles")
                  .select("id")
                  .eq("role", "staff");
   
                if (staffProfiles && staffProfiles.length > 0) {
                  const notifications = staffProfiles.map((staff: any) => ({
                    staff_id: staff.id,
                    type: "EMERGENCY_SESSION",
                    message: `Emergency session scheduled on ${dateStr} at ${item.start_time}`,
                    related_id: sessionRes.data.id,
                    is_read: false
                  }));
                  await supabase.from("staff_notifications").insert(notifications);
                }
              } else if (item.coach_id) {
                const label = item.session_category === 'CURRICULUM' ? "Curriculum Session" : "Schedule Session";
                await supabase.from("system_notifications").insert({
                  recipient_id: item.coach_id,
                  sender_id: user?.id,
                  title: item.session_category === 'CURRICULUM' ? "NEW CURRICULUM ASSIGNMENT" : "NEW SCHEDULE ASSIGNMENT",
                  message: `You have been assigned to ${label} "${item.title}" on ${dateStr} at ${item.start_time}.`,
                  type: "UPDATE"
                });

              }
            }

            return sessionRes;
          }
        });
      });

      const results = await Promise.all(insertPromises);
      const failed = results.find(r => !r.success);
      if (!failed) {
        const externalResults = results.filter(r => r.data && r.data.clients);
        if (externalResults.length > 0) {
          const clients = externalResults.flatMap(r => r.data.clients);
          let msg = "External Sessions Created Successfully!\n\nPlease provide these credentials to the new clients (in case the email delivery fails):\n\n";
          let hasNew = false;
          clients.forEach(c => {
            if(c.isNew) {
              hasNew = true;
              msg += `${c.first_name} ${c.last_name}:\nEmail: ${c.email}\nUsername: ${c.username}\nTemp Password: ${c.tempPassword}\n\n`;
            }
          });
          if (hasNew) {
            alert(msg);
          }
        }

        // Send batch email notifications per date for curriculum sessions (background fire-and-forget)
        for (const dateStr of selectedDates) {
          const curriculumSessionsForDate = scheduleItems.filter(i => i.session_category === 'CURRICULUM');
          if (curriculumSessionsForDate.length > 0) {
            const payloadSessions = curriculumSessionsForDate.map(i => ({
              title: i.title,
              time: i.start_time,
              coachId: i.coach_id,
              athleteIds: i.assigned_athletes || []
            }));

            fetch('/api/admin/sessions/notify-assignment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dateStr: dateStr,
                notifyStaff: true,
                sessions: payloadSessions
              })
            }).catch(e => console.error("Failed to trigger bulk assignment emails:", e));
          }
        }

        if (onSuccess) {
          onSuccess(selectedDates);
        } else {
          onClose();
        }
      } else {
        setError(failed.error || "Failed to initialize schedule.");
      }
    } catch (err: any) {
      console.error("Schedule initialization error:", err);
      setError(err.message || "A mission-critical error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const defaultDateStr = selectedDates[0] || format(new Date(), "yyyy-MM-dd");
    setScheduleItems(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        title: "",
        start_time: "09:00",
        duration_minutes: 60,
        location: "HQ FIELD",
        coach_id: "",
        notes: "",
        is_curriculum: defaultIsCurriculum || false,
        is_emergency: false,
        is_external: false,
        external_clients: [
          {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            payment_status: "PENDING",
            payment_notes: "",
            training_start_date: defaultDateStr,
            training_end_date: defaultDateStr
          }
        ],
        session_category: defaultIsCurriculum ? 'CURRICULUM' : 'SCHEDULE',
        session_type: 'TACTICAL',
        assigned_athletes: []
      }
    ]);
  };


  const removeItem = (id: string) => {
    setScheduleItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<ScheduleItem>) => {
    setScheduleItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const isSuperAdmin = profile?.role === 'superadmin';

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto py-20 animate-fade-in">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />

        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#080808] border border-white/10 rounded-[48px] overflow-hidden shadow-2xl transition-all duration-300"
        >
          {/* Header */}
          <div className="p-10 border-b border-white/5 bg-gradient-to-r from-sky-500/[0.05] to-transparent flex justify-between items-center">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[24px] bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                   <Calendar size={32} />
                </div>
                <div>
                   <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Operational Scheduler</div>
                   <h2 className="font-display text-4xl text-white tracking-wider uppercase">
                      Initialize Schedule
                   </h2>
                </div>
             </div>
             <button onClick={onClose} className="p-5 rounded-full bg-white/5 text-gray-400 hover:text-white transition-all">
                <X size={28} />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
             {/* Target Dates Calendar Grid */}
             <div className="space-y-3">
                <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                   <Calendar size={12} /> Target Dates ({selectedDates.length} Selected)
                </label>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                   <div className="max-w-[300px] mx-auto space-y-4">
                      <div className="flex justify-between items-center">
                         <button 
                            type="button"
                            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                          >
                             <ChevronLeft size={16} />
                          </button>
                          <span className="text-xs font-bold uppercase tracking-wider text-white">
                             {format(currentMonth, "MMMM yyyy")}
                          </span>
                          <button 
                            type="button"
                            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                          >
                             <ChevronRight size={16} />
                          </button>
                      </div>
                      <div className="grid grid-cols-7 gap-2 text-center">
                         {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                            <div key={idx} className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">{day}</div>
                         ))}
                         {getDaysInMonth(currentMonth).map((day, idx) => {
                            if (!day) return <div key={idx} className="aspect-square" />;
                            const dateStr = format(day, "yyyy-MM-dd");
                            const isSelected = selectedDates.includes(dateStr);
                            return (
                               <button
                                  type="button"
                                  key={idx}
                                  onClick={() => {
                                     setSelectedDates(prev => 
                                        prev.includes(dateStr)
                                           ? prev.filter(d => d !== dateStr)
                                           : [...prev, dateStr]
                                     );
                                  }}
                                  className={`aspect-square w-full flex items-center justify-center text-[11px] font-bold rounded-xl transition-all ${
                                     isSelected 
                                        ? "bg-sky-400 text-black hover:opacity-85" 
                                        : "text-white/80 hover:bg-white/5"
                                  }`}
                               >
                                  {day.getDate()}
                               </button>
                            );
                         })}
                      </div>
                   </div>
                </div>
             </div>

             {/* Multiple Schedule Items Section */}
             <div className="space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                   <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Schedule Items</label>
                   <button
                      type="button"
                      onClick={addItem}
                      className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 text-[9px] font-black uppercase tracking-wider hover:bg-[#22c55e] hover:text-black transition-all"
                   >
                      + Add Item
                   </button>
                </div>

                <div className="space-y-8">
                   {scheduleItems.map((item, index) => (
                      <div key={item.id} className="relative bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-4">
                         {/* Remove Button */}
                         {scheduleItems.length > 1 && (
                            <button
                               type="button"
                               onClick={() => removeItem(item.id)}
                               className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1"
                            >
                               Remove
                            </button>
                         )}

                         <div className="text-[9px] font-black text-sky-400 uppercase tracking-[2px]">Item #{index + 1}</div>

                         {/* Title & Time */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                               <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Title</label>
                               <input 
                                 required
                                 value={item.title}
                                 onChange={e => updateItem(item.id, { title: e.target.value })}
                                 placeholder="EX: TRAINING SESSION"
                                 className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                               />
                             </div>
                             <div className="space-y-2">
                               <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Type</label>
                               <select
                                 value={item.session_type}
                                 onChange={e => updateItem(item.id, { session_type: e.target.value as any })}
                                 className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium appearance-none cursor-pointer"
                               >
                                  <option value="TACTICAL" className="bg-[#111]">TACTICAL</option>
                                  <option value="STRENGTH" className="bg-[#111]">STRENGTH</option>
                                  <option value="CONDITIONING" className="bg-[#111]">CONDITIONING</option>
                                  <option value="RECOVERY" className="bg-[#111]">RECOVERY</option>
                                  <option value="LOGISTICS" className="bg-[#111]">LOGISTICS</option>
                                  <option value="MEAL" className="bg-[#111]">MEAL</option>
                                  <option value="CURFEW" className="bg-[#111]">CURFEW</option>
                               </select>
                             </div>
                            <div className="space-y-2">
                               <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Start Time</label>
                               <input 
                                 type="time"
                                 required
                                 value={item.start_time}
                                 onChange={e => updateItem(item.id, { start_time: e.target.value })}
                                 className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                               />
                            </div>
                         </div>

                         {/* Coach & Location */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Assign Coach</label>
                               <select 
                                 value={item.coach_id}
                                 onChange={e => updateItem(item.id, { coach_id: e.target.value })}
                                 className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium appearance-none cursor-pointer"
                               >
                                  <option value="" className="bg-[#111]">UNASSIGNED</option>
                                  {(localCoaches || []).map(coach => (
                                     <option key={coach.id} value={coach.id} className="bg-[#111]">
                                        {coach.first_name} {coach.last_name || ""}
                                     </option>
                                  ))}
                               </select>
                            </div>
                            <div className="space-y-2">
                               <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Location</label>
                               <input 
                                 value={item.location}
                                 onChange={e => updateItem(item.id, { location: e.target.value })}
                                 placeholder="EX: HQ FIELD / PHYSICAL ROOM"
                                 className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                               />
                            </div>
                         </div>

                          {/* System Category Selector and External toggle */}
                          <div className="bg-black/35 p-6 rounded-3xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Category Selector */}
                            <div className="space-y-2">
                               <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Session Category</label>
                               <select 
                                 value={item.session_category}
                                 onChange={e => updateItem(item.id, { session_category: e.target.value as any })}
                                 className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium appearance-none cursor-pointer"
                               >
                                  {isSuperAdmin && <option value="CURRICULUM" className="bg-[#111]">CURRICULUM (SUPERADMIN ONLY)</option>}
                                  <option value="SCHEDULE" className="bg-[#111]">SCHEDULE (ONE-OFF SESSION)</option>
                                  <option value="EMERGENCY" className="bg-[#111]">EMERGENCY (EXTRA PRACTICE)</option>
                               </select>
                            </div>

                            {/* External Switch */}
                            <div className="flex items-center justify-between p-2 self-end">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-white uppercase tracking-wider">External Booking</span>
                                <span className="text-[8px] text-gray-500 font-semibold tracking-normal normal-case">Non-academy client</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { 
                                  is_external: !item.is_external
                                })}
                                className={`w-10 h-6 rounded-full p-1 transition-colors outline-none ${
                                  item.is_external ? 'bg-[#22c55e]' : 'bg-white/10'
                                }`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                  item.is_external ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                         </div>

                          {/* Conditional External Player Name Field */}
                          {item.is_external && (
                            <div className="space-y-4 p-6 bg-[#22c55e]/[0.02] border border-[#22c55e]/10 rounded-2xl animate-fade-in">
                              <div className="flex justify-between items-center pb-2 border-b border-[#22c55e]/10">
                                <div className="text-[9px] font-black text-[#22c55e] uppercase tracking-[3px]">External Client Registry</div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const defaultDateStr = selectedDates[0] || format(new Date(), "yyyy-MM-dd");
                                    updateItem(item.id, {
                                      external_clients: [
                                        ...item.external_clients,
                                        {
                                          first_name: "",
                                          last_name: "",
                                          email: "",
                                          phone: "",
                                          payment_status: "PENDING",
                                          payment_notes: "",
                                          training_start_date: defaultDateStr,
                                          training_end_date: defaultDateStr
                                        }
                                      ]
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg text-[#22c55e] text-[8px] font-black uppercase tracking-wider hover:bg-[#22c55e] hover:text-black transition-all"
                                >
                                  + Add Client
                                </button>
                              </div>

                              <div className="space-y-6">
                                {item.external_clients.map((client, clientIdx) => {
                                  const updateClient = (updates: Partial<ExternalClientEntry>) => {
                                    const updatedClients = [...item.external_clients];
                                    updatedClients[clientIdx] = { ...client, ...updates };
                                    updateItem(item.id, { external_clients: updatedClients });
                                  };
                                  const removeClient = () => {
                                    const updatedClients = item.external_clients.filter((_, cIdx) => cIdx !== clientIdx);
                                    updateItem(item.id, { external_clients: updatedClients });
                                  };

                                  return (
                                    <div key={clientIdx} className="space-y-4 p-4 bg-black/40 border border-white/5 rounded-xl relative">
                                      {item.external_clients.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={removeClient}
                                          className="absolute top-3 right-3 text-[9px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors animate-fade-in"
                                        >
                                          Remove Client
                                        </button>
                                      )}
                                      <div className="text-[9px] font-black text-sky-400 uppercase tracking-[2px]">Client #{clientIdx + 1}</div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">First Name</label>
                                          <input 
                                            required
                                            type="text"
                                            value={client.first_name}
                                            onChange={e => updateClient({ first_name: e.target.value })}
                                            placeholder="EX: MARCUS"
                                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Last Name</label>
                                          <input 
                                            required
                                            type="text"
                                            value={client.last_name}
                                            onChange={e => updateClient({ last_name: e.target.value })}
                                            placeholder="EX: RASHFORD"
                                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Phone Number</label>
                                          <input 
                                            required
                                            type="text"
                                            value={client.phone}
                                            onChange={e => updateClient({ phone: e.target.value })}
                                            placeholder="EX: +44 7911 123456"
                                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Email</label>
                                          <input 
                                            required
                                            type="email"
                                            value={client.email}
                                            onChange={e => updateClient({ email: e.target.value })}
                                            placeholder="EX: MARCUS@MANUTD.COM"
                                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Training Start Date</label>
                                          <input 
                                            required
                                            type="date"
                                            value={client.training_start_date}
                                            onChange={e => updateClient({ training_start_date: e.target.value })}
                                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Training End Date</label>
                                          <input 
                                            required
                                            type="date"
                                            value={client.training_end_date}
                                            onChange={e => updateClient({ training_end_date: e.target.value })}
                                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Payment Status</label>
                                          <select 
                                            value={client.payment_status}
                                            onChange={e => updateClient({ payment_status: e.target.value as any })}
                                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium appearance-none cursor-pointer"
                                          >
                                            <option value="PENDING" className="bg-[#111]">PENDING</option>
                                            <option value="CONFIRMED" className="bg-[#111]">CONFIRMED</option>
                                          </select>
                                        </div>
                                        <div className="space-y-2">
                                          <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Payment Notes (Optional)</label>
                                          <input 
                                            type="text"
                                            value={client.payment_notes}
                                            onChange={e => updateClient({ payment_notes: e.target.value })}
                                            placeholder="EX: INVOICE SENT, PENDING STRIPE SYNC"
                                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Assign Internal Athletes */}
                          {!item.is_external && (
                            <div className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-[9px] font-black text-sky-400 uppercase tracking-[2px]">Assign Athletes (Optional)</div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const allIds = localAthletes.map(a => a.id);
                                    const allSelected = item.assigned_athletes?.length === allIds.length;
                                    updateItem(item.id, { assigned_athletes: allSelected ? [] : allIds });
                                  }}
                                  className="text-[9px] font-black text-white/50 hover:text-white uppercase tracking-wider transition-colors"
                                >
                                  {item.assigned_athletes?.length === localAthletes.length && localAthletes.length > 0 ? "Deselect All" : "Select All"}
                                </button>
                              </div>
                              <div className="bg-black/40 border border-white/10 rounded-xl p-4 max-h-40 overflow-y-auto space-y-3">
                                {localAthletes.map(athlete => (
                                  <label key={athlete.id} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => {
                                    e.preventDefault();
                                    const isSelected = item.assigned_athletes?.includes(athlete.id);
                                    const updated = isSelected 
                                      ? item.assigned_athletes?.filter(id => id !== athlete.id) || []
                                      : [...(item.assigned_athletes || []), athlete.id];
                                    updateItem(item.id, { assigned_athletes: updated });
                                  }}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.assigned_athletes?.includes(athlete.id) ? 'bg-sky-500 border-sky-500' : 'border-white/20 group-hover:border-sky-500/50'}`}>
                                      {item.assigned_athletes?.includes(athlete.id) && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                    </div>
                                    <span className="text-sm text-white/80 uppercase group-hover:text-white transition-colors">{athlete.first_name} {athlete.last_name}</span>
                                  </label>
                                ))}
                                {localAthletes.length === 0 && <span className="text-xs text-white/40 uppercase">No internal athletes found</span>}
                              </div>
                            </div>
                          )}

                         {/* Notes */}
                         <div className="space-y-2">
                            <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Description / Notes</label>
                            <textarea 
                              value={item.notes}
                              onChange={e => updateItem(item.id, { notes: e.target.value })}
                              placeholder="SPECIFY ADDITIONAL DETAILS..."
                              className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                            />
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Submit section */}
             <div className="mt-8 pt-6 border-t border-white/5">
                {error && (
                   <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest">
                      <AlertCircle size={16} /> {error}
                   </div>
                )}
                <button 
                  disabled={loading}
                  className="w-full bg-sky-400 text-black py-5 rounded-2xl font-display text-sm tracking-[0.2em] hover:bg-white transition-all uppercase shadow-2xl flex items-center justify-center gap-3"
                >
                   {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                   INITIALIZE SCHEDULE
                </button>
             </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
