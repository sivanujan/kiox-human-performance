"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Save, Loader2, AlertCircle, Clock, MapPin, Activity,
  FileText, UserCheck, Zap, Users, Search, CheckCircle2, Circle,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { createPortal } from "react-dom";
import { calculateEndTime, calculateDurationMinutes } from "@/utils/timeUtils";

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  session: any | null;
  coaches?: any[];
  athletes?: any[];
}

const SESSION_TYPES = [
  { value: "STRENGTH",    label: "Strength",          active: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  { value: "TACTICAL",    label: "Tactical",          active: "text-blue-400 border-blue-500/40 bg-blue-500/10" },
  { value: "CONDITIONING",label: "Conditioning",      active: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  { value: "RECOVERY",    label: "Recovery",          active: "text-purple-400 border-purple-500/40 bg-purple-500/10" },
  { value: "MEAL",        label: "Meal",              active: "text-green-400 border-green-400/40 bg-green-400/10" },
  { value: "CURFEW",      label: "Curfew",            active: "text-zinc-400 border-zinc-500/40 bg-zinc-700/20" },
  { value: "LOGISTICS",   label: "Logistics/General", active: "text-sky-400 border-sky-400/40 bg-sky-400/10" },
  { value: "CUSTOM",      label: "Custom",            active: "text-white/60 border-white/20 bg-white/5" },
];

type Tab = "DETAILS" | "PLAYERS";

export default function EditSessionModal({
  isOpen, onClose, onSuccess, session, coaches = [], athletes = [],
}: EditSessionModalProps) {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("DETAILS");

  /* ── session detail fields ── */
  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState("TACTICAL");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [location, setLocation] = useState("");
  const [coachId, setCoachId] = useState("");
  const [notes, setNotes] = useState("");
  const [targetLoadAu, setTargetLoadAu] = useState(450);
  const [maxCapacity, setMaxCapacity] = useState<number | "">("");

  /* Time change handlers */
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    if (newStart && durationMinutes) {
      setEndTime(calculateEndTime(newStart, durationMinutes));
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    if (startTime && newEnd) {
      const computedDuration = calculateDurationMinutes(startTime, newEnd);
      setDurationMinutes(computedDuration);
    }
  };

  const handleDurationChange = (newDur: number) => {
    const dur = Math.max(1, newDur);
    setDurationMinutes(dur);
    if (startTime) {
      setEndTime(calculateEndTime(startTime, dur));
    }
  };

  /* ── athlete roster ── */
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [athleteSearch, setAthleteSearch] = useState("");

  /* ── remote data ── */
  const [localCoaches, setLocalCoaches] = useState<any[]>(coaches);
  const [localAthletes, setLocalAthletes] = useState<any[]>(athletes);

  useEffect(() => { setMounted(true); }, []);

  /* populate form when modal opens */
  useEffect(() => {
    if (isOpen && session) {
      setTitle(session.title || "");
      setSessionType(session.session_type || "TACTICAL");
      const st = session.start_time ? session.start_time.slice(0, 5) : "09:00";
      const dur = session.duration_minutes || 60;
      setStartTime(st);
      setDurationMinutes(dur);
      setEndTime(calculateEndTime(st, dur));
      setLocation(session.location || "");
      setCoachId(session.coach_id || "");
      setNotes(session.notes || "");
      setTargetLoadAu(session.target_load_au || 450);
      setMaxCapacity(session.max_capacity ?? "");
      setSelectedAthletes(session.assigned_athletes || []);
      setAthleteSearch("");
      setError(null);
      setActiveTab("DETAILS");
    }
  }, [isOpen, session]);

  /* fetch coaches & athletes if not provided */
  useEffect(() => {
    if (!isOpen) return;
    if (coaches.length > 0) {
      setLocalCoaches(coaches);
    } else {
      supabase.from("profiles").select("id, first_name, last_name, avatar_url")
        .in("role", ["staff", "superadmin"])
        .then(({ data }: { data: any[] | null }) => { if (data) setLocalCoaches(data); });
    }
    if (athletes.length > 0) {
      setLocalAthletes(athletes);
    } else {
      supabase.from("profiles").select("id, first_name, last_name, avatar_url")
        .eq("role", "athlete")
        .order("first_name")
        .then(({ data }: { data: any[] | null }) => { if (data) setLocalAthletes(data); });
    }
  }, [isOpen, coaches, athletes]);

  const filteredAthletes = useMemo(() => {
    const q = athleteSearch.toLowerCase().trim();
    if (!q) return localAthletes;
    return localAthletes.filter(a =>
      `${a.first_name} ${a.last_name || ""}`.toLowerCase().includes(q)
    );
  }, [localAthletes, athleteSearch]);

  const toggleAthlete = (id: string) => {
    setSelectedAthletes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedAthletes(filteredAthletes.map(a => a.id));
  const clearAll  = () => setSelectedAthletes([]);

  const isFacilityWide = session
    ? ["MEAL", "CURFEW", "LOGISTICS"].includes(session.session_type)
    : false;

  const handleSave = async () => {
    if (!session) return;
    if (!title.trim()) { setError("Session title is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const newTitle = title.trim();
      const newStartTime = startTime;
      const newDuration = Number(durationMinutes);
      const newCoachId = coachId || null;
      const newAssignedAthletes = isFacilityWide ? [] : selectedAthletes;

      // 1. Detect changes for notification email
      const changes: string[] = [];
      if (session.title !== newTitle) {
        changes.push(`Title changed from "${session.title}" to "${newTitle}"`);
      }
      if (session.session_type !== sessionType) {
        changes.push(`Session type changed to ${sessionType}`);
      }
      if (session.start_time?.slice(0, 5) !== newStartTime || session.duration_minutes !== newDuration) {
        changes.push(`Schedule adjusted to ${newStartTime} (${newDuration} min)`);
      }
      if (session.coach_id !== newCoachId) {
        const oldCoach = localCoaches.find(c => c.id === session.coach_id);
        const newCoach = localCoaches.find(c => c.id === newCoachId);
        const oldName = oldCoach ? `${oldCoach.first_name} ${oldCoach.last_name || ''}`.trim() : "Unassigned";
        const newName = newCoach ? `${newCoach.first_name} ${newCoach.last_name || ''}`.trim() : "Unassigned";
        changes.push(`Assigned coach updated from "${oldName}" to "${newName}"`);
      }
      if (session.location !== location.trim()) {
        changes.push(`Location updated to ${location.trim() || 'HQ FIELD'}`);
      }

      const prevAthletes = new Set(session.assigned_athletes || []);
      const currentAthletes = new Set(newAssignedAthletes);
      const addedAthletes = newAssignedAthletes.filter(id => !prevAthletes.has(id));
      const removedAthletes = (session.assigned_athletes || []).filter((id: string) => !currentAthletes.has(id));

      if (addedAthletes.length > 0 || removedAthletes.length > 0) {
        changes.push(`Player roster modified (${newAssignedAthletes.length} assigned)`);
      }

      // 2. Update session in Supabase
      const { error: updateError } = await supabase
        .from("training_sessions")
        .update({
          title: newTitle,
          session_type: sessionType,
          start_time: newStartTime,
          duration_minutes: newDuration,
          location: location.trim(),
          coach_id: newCoachId,
          notes: notes.trim(),
          target_load_au: Number(targetLoadAu),
          max_capacity: maxCapacity !== "" ? Number(maxCapacity) : null,
          assigned_athletes: newAssignedAthletes,
        })
        .eq("id", session.id);

      if (updateError) throw updateError;

      // 3. Collect recipients (all affected athletes + coaches)
      const recipientIds = Array.from(new Set([
        ...(session.assigned_athletes || []),
        ...newAssignedAthletes,
        ...(session.coach_id ? [session.coach_id] : []),
        ...(newCoachId ? [newCoachId] : [])
      ]));

      // 4. Send background email notification if any changes occurred
      if (changes.length > 0 && recipientIds.length > 0) {
        fetch('/api/admin/sessions/notify-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionTitle: newTitle,
            dateStr: session.scheduled_date,
            changes,
            recipientIds
          })
        }).catch(e => console.error("Failed to send update notifications:", e));
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !isOpen || !session) return null;

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 outline-none transition-all placeholder:text-white/20";
  const labelCls = "block text-[9px] font-black text-white/30 uppercase tracking-[3px] mb-2";

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "DETAILS", label: "Details",  icon: <FileText  size={14} /> },
    { id: "PLAYERS", label: "Players",  icon: <Users size={14} />, count: selectedAthletes.length },
  ];

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 overflow-y-auto py-16">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col"
          style={{ maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="p-8 pb-0 border-b border-white/5 bg-gradient-to-r from-[#22c55e]/[0.06] to-transparent flex justify-between items-center shrink-0">
            <div className="pb-6">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={11} className="text-[#22c55e]" />
                <span className="text-[9px] font-black text-[#22c55e] uppercase tracking-[4px]">Edit Session</span>
              </div>
              <h2 className="text-2xl font-display font-black text-white uppercase tracking-wider">{session.title}</h2>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{session.scheduled_date}</p>
            </div>
            <button onClick={onClose} className="p-3 mb-4 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 px-8 pt-4 shrink-0 bg-[#0a0a0a]">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30"
                    : "text-white/30 hover:text-white/50 border border-transparent"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${
                    activeTab === tab.id ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-white/10 text-white/40"
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-8 mt-4 shrink-0 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest">
              <AlertCircle size={15} /><span>{error}</span>
            </div>
          )}

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="wait">
              {activeTab === "DETAILS" ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="p-8 space-y-6"
                >
                  {/* Title */}
                  <div>
                    <label className={labelCls}><FileText size={10} className="inline mr-1" />Session Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Morning Strength Block" className={inputCls} />
                  </div>

                  {/* Session Type */}
                  <div>
                    <label className={labelCls}><Zap size={10} className="inline mr-1" />Session Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SESSION_TYPES.map(t => {
                        const isSelected = t.value === "CUSTOM" 
                          ? !["STRENGTH", "TACTICAL", "CONDITIONING", "RECOVERY", "MEAL", "CURFEW", "LOGISTICS"].includes(sessionType) 
                          : sessionType === t.value;
                        return (
                          <button 
                            key={t.value} 
                            type="button"
                            onClick={() => {
                              if (t.value === "CUSTOM") {
                                setSessionType("");
                              } else {
                                setSessionType(t.value);
                              }
                            }}
                            className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                              isSelected ? t.active : "border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"
                            }`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                    {!["STRENGTH", "TACTICAL", "CONDITIONING", "RECOVERY", "MEAL", "CURFEW", "LOGISTICS"].includes(sessionType) && (
                      <input 
                        type="text" 
                        required
                        value={sessionType} 
                        onChange={e => setSessionType(e.target.value.toUpperCase())} 
                        placeholder="EX: YOGA / MATCH_PREP" 
                        className="mt-3 w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium" 
                      />
                    )}
                  </div>

                  {/* Time & Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}><Clock size={10} className="inline mr-1" />Start Time</label>
                      <input type="time" value={startTime} onChange={e => handleStartTimeChange(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}><Clock size={10} className="inline mr-1" />End Time</label>
                      <input type="time" value={endTime} onChange={e => handleEndTimeChange(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}><Clock size={10} className="inline mr-1" />Duration (min)</label>
                      <input type="number" value={durationMinutes} min={1} step={5} onChange={e => handleDurationChange(Number(e.target.value))} className={inputCls} />
                    </div>
                  </div>

                  {/* Location & Coach */}
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}><MapPin size={10} className="inline mr-1" />Location</label>
                      <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. HQ Field" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}><UserCheck size={10} className="inline mr-1" />Assigned Coach</label>
                      <select value={coachId} onChange={e => setCoachId(e.target.value)} className={inputCls + " cursor-pointer"}>
                        <option value="">-- Unassigned --</option>
                        {localCoaches.map(c => (
                          <option key={c.id} value={c.id}>{c.first_name} {c.last_name || ""}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Target Load & Capacity */}
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}><Activity size={10} className="inline mr-1" />Target Load (AU)</label>
                      <input type="number" value={targetLoadAu} min={0} onChange={e => setTargetLoadAu(Number(e.target.value))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Max Capacity (optional)</label>
                      <input type="number" value={maxCapacity} min={0} placeholder="Unlimited" onChange={e => setMaxCapacity(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={labelCls}><FileText size={10} className="inline mr-1" />Session Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Operational notes, focus areas, instructions..." className={inputCls + " resize-none leading-relaxed"} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="players"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="p-8 space-y-5"
                >
                  {isFacilityWide ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                      <Users size={32} className="text-white/20" />
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Facility-Wide Session</p>
                      <p className="text-[9px] text-white/20">This session type applies to all athletes and does not use individual player assignment.</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary bar */}
                      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-[#22c55e]" />
                          <span className="text-xs font-bold text-white">
                            <span className="text-[#22c55e]">{selectedAthletes.length}</span>
                            <span className="text-white/40"> / {localAthletes.length} selected</span>
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={selectAll} className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/10 transition-all">
                            All
                          </button>
                          <button onClick={clearAll} className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/40 border border-white/10 hover:border-white/20 hover:text-white/60 transition-all">
                            None
                          </button>
                        </div>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                          type="text"
                          value={athleteSearch}
                          onChange={e => setAthleteSearch(e.target.value)}
                          placeholder="Search players..."
                          className={inputCls + " pl-10"}
                        />
                      </div>

                      {/* Athlete list */}
                      <div className="space-y-2 max-h-[38vh] overflow-y-auto scrollbar-hide pr-1">
                        {filteredAthletes.length === 0 ? (
                          <div className="text-center py-10 text-[10px] text-white/20 font-black uppercase tracking-widest">
                            No players found
                          </div>
                        ) : (
                          filteredAthletes.map(athlete => {
                            const isSelected = selectedAthletes.includes(athlete.id);
                            const initials = `${athlete.first_name?.[0] || ""}${athlete.last_name?.[0] || ""}`.toUpperCase();
                            return (
                              <button
                                key={athlete.id}
                                onClick={() => toggleAthlete(athlete.id)}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left group ${
                                  isSelected
                                    ? "bg-[#22c55e]/10 border-[#22c55e]/30"
                                    : "bg-white/[0.03] border-white/5 hover:border-white/15 hover:bg-white/[0.06]"
                                }`}
                              >
                                {/* Avatar */}
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black uppercase overflow-hidden shrink-0 border ${
                                  isSelected ? "border-[#22c55e]/40 bg-[#22c55e]/20 text-[#22c55e]" : "border-white/10 bg-white/5 text-white/50"
                                }`}>
                                  {athlete.avatar_url ? (
                                    <img src={athlete.avatar_url} alt={initials} className="w-full h-full object-cover" />
                                  ) : initials}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold uppercase tracking-wide truncate ${isSelected ? "text-white" : "text-white/60"}`}>
                                    {athlete.first_name} {athlete.last_name || ""}
                                  </p>
                                  <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Athlete</p>
                                </div>

                                {/* Check indicator */}
                                <div className={`shrink-0 transition-all ${isSelected ? "text-[#22c55e]" : "text-white/10 group-hover:text-white/30"}`}>
                                  {isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-8 pt-4 flex gap-3 border-t border-white/5 shrink-0 bg-[#0a0a0a]">
            <button onClick={onClose} disabled={saving} className="flex-1 py-4 border border-white/10 hover:border-white/20 text-white/40 hover:text-white/60 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-4 bg-[#22c55e] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#22c55e]/20">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
