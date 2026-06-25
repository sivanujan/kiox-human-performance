"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MapPin, Activity, Users, Save, Loader2, Play, CheckCircle2, Trash2 } from "lucide-react";
import { useSessions, TrainingSession } from "@/hooks/useSessions";
import { useAuth } from "@/components/providers/AuthProvider";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";


interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TrainingSession | null;
}

export default function SessionDetailsModal({ isOpen, onClose, session }: SessionDetailsModalProps) {
  const { logSessionCompletion, updateSessionStatus, getSessionLoads, loading } = useSessions();
  const { profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [athleteLogs, setAthleteLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"INFO" | "ROSTER">("INFO");
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [assignedCoachName, setAssignedCoachName] = useState<string | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const supabase = createClient();
  const isStaff = profile?.role === 'superadmin' || profile?.role === 'staff';
  const isFacilityWide = session ? ["MEAL", "CURFEW", "LOGISTICS"].includes(session.session_type) : false;
  const canDelete = profile?.role === 'superadmin' || (profile?.role === 'staff' && !session?.is_curriculum);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && session) {
      loadSessionData();
    }
  }, [isOpen, session]);

  const loadSessionData = async () => {
    if (!session) return;
    
    // Fetch creator's name
    if (session.assigned_by) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", session.assigned_by)
        .single();
      if (profileData) {
        setCreatorName(`${profileData.first_name || ""} ${profileData.last_name || ""}`.trim());
      } else {
        setCreatorName(null);
      }
    } else {
      setCreatorName(null);
    }

    // Fetch assigned coach's name
    if (session.coach_id) {
      const { data: coachData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", session.coach_id)
        .single();
      if (coachData) {
        setAssignedCoachName(`${coachData.first_name || ""} ${coachData.last_name || ""}`.trim());
      } else {
        setAssignedCoachName(null);
      }
    } else {
      setAssignedCoachName(null);
    }

    if (isFacilityWide) return;

    const { data } = await getSessionLoads(session.id);
    
    // Initialize logs for all assigned athletes if they don't exist
    const logs = (session.assigned_athletes || []).map(id => {
      const existing = data?.find((d: any) => d.athlete_id === id);
      return existing || {
        athlete_id: id,
        actual_load_au: session.target_load_au || 450,
        rpe: 5,
        attendance: 'PRESENT',
        notes: ''
      };
    });
    setAthleteLogs(logs);
  };

  if (!mounted || !isOpen || !session) return null;

  const handleConfirmPayment = async () => {
    if (!session || !isStaff) return;
    setUpdatingPayment(true);
    try {
      const { error } = await supabase
        .from("training_sessions")
        .update({
          payment_status: 'CONFIRMED',
          confirmed_by_admin: true,
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: profile?.id
        })
        .eq("id", session.id);

      if (error) throw error;
      onClose();
    } catch (err: any) {
      alert(`Failed to confirm payment: ${err.message}`);
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!session || !canDelete) return;
    
    const confirmMessage = session.is_curriculum 
      ? "Are you sure you want to delete this curriculum session? This will remove it from the calendar."
      : "Are you sure you want to delete this training session? All bookings and loads will be removed.";
      
    if (!confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from("training_sessions")
        .delete()
        .eq("id", session.id);

      if (error) throw error;
      alert("Session deleted successfully.");
      onClose();
    } catch (err: any) {
      alert(`Failed to delete session: ${err.message}`);
    }
  };

  const handleUpdateLog = (athleteId: string, updates: any) => {
    if (!isStaff) return;
    setAthleteLogs(prev => prev.map(l => l.athlete_id === athleteId ? { ...l, ...updates } : l));
  };

  const handleComplete = async () => {
    if (!isStaff) return;
    const res = await logSessionCompletion(session.id, athleteLogs);
    if (res.success) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto py-20">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-[#080808] border border-white/10 rounded-[48px] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-12 border-b border-white/5 bg-gradient-to-r from-[#22c55e]/[0.05] to-transparent flex justify-between items-start">
             <div>
                <div className="flex items-center gap-3 mb-4">
                   <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                     session.status === 'IN_PROGRESS' ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30 animate-pulse' : 'bg-white/5 text-white/40 border-white/10'
                   }`}>
                      {session.status}
                   </span>
                   <span className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">{session.session_type} // {session.id.slice(0, 8)}</span>
                </div>
                <h2 className={`font-display text-5xl text-white tracking-wider uppercase mb-2`}>{session.title}</h2>
                <div className="flex items-center gap-6 text-white/40 text-xs font-bold uppercase tracking-widest">
                   <div className="flex items-center gap-2"><Calendar size={14} className="text-[#22c55e]" /> {session.scheduled_date}</div>
                   <div className="flex items-center gap-2"><Clock size={14} className="text-[#22c55e]" /> {session.start_time}</div>
                   <div className="flex items-center gap-2"><MapPin size={14} className="text-[#22c55e]" /> {session.location || 'HQ FIELD'}</div>
                </div>
             </div>
              <div className="flex items-center gap-4">
                {canDelete && (
                   <button 
                     onClick={handleDeleteSession}
                     className="p-5 rounded-full bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                   >
                     <Trash2 size={24} />
                   </button>
                )}
                <button onClick={onClose} className="p-5 rounded-full bg-white/5 text-gray-400 hover:text-white transition-all">
                   <X size={28} />
                </button>
             </div>
          </div>

          <div className="flex h-[500px]">
             {/* Tabs Sidebar */}
             {!isFacilityWide && (
                <div className="w-[120px] border-r border-white/5 flex flex-col items-center py-10 gap-8">
                   {[
                      { id: 'INFO', icon: <Activity size={24} />, label: 'INFO' },
                      { id: 'ROSTER', icon: <Users size={24} />, label: 'ROSTER' }
                   ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-col items-center gap-2 transition-all ${activeTab === tab.id ? 'text-[#22c55e]' : 'text-gray-500 hover:text-white/40'}`}
                      >
                         {tab.icon}
                         <span className="text-[8px] font-black tracking-widest">{tab.label}</span>
                      </button>
                   ))}
                </div>
             )}

             {/* Content Area */}
             <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                {activeTab === 'INFO' || isFacilityWide ? (
                   <div className="space-y-12">
                      {isFacilityWide ? (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                               <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">PROTOCOL CREATOR</div>
                               <div className="text-xl font-display text-[#22c55e] uppercase truncate">
                                  {creatorName || "SYSTEM CENTRAL"}
                               </div>
                               <div className="text-gray-500 text-[8px] font-black uppercase mt-2">INITIALIZED BY COMMAND PROFILE</div>
                            </div>
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                               <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">ASSIGNED COACH</div>
                               <div className="text-xl font-display text-sky-400 uppercase truncate">
                                  {assignedCoachName || "UNASSIGNED"}
                               </div>
                               <div className="text-gray-500 text-[8px] font-black uppercase mt-2">LEAD COACH FOR PROTOCOL</div>
                            </div>
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                               <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">INITIALIZED TIMESTAMP</div>
                               <div className="text-sm font-mono text-white mt-1">
                                  {session.created_at ? format(new Date(session.created_at), "yyyy-MM-dd HH:mm") : "N/A"}
                                </div>
                               <div className="text-gray-500 text-[8px] font-black uppercase mt-4">SYSTEM RECORD ENTRY TIME</div>
                            </div>
                         </div>
                      ) : session.is_external ? (
                         <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">EXTERNAL CLIENT</div>
                                  <div className="text-xl font-display text-[#22c55e] uppercase truncate">
                                     {session.external_player_name}
                                  </div>
                                  <div className="text-gray-500 text-[8px] font-black uppercase mt-2">REGISTERED NAME</div>
                               </div>
                               <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">PHONE NUMBER</div>
                                  <div className="text-base font-mono text-white truncate">
                                     {session.external_person_phone || 'N/A'}
                                  </div>
                                  <div className="text-gray-500 text-[8px] font-black uppercase mt-2">CONTACT DIRECT LINE</div>
                               </div>
                               <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">EMAIL ADDRESS</div>
                                  <div className="text-base font-mono text-white truncate">
                                     {session.external_person_email || 'N/A'}
                                  </div>
                                  <div className="text-gray-500 text-[8px] font-black uppercase mt-2">CONTACT INBOX</div>
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">TRAINING PERIOD</div>
                                  <div className="text-xs font-bold text-white uppercase mt-1">
                                     {session.training_start_date || 'N/A'} TO {session.training_end_date || 'N/A'}
                                  </div>
                                  <div className="text-gray-500 text-[8px] font-black uppercase mt-4">CONTRACTED TIMELINE</div>
                               </div>
                               <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">PAYMENT STATUS</div>
                                  <div className="flex items-center gap-2 mt-1">
                                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                       session.payment_status === 'CONFIRMED' 
                                         ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                         : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                     }`}>
                                        {session.payment_status || 'PENDING'}
                                     </span>
                                  </div>
                                  <div className="text-gray-500 text-[8px] font-black uppercase mt-4">FINANCIAL CLEARANCE</div>
                               </div>
                               <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">PAYMENT NOTES</div>
                                  <div className="text-xs text-white/70 italic truncate mt-1">
                                     {session.payment_notes || 'No notes specified.'}
                                  </div>
                                  <div className="text-gray-500 text-[8px] font-black uppercase mt-4">TRANSACTION METADATA</div>
                                </div>
                            </div>

                            {session.payment_status !== 'CONFIRMED' && isStaff && (
                               <button
                                 onClick={handleConfirmPayment}
                                 disabled={updatingPayment}
                                 className="w-full py-4 bg-emerald-500 text-black font-display text-sm tracking-widest rounded-2xl hover:bg-white transition-all uppercase flex items-center justify-center gap-3 mt-4"
                               >
                                 {updatingPayment ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} CONFIRM PAYMENT & VALIDATE SESSION
                               </button>
                            )}
                         </div>
                      ) : (
                         <div className="grid grid-cols-2 gap-12">
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                               <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">TARGET INTENSITY MATRIX</div>
                               <div className="text-4xl font-display text-[#22c55e]">{session.target_load_au} AU</div>
                               <div className="text-gray-500 text-[8px] font-black uppercase mt-2">PROJECTED SQUAD ACCUMULATION</div>
                            </div>
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                               <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">UNIT ASSIGNMENT</div>
                               <div className="text-4xl font-display text-white">{(session.assigned_athletes || []).length} SUBJECTS</div>
                               <div className="text-gray-500 text-[8px] font-black uppercase mt-2">OPERATIONAL UNIT SIZE</div>
                            </div>
                         </div>
                      )}

                      <div className="space-y-4">
                         <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">MISSION NOTES</div>
                         <p className="text-white/60 text-sm leading-relaxed italic">"{session.notes || 'No operational modifications recorded for this session.'}"</p>
                      </div>

                      {!isFacilityWide && (
                         <div className="pt-12 flex gap-4">
                            {isStaff && session.status === 'SCHEDULED' && (
                              <button 
                                onClick={() => updateSessionStatus(session.id, 'IN_PROGRESS')}
                                className="flex-1 py-4 bg-[#22c55e] text-black font-display text-sm tracking-widest rounded-2xl hover:bg-white transition-all uppercase flex items-center justify-center gap-3"
                              >
                                 <Play size={18} fill="currentColor" /> MARK IN PROGRESS
                              </button>
                            )}
                            {isStaff && session.status === 'IN_PROGRESS' && (
                              <button 
                                onClick={() => setActiveTab('ROSTER')}
                                className="flex-1 py-4 bg-amber-500 text-black font-display text-sm tracking-widest rounded-2xl hover:bg-white transition-all uppercase flex items-center justify-center gap-3"
                              >
                                 <CheckCircle2 size={18} /> INITIALIZE COMPLETION LOG
                              </button>
                            )}
                         </div>
                      )}
                   </div>
                ) : (
                   <div className="space-y-8">
                      <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl">
                         <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">OPERATIONAL AUDIT: DATA RETENTION REQUIRED FOR COMPLETION</div>
                         <button 
                           onClick={handleComplete}
                           disabled={loading}
                           className="px-8 py-3 bg-amber-500 text-black font-display text-xs tracking-widest rounded-xl hover:bg-white transition-all uppercase shadow-lg flex items-center gap-2"
                         >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} COMMIT LOADS & CLOSE
                         </button>
                      </div>

                      <div className="space-y-4">
                         {athleteLogs.map((log, i) => (
                           <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-[32px] flex flex-wrap lg:flex-nowrap items-center gap-8 group">
                              <div className="flex items-center gap-4 shrink-0 min-w-[200px]">
                                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-display shadow-xl uppercase">
                                    {log.athlete_id.slice(0, 2)}
                                 </div>
                                 <div className="text-white font-bold text-xs uppercase tracking-wider truncate">SUBJECT {log.athlete_id.slice(0, 8)}</div>
                              </div>

                              <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 shrink-0">
                                 {['PRESENT', 'ABSENT', 'LATE'].map(status => (
                                   <button 
                                     key={status}
                                     onClick={() => handleUpdateLog(log.athlete_id, { attendance: status })}
                                     className={`px-4 py-2 rounded-xl text-[8px] font-black tracking-widest transition-all ${
                                       log.attendance === status ? 'bg-[#22c55e] text-black' : 'text-gray-500 hover:text-white'
                                     }`}
                                   >
                                      {status}
                                   </button>
                                 ))}
                              </div>

                              <div className="flex-1 grid grid-cols-2 gap-6">
                                 <div className="space-y-2">
                                    <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">ACTUAL LOAD (AU)</label>
                                    <input 
                                      type="number"
                                      value={log.actual_load_au}
                                      onChange={e => handleUpdateLog(log.athlete_id, { actual_load_au: parseInt(e.target.value) })}
                                      className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">RPE <span>{log.rpe}/10</span></label>
                                    <input 
                                      type="range"
                                      min="1"
                                      max="10"
                                      value={log.rpe}
                                      onChange={e => handleUpdateLog(log.athlete_id, { rpe: parseInt(e.target.value) })}
                                      className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium appearance-none cursor-pointer"
                                    />
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
