"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Zap
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { calculateEndTime, calculateDurationMinutes } from "@/utils/timeUtils";

interface ManageScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: any | null;
  onSuccess?: () => void;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ManageScheduleModal({ isOpen, onClose, program, onSuccess }: ManageScheduleModalProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'syllabus'>('schedule');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    days: [1] as number[],
    start_time: "09:00",
    end_time: "10:00",
    duration_minutes: 60,
    title: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (isOpen && program) {
      fetchSchedule();
      setSyllabus(program.syllabus || []);
    }
  }, [isOpen, program]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/coach/program-schedule?programId=${program.id}`);
      const data = await res.json();
      if (!data.error) setSchedule(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveSyllabus = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/coach/programs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: program.id, syllabus })
      });
      if (res.ok) {
        alert("Syllabus updated successfully");
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDayToggle = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(dayIndex)
        ? prev.days.filter(d => d !== dayIndex)
        : [...prev.days, dayIndex]
    }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.days.length === 0) {
      alert("Please select at least one day");
      return;
    }
    setSubmitting(true);
    try {
      // Send a request for each selected day
      const promises = formData.days.map(day => 
        fetch("/api/coach/program-schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            program_id: program.id,
            day_of_week: day,
            start_time: formData.start_time,
            duration_minutes: formData.duration_minutes,
            title: formData.title,
            notes: formData.notes
          })
        })
      );

      await Promise.all(promises);

      setIsAdding(false);
      setFormData({
        days: [1],
        start_time: "09:00",
        end_time: "10:00",
        duration_minutes: 60,
        title: "",
        notes: ""
      });
      fetchSchedule();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this session?")) return;
    try {
      const res = await fetch(`/api/coach/program-schedule?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchSchedule();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-[#0a0a0a] border border-[#22c55e]/20 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <Calendar className="text-[#22c55e]" size={14} />
                 <span className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Protocol Deployment</span>
              </div>
              <h2 className="text-2xl font-display font-black text-white uppercase">{program?.title}</h2>
              <div className="flex gap-4 mt-4">
                 <button 
                  onClick={() => setActiveTab('schedule')}
                  className={`text-[10px] font-black uppercase tracking-[2px] pb-2 border-b-2 transition-all ${activeTab === 'schedule' ? 'text-[#22c55e] border-[#22c55e]' : 'text-white/40 border-transparent hover:text-white'}`}
                 >
                   Weekly Matrix
                 </button>
                 <button 
                  onClick={() => setActiveTab('syllabus')}
                  className={`text-[10px] font-black uppercase tracking-[2px] pb-2 border-b-2 transition-all ${activeTab === 'syllabus' ? 'text-[#22c55e] border-[#22c55e]' : 'text-white/40 border-transparent hover:text-white'}`}
                 >
                   Syllabus Breakdown
                 </button>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
              <X size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
           {activeTab === 'schedule' ? (
             <div className={`grid grid-cols-1 ${profile?.role === 'medical' ? '' : 'lg:grid-cols-2'} gap-12`}>
                {/* List Section */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Operational Sessions</h3>
                      {!isAdding && profile?.role !== 'medical' && (
                        <button 
                          onClick={() => setIsAdding(true)}
                          className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1"
                        >
                           <Plus size={14} /> Add Block
                        </button>
                      )}
                   </div>

                   {loading ? (
                     <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-[#22c55e]" />
                     </div>
                   ) : schedule.length === 0 ? (
                     <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                        <AlertCircle className="mx-auto text-gray-600 mb-4" size={32} />
                        <p className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">No recurring sessions configured</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {schedule.map((session) => (
                          <div key={session.id} className="group bg-white/[0.03] border border-white/5 p-5 rounded-2xl flex justify-between items-center hover:bg-white/[0.05] transition-all">
                             <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex flex-col items-center justify-center text-[#22c55e]">
                                   <span className="text-[8px] font-black uppercase opacity-60">{DAYS[session.day_of_week].slice(0, 3)}</span>
                                </div>
                                <div>
                                   <h4 className="text-sm font-bold text-white uppercase tracking-wider">{session.title}</h4>
                                   <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                                      <span className="flex items-center gap-1"><Clock size={10} className="text-[#22c55e]" /> {session.start_time.slice(0, 5)}</span>
                                      <span>• {session.duration_minutes} MIN</span>
                                   </div>
                                </div>
                             </div>
                             {profile?.role !== 'medical' && (
                               <button 
                                onClick={() => handleDelete(session.id)}
                                className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                               >
                                  <Trash2 size={16} />
                               </button>
                             )}
                          </div>
                        ))}
                     </div>
                   )}
                </div>

                {/* Form Section */}
                {profile?.role !== 'medical' && (
                   <div className="relative">
                      {isAdding ? (
                        <div className="bg-[#111] border border-[#22c55e]/10 rounded-3xl p-8 sticky top-0">
                           <h3 className="text-xs font-black text-[#22c55e] uppercase tracking-widest mb-8">New Session Configuration</h3>
                           <form onSubmit={handleAdd} className="space-y-6">
                              <div className="space-y-2">
                                 <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Session Identity</label>
                                 <input 
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g. MORNING CONDITIONING"
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                 />
                              </div>

                              <div className="space-y-3">
                                 <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Recurring Days</label>
                                 <div className="flex justify-between gap-2">
                                    {DAYS.map((d, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleDayToggle(i)}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all border ${
                                          formData.days.includes(i) 
                                            ? 'bg-[#22c55e] text-black border-[#22c55e]' 
                                            : 'bg-black text-gray-500 border-white/10 hover:border-white/20'
                                        }`}
                                      >
                                        {d.slice(0, 1)}
                                      </button>
                                    ))}
                                 </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                     <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Start Time</label>
                                     <input 
                                        type="time"
                                        value={formData.start_time}
                                        onChange={e => {
                                          const newStart = e.target.value;
                                          const newEnd = calculateEndTime(newStart, formData.duration_minutes);
                                          setFormData({ ...formData, start_time: newStart, end_time: newEnd });
                                        }}
                                        className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                     />
                                  </div>
                                  <div className="space-y-2">
                                     <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">End Time</label>
                                     <input 
                                        type="time"
                                        value={formData.end_time || calculateEndTime(formData.start_time, formData.duration_minutes)}
                                        onChange={e => {
                                          const newEnd = e.target.value;
                                          const newDuration = calculateDurationMinutes(formData.start_time, newEnd);
                                          setFormData({ ...formData, end_time: newEnd, duration_minutes: newDuration });
                                        }}
                                        className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                     />
                                  </div>
                                  <div className="space-y-2">
                                     <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Duration (MIN)</label>
                                     <input 
                                        type="number"
                                        min={1}
                                        step={5}
                                        value={formData.duration_minutes}
                                        onChange={e => {
                                          const newDur = Math.max(1, parseInt(e.target.value) || 1);
                                          const newEnd = calculateEndTime(formData.start_time, newDur);
                                          setFormData({ ...formData, duration_minutes: newDur, end_time: newEnd });
                                        }}
                                        className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                                     />
                                  </div>
                               </div>

                              <div className="flex gap-4 pt-4">
                                 <button 
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1"
                                 >
                                    Abort
                                 </button>
                                 <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1"
                                 >
                                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <><Zap size={14} /> Commit</>}
                                 </button>
                              </div>
                           </form>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none p-12">
                           <Zap size={64} className="text-gray-600 mb-6" />
                           <h4 className="text-xs font-black text-gray-500 uppercase tracking-[4px]">Configuration Engine Idle</h4>
                           <p className="text-[9px] text-gray-600 uppercase mt-2 max-w-[200px]">Initialize a new session block to expand the tactical matrix.</p>
                        </div>
                      )}
                   </div>
                 )}
             </div>
           ) : (
             <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Protocol Phases</h3>
                  {profile?.role !== 'medical' && (
                    <button 
                      onClick={() => setSyllabus([...syllabus, { title: "", status: "locked" }])}
                      className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1"
                    >
                       <Plus size={14} /> Add Phase
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                   {syllabus.map((phase, idx) => (
                     <div key={idx} className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl flex gap-4 items-center justify-between">
                        {profile?.role === 'medical' ? (
                          <>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-white uppercase tracking-wider">{phase.title || "Untitled Phase"}</h4>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                phase.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                phase.status === 'active' ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30' :
                                'bg-white/5 text-white/40 border border-white/10'
                              }`}>
                                {phase.status}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <input 
                              placeholder="PHASE TITLE..."
                              value={phase.title}
                              onChange={e => {
                                const updated = [...syllabus];
                                updated[idx].title = e.target.value;
                                setSyllabus(updated);
                              }}
                              className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#22c55e] outline-none transition-all"
                            />
                            <select 
                              value={phase.status}
                              onChange={e => {
                                const updated = [...syllabus];
                                updated[idx].status = e.target.value;
                                setSyllabus(updated);
                              }}
                              className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1"
                            >
                              <option value="completed">Completed</option>
                              <option value="active">Active</option>
                              <option value="locked">Locked</option>
                            </select>
                            <button 
                              onClick={() => {
                                const updated = [...syllabus];
                                updated.splice(idx, 1);
                                setSyllabus(updated);
                              }}
                              className="p-3 text-gray-600 hover:text-red-500 transition-colors"
                            >
                               <Trash2 size={18} />
                            </button>
                          </>
                        )}
                     </div>
                   ))}
                   {syllabus.length === 0 && (
                     <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                        <p className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">No syllabus phases defined</p>
                     </div>
                   )}
                </div>

                {profile?.role !== 'medical' && (
                  <button 
                    disabled={submitting}
                    onClick={saveSyllabus}
                    className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> Deploy Syllabus Updates</>}
                  </button>
                )}
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}
