"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MapPin, Activity, Users, Save, Loader2, AlertCircle, Globe } from "lucide-react";
import { useSessions } from "@/hooks/useSessions";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTimezone } from "@/hooks/useTimezone";
import { convertTimeOnly, getOffsetLabel } from "@/lib/timezone";
import { createPortal } from "react-dom";
import { format } from "date-fns";


interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: any[];
}

export default function CreateSessionModal({ isOpen, onClose, athletes }: CreateSessionModalProps) {
  const { user } = useAuth();
  const { userTimezone, userCountry } = useTimezone();
  const { createSession, loading } = useSessions();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    session_type: "STRENGTH" as any,
    scheduled_date: format(new Date(), "yyyy-MM-dd"),
    start_time: format(new Date(), "HH:mm"),
    duration_minutes: 60,
    location: "",
    target_load_au: 450,
    assigned_athletes: [] as string[],
    notes: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.assigned_athletes.length === 0) {
      setError("At least one athlete must be assigned.");
      return;
    }

    try {
      const res = await createSession({
        ...formData,
        start_time: `${formData.start_time}:00`, // Ensure HH:mm:ss format
        assigned_by: user?.id,
        coach_timezone: userTimezone
      });
      
      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to initialize session.");
      }
    } catch (err: any) {
      setError(err.message || "A mission-critical error occurred.");
    }
  };

  const toggleAthlete = (id: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_athletes: prev.assigned_athletes.includes(id)
        ? prev.assigned_athletes.filter(a => a !== id)
        : [...prev.assigned_athletes, id]
    }));
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto py-20">
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
          className="relative w-full max-w-4xl bg-[#080808] border border-white/10 rounded-[48px] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-10 border-b border-white/5 bg-gradient-to-r from-amber-500/[0.05] to-transparent flex justify-between items-center">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[24px] bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                   <Calendar size={32} />
                </div>
                <div>
                   <div className="text-amber-500 text-[10px] font-black tracking-[5px] uppercase mb-1">Operational Scheduler</div>
                   <h2 className={`font-display text-4xl text-white tracking-wider uppercase`}>Initialize Training</h2>
                </div>
             </div>
             <button onClick={onClose} className="p-5 rounded-full bg-white/5 text-gray-400 hover:text-white transition-all">
                <X size={28} />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="p-10">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left: Core Info */}
                <div className="space-y-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] ml-1">Session Protocol (Title)</label>
                      <input 
                        required
                        value={formData.title}
                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="EX: STRENGTH BLOCK A"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm font-bold focus:border-amber-500 outline-none transition-all uppercase placeholder:text-white/5"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] ml-1">Type</label>
                         <select 
                           value={formData.session_type}
                           onChange={e => setFormData(prev => ({ ...prev, session_type: e.target.value as any }))}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-xs font-bold focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none appearance-none cursor-pointer transition-all"
                         >
                            <option value="STRENGTH" className="bg-[#111]">STRENGTH</option>
                            <option value="TACTICAL" className="bg-[#111]">TACTICAL</option>
                            <option value="CONDITIONING" className="bg-[#111]">CONDITIONING</option>
                            <option value="RECOVERY" className="bg-[#111]">RECOVERY</option>
                            <option value="CUSTOM" className="bg-[#111]">CUSTOM</option>
                         </select>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] ml-1">Target Intensity (AU)</label>
                         <input 
                           type="number"
                           value={formData.target_load_au}
                           onChange={e => setFormData(prev => ({ ...prev, target_load_au: parseInt(e.target.value) }))}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm font-bold focus:border-amber-500 outline-none transition-all"
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] ml-1 flex items-center gap-2">
                            <Calendar size={12} /> Date
                         </label>
                         <input 
                           type="date"
                           required
                           min={format(new Date(), "yyyy-MM-dd")}
                           value={formData.scheduled_date}
                           onChange={e => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-xs font-bold focus:border-amber-500 outline-none"
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] ml-1 flex items-center gap-2">
                            <Clock size={12} /> Time
                         </label>
                         <input 
                           type="time"
                           required
                           value={formData.start_time}
                           onChange={e => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-xs font-bold focus:border-amber-500 outline-none"
                         />
                      </div>
                   </div>

                   {/* Timezone Preview */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                       <div className="flex items-center justify-between">
                          <div className="text-[9px] font-black text-amber-500 uppercase tracking-[3px]">Global Preview</div>
                          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-[9px] font-black uppercase tracking-wider flex items-center gap-2">
                             <Globe size={10} /> {userTimezone} ({getOffsetLabel(userTimezone)})
                             {userCountry && <span className="opacity-50 font-black">| {userCountry}</span>}
                          </div>
                       </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                         {[
                            { name: 'Colombo', tz: 'Asia/Colombo' },
                            { name: 'London', tz: 'Europe/London' },
                            { name: 'New York', tz: 'America/New_York' },
                            { name: 'Sydney', tz: 'Australia/Sydney' }
                         ].map(zone => (
                            <div key={zone.tz} className="flex flex-col gap-1">
                               <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">{zone.name}</span>
                               <span className="text-xs font-mono font-bold text-gray-300">
                                  {convertTimeOnly(formData.start_time, userTimezone, zone.tz)}
                               </span>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] ml-1 flex items-center gap-2">
                         <Activity size={12} /> Mission Objective (Notes)
                      </label>
                      <textarea 
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="SPECIFY DRILLS OR MODIFICATIONS..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-xs font-bold focus:border-amber-500 outline-none min-h-[140px] resize-none placeholder:text-white/5"
                      />
                   </div>
                </div>

                {/* Right: Athlete Assignment */}
                <div className="flex flex-col h-full">
                   <div className="flex justify-between items-center mb-6">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] ml-1 flex items-center gap-2">
                         <Users size={12} /> Unit Assignment ({formData.assigned_athletes.length} SELECTED)
                      </label>
                   </div>
                   
                   <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden flex flex-col p-4">
                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
                         {athletes.map((athlete) => (
                           <button
                             type="button"
                             key={athlete.id}
                             onClick={() => toggleAthlete(athlete.id)}
                             className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                               formData.assigned_athletes.includes(athlete.id)
                                 ? "bg-amber-500/10 border-amber-500/30"
                                 : "bg-transparent border-transparent grayscale opacity-40 hover:opacity-100"
                             }`}
                           >
                               <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center font-display text-xs uppercase">
                                 {athlete.first_name?.[0] || '?'}{athlete.last_name?.[0] || ''}
                              </div>
                              <div className="flex-1 text-left">
                                 <div className="text-white font-bold text-xs uppercase">{athlete.first_name || 'UNKNOWN'} {athlete.last_name || 'SUBJECT'}</div>
                                 <div className="text-gray-500 text-[8px] font-black tracking-widest uppercase">OPERATIONAL ACTIVE</div>
                              </div>
                              {formData.assigned_athletes.includes(athlete.id) && (
                                <Save size={14} className="text-amber-500" />
                              )}
                           </button>
                         ))}
                      </div>
                   </div>

                   {error && (
                     <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest">
                        <AlertCircle size={16} /> {error}
                     </div>
                   )}

                   <button 
                     disabled={loading}
                     className="mt-8 w-full bg-amber-500 text-black py-5 rounded-2xl font-display text-sm tracking-[0.2em] hover:bg-white transition-all uppercase shadow-2xl flex items-center justify-center gap-3"
                   >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      INITIALIZE SESSION PROTOCOL
                   </button>
                </div>
             </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
