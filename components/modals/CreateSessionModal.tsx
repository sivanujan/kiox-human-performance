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
  athletes?: any[];
  coaches?: any[];
  defaultDate?: string;
  defaultIsCurriculum?: boolean;
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
  external_player_name: string;
}

export default function CreateSessionModal({ isOpen, onClose, coaches, defaultDate, defaultIsCurriculum }: CreateSessionModalProps) {
  const { user, profile } = useAuth();
  const { userTimezone } = useTimezone();
  const { createSession, loading } = useSessions();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const [localCoaches, setLocalCoaches] = useState<any[]>(coaches || []);
  
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
      external_player_name: ""
    }
  ]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedDates(defaultDate ? [defaultDate] : [format(new Date(), "yyyy-MM-dd")]);
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
          external_player_name: ""
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
      if (item.is_external && !item.external_player_name.trim()) {
        setError("Please specify the external player's name.");
        return;
      }
    }

    try {
      const insertPromises = selectedDates.flatMap((dateStr) => {
        return scheduleItems.map(async (item) => {
          const sessionRes = await createSession({
            title: item.title,
            session_type: "LOGISTICS",
            scheduled_date: dateStr,
            start_time: `${item.start_time}:00`,
            duration_minutes: item.duration_minutes,
            location: item.location || "HQ FIELD",
            target_load_au: undefined,
            assigned_athletes: [],
            notes: item.notes,
            assigned_by: user?.id,
            coach_timezone: userTimezone,
            coach_id: item.coach_id || undefined,
            is_curriculum: item.is_curriculum,
            is_emergency: item.is_emergency,
            is_external: item.is_external,
            external_player_name: item.is_external ? item.external_player_name : null,
            payment_status: item.is_external ? 'CONFIRMED' : 'PENDING',
            confirmed_by_admin: item.is_external ? true : false
          });

          if (sessionRes.success) {
            // Notification dispatch flow
            if (item.is_emergency) {
              // Get all coaches (staff)
              const { data: staffProfiles } = await supabase
                .from("profiles")
                .select("id")
                .eq("role", "staff");

              if (staffProfiles && staffProfiles.length > 0) {
                const notifications = staffProfiles.map((staff: any) => ({
                  recipient_id: staff.id,
                  sender_id: user?.id,
                  title: "🚨 EMERGENCY SESSION DETECTED",
                  message: `An emergency session "${item.title}" was created for ${dateStr} at ${item.start_time}.`,
                  type: "ALERT"
                }));
                await supabase.from("system_notifications").insert(notifications);
              }
            } else if (item.coach_id) {
              const label = item.is_curriculum ? "Curriculum Session" : "Schedule Session";
              await supabase.from("system_notifications").insert({
                recipient_id: item.coach_id,
                sender_id: user?.id,
                title: item.is_curriculum ? "NEW CURRICULUM ASSIGNMENT" : "NEW SCHEDULE ASSIGNMENT",
                message: `You have been assigned to ${label} "${item.title}" on ${dateStr} at ${item.start_time}.`,
                type: "UPDATE"
              });
            }
          }

          return sessionRes;
        });
      });

      const results = await Promise.all(insertPromises);
      const failed = results.find(r => !r.success);
      if (!failed) {
        onClose();
      } else {
        setError(failed.error || "Failed to initialize schedule.");
      }
    } catch (err: any) {
      setError(err.message || "A mission-critical error occurred.");
    }
  };

  const addItem = () => {
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
        external_player_name: ""
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
                   <div className="text-sky-400 text-[10px] font-black tracking-[5px] uppercase mb-1">Operational Scheduler</div>
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
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] ml-1 flex items-center gap-2">
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
                            <div key={idx} className="text-[10px] font-black text-gray-500 py-1 uppercase flex items-center justify-center">{day}</div>
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
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] ml-1">Schedule Items</label>
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
                               className="absolute top-4 right-4 text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                            >
                               Remove
                            </button>
                         )}

                         <div className="text-[9px] font-black text-sky-400 uppercase tracking-[2px]">Item #{index + 1}</div>

                         {/* Title & Time */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Title</label>
                               <input 
                                 required
                                 value={item.title}
                                 onChange={e => updateItem(item.id, { title: e.target.value })}
                                 placeholder="EX: TRAINING SESSION"
                                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-xs font-bold focus:border-sky-500 outline-none uppercase placeholder:text-white/5"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Start Time</label>
                               <input 
                                 type="time"
                                 required
                                 value={item.start_time}
                                 onChange={e => updateItem(item.id, { start_time: e.target.value })}
                                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-xs font-bold focus:border-sky-500 outline-none"
                               />
                            </div>
                         </div>

                         {/* Coach & Location */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Assign Coach</label>
                               <select 
                                 value={item.coach_id}
                                 onChange={e => updateItem(item.id, { coach_id: e.target.value })}
                                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-xs font-bold focus:border-sky-500 outline-none appearance-none cursor-pointer"
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
                               <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Location</label>
                               <input 
                                 value={item.location}
                                 onChange={e => updateItem(item.id, { location: e.target.value })}
                                 placeholder="EX: HQ FIELD / PHYSICAL ROOM"
                                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-xs font-bold focus:border-sky-500 outline-none placeholder:text-white/5"
                               />
                            </div>
                         </div>

                         {/* System Category Switches */}
                         <div className="bg-black/35 p-4 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Curriculum Switch - SuperAdmin Only */}
                            {isSuperAdmin && (
                              <div className="flex items-center justify-between p-2">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-white uppercase tracking-wider">Curriculum</span>
                                  <span className="text-[8px] text-gray-500 font-semibold tracking-normal normal-case">SuperAdmin program</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { 
                                    is_curriculum: !item.is_curriculum,
                                    is_emergency: false,
                                    is_external: false
                                  })}
                                  className={`w-10 h-6 rounded-full p-1 transition-colors outline-none ${
                                    item.is_curriculum ? 'bg-purple-500' : 'bg-white/10'
                                  }`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                    item.is_curriculum ? 'translate-x-4' : 'translate-x-0'
                                  }`} />
                                </button>
                              </div>
                            )}

                            {/* Emergency Switch */}
                            <div className="flex items-center justify-between p-2">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-white uppercase tracking-wider">Emergency</span>
                                <span className="text-[8px] text-gray-500 font-semibold tracking-normal normal-case">Alerts all coaches</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { 
                                  is_emergency: !item.is_emergency,
                                  is_curriculum: false,
                                  is_external: false
                                })}
                                className={`w-10 h-6 rounded-full p-1 transition-colors outline-none ${
                                  item.is_emergency ? 'bg-red-500' : 'bg-white/10'
                                }`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                  item.is_emergency ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>

                            {/* External Switch */}
                            <div className="flex items-center justify-between p-2">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-white uppercase tracking-wider">External Booking</span>
                                <span className="text-[8px] text-gray-500 font-semibold tracking-normal normal-case">Non-academy client</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { 
                                  is_external: !item.is_external,
                                  is_curriculum: false,
                                  is_emergency: false
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
                           <div className="space-y-2 animate-fade-in">
                             <label className="text-[8px] font-black text-[#22c55e] uppercase tracking-widest ml-1">External Player Name</label>
                             <input 
                               required
                               type="text"
                               value={item.external_player_name}
                               onChange={e => updateItem(item.id, { external_player_name: e.target.value })}
                               placeholder="EX: MARCUS RASHFORD"
                               className="w-full bg-[#22c55e]/5 border border-[#22c55e]/25 rounded-xl p-3.5 text-white text-xs font-bold focus:border-[#22c55e] outline-none uppercase"
                             />
                           </div>
                         )}

                         {/* Notes */}
                         <div className="space-y-2">
                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Description / Notes</label>
                            <textarea 
                              value={item.notes}
                              onChange={e => updateItem(item.id, { notes: e.target.value })}
                              placeholder="SPECIFY ADDITIONAL DETAILS..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold focus:border-sky-500 outline-none min-h-[60px] resize-none placeholder:text-white/5"
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
