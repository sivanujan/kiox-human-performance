"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Activity, 
  Target, 
  Zap, 
  Play, 
  ArrowRight, 
  Loader2, 
  ClipboardCheck,
  ShieldCheck,
  TrendingUp,
  BarChart3
} from "lucide-react";


interface AthleteAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

export default function AthleteAssessmentModal({ isOpen, onClose, athleteId, athleteName }: AthleteAssessmentModalProps) {
  const [activeTab, setActiveTab] = useState<'PHYSICAL' | 'MATCH' | 'COGNITIVE' | 'PROGRAM'>('PHYSICAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  // Fetch current metrics on open
  useEffect(() => {
    // Basic UUID validation or at least ensure it's not the string "undefined"
    if (isOpen && athleteId && athleteId !== 'undefined') {
      fetchCurrentMetrics();
    }
  }, [isOpen, athleteId]);

  const fetchCurrentMetrics = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/admin/athlete/${athleteId}/metrics`);
      if (res.ok) {
        const data = await res.json();
        setPhysicalForm(prev => ({
          ...prev,
          top_speed: data.top_speed || "",
          distance: data.distance || "",
          sprints: data.sprints || "",
          power: data.power_output || "",
          vo2_max: data.vo2_max || "",
          directives: data.protocol_directives || "",
          intensity: data.last_intensity?.toString() || "5",
          duration: data.last_duration?.toString() || "60"
        }));
        setMatchForm(prev => ({
          ...prev,
          opponent: "", // Reset opponent for new entry
          goals: data.goals || "",
          assists: data.assists || "",
          xg: data.xg || "",
          pass_accuracy: data.pass_accuracy || "",
          duels_won: data.duels_won || "",
          pressures: data.pressures || "",
          directives: data.protocol_directives || ""
        }));
        setCognitiveForm(prev => ({
          ...prev,
          reaction_time: data.reaction_time || "",
          decision_score: data.decision_score?.toString() || "5",
          focus_score: data.focus_score?.toString() || "80",
          stress_level: data.stress_level || "Low"
        }));
      }
    } catch (err) {
      console.error("Failed to fetch current metrics:", err);
    } finally {
      setIsFetching(false);
    }
  };
  
  const [physicalForm, setPhysicalForm] = useState({
    top_speed: "",
    distance: "",
    sprints: "",
    power: "",
    vo2_max: "",
    intensity: "5", // Default medium
    duration: "60", // Default session
    directives: "",
    date: new Date().toISOString().split('T')[0]
  });

  const [matchForm, setMatchForm] = useState({
    opponent: "",
    goals: "",
    assists: "",
    xg: "",
    pass_accuracy: "",
    duels_won: "",
    pressures: "",
    directives: "",
    date: new Date().toISOString().split('T')[0]
  });

  const [cognitiveForm, setCognitiveForm] = useState({
    reaction_time: "",
    decision_score: "5",
    focus_score: "80",
    stress_level: "Low",
    date: new Date().toISOString().split('T')[0]
  });

  const [programForm, setProgramForm] = useState({
    title: "",
    phase: "Tactical",
    notes: "",
    date: new Date().toISOString().split('T')[0]
  });

  const handlePhysicalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/athlete/${athleteId}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: 'PHYSICAL',
          metrics: physicalForm,
          date: physicalForm.date
        }) });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to commit physical assessment.");
    } finally {
      setLoading(false);
    }
  };

  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/athlete/${athleteId}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: 'MATCH',
          metrics: matchForm,
          date: matchForm.date
        }) });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to commit match stats.");
    } finally {
      setLoading(false);
    }
  };

  const handleCognitiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/athlete/${athleteId}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: 'COGNITIVE',
          metrics: cognitiveForm,
          date: cognitiveForm.date
        }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to sync cognitive labs.");
    } finally { setLoading(false); }
  };

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/athlete/${athleteId}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: 'PROGRAM',
          metrics: programForm,
          date: programForm.date
        }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to assign elite program.");
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[#22c55e]/20 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(34,197,94,0.15)]"
        >
          {/* Header */}
          <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-br from-[#22c55e]/15 to-transparent">
            <div>
              <div className="text-[#22c55e] text-[10px] font-black tracking-[4px] uppercase mb-1 flex items-center gap-2">
                <BarChart3 size={14} fill="currentColor" /> SQUAD PERFORMANCE MATRIX
              </div>
              <h2 className={`font-display text-3xl text-white tracking-wider uppercase`}>
                INITIATE ASSESSMENT
              </h2>
              <div className="mt-2 flex items-center gap-3">
                 <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">SUBJ:</span>
                 <span className="text-white font-bold text-xs uppercase tracking-wide px-3 py-1 bg-white/5 rounded-full border border-white/5">{athleteName}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-4 rounded-full bg-white/5 text-gray-400 hover:text-white transition-all self-end md:self-auto">
              <X size={24} />
            </button>
          </div>

          <div className="p-10">
            {/* Tab Selector */}
            <div className="flex flex-wrap gap-2 mb-10 bg-black/40 border border-white/5 p-1.5 rounded-3xl w-fit">
              <button 
                onClick={() => setActiveTab('PHYSICAL')}
                className={`px-6 py-3 rounded-2xl text-[9px] font-display tracking-[2px] uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'PHYSICAL' 
                    ? "bg-[#22c55e] text-black shadow-[0_5px_20px_rgba(34,197,94,0.3)]" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Activity size={12} /> PHYSICAL
              </button>
              <button 
                onClick={() => setActiveTab('MATCH')}
                className={`px-6 py-3 rounded-2xl text-[9px] font-display tracking-[2px] uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'MATCH' 
                    ? "bg-[#22c55e] text-black shadow-[0_5px_20px_rgba(34,197,94,0.3)]" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Target size={12} /> MATCH
              </button>
              <button 
                onClick={() => setActiveTab('COGNITIVE')}
                className={`px-6 py-3 rounded-2xl text-[9px] font-display tracking-[2px] uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'COGNITIVE' 
                    ? "bg-[#22c55e] text-black shadow-[0_5px_20px_rgba(34,197,94,0.3)]" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Zap size={12} /> COGNITIVE
              </button>
              <button 
                onClick={() => setActiveTab('PROGRAM')}
                className={`px-6 py-3 rounded-2xl text-[9px] font-display tracking-[2px] uppercase transition-all flex items-center gap-2 ${
                  activeTab === 'PROGRAM' 
                    ? "bg-[#22c55e] text-black shadow-[0_5px_20px_rgba(34,197,94,0.3)]" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <ShieldCheck size={12} /> PROGRAM
              </button>
            </div>

            {activeTab === 'PHYSICAL' ? (
              <form onSubmit={handlePhysicalSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* ... existing physical form items ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Top Speed (km/h)</label>
                    <input
                      type="number" step="0.1"
                      placeholder="EX: 34.5"
                      value={physicalForm.top_speed}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, top_speed: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-display placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Distance (km)</label>
                    <input
                      type="number" step="0.1"
                      placeholder="EX: 12.4"
                      value={physicalForm.distance}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, distance: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-display placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Sprints</label>
                    <input
                      type="number"
                      placeholder="EX: 28"
                      value={physicalForm.sprints}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, sprints: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-display placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Power (Watts)</label>
                    <input
                      type="number"
                      placeholder="EX: 850"
                      value={physicalForm.power}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, power: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-display placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">VO2 Max</label>
                    <input
                      type="number" step="0.1"
                      placeholder="EX: 62.1"
                      value={physicalForm.vo2_max}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, vo2_max: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-display placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Assessment Date</label>
                    <input
                      type="date"
                      value={physicalForm.date}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, date: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-xs font-bold focus:outline-none focus:border-[#22c55e] transition-all"
                    />
                  </div>
                </div>

                {/* ADVANCED LOAD METRICS */}
                <div className="p-8 bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-3xl space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap size={16} className="text-[#22c55e]" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">Load Intelligence Mapping</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase">Session Intensity</label>
                        <span className="text-white font-display text-xl">{physicalForm.intensity}</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" step="1"
                        value={physicalForm.intensity}
                        onChange={(e) => setPhysicalForm({ ...physicalForm, intensity: e.target.value })}
                        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#22c55e]"
                      />
                      <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase tracking-widest">
                        <span>RECOVERY</span>
                        <span>OPTIMAL</span>
                        <span>MAXIMAL</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Duration (Mins)</label>
                      <input
                        type="number"
                        placeholder="60"
                        value={physicalForm.duration}
                        onChange={(e) => setPhysicalForm({ ...physicalForm, duration: e.target.value })}
                        className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-display placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* COACH DIRECTIVES */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Coach's Protocol Directives</label>
                  <textarea
                    placeholder="ENTER TACTICAL ADVICE OR RECOVERY INSTRUCTIONS..."
                    value={physicalForm.directives}
                    onChange={(e) => setPhysicalForm({ ...physicalForm, directives: e.target.value })}
                    className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-3xl py-5 px-6 text-white text-xs font-bold focus:outline-none focus:border-[#22c55e] transition-all min-h-[120px] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#22c55e] text-black font-black uppercase tracking-[3px] py-6 rounded-[24px] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_15px_40px_rgba(34,197,94,0.3)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <ClipboardCheck size={24} />}
                  <span>{loading ? "SYNCING MATRIX..." : "COMMIT PHYSICAL LABS"}</span>
                </button>
              </form>
            ) : activeTab === 'MATCH' ? (
              <form onSubmit={handleMatchSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Opponent Unit</label>
                    <input
                      placeholder="EX: LIVERPOOL ACADEMY"
                      value={matchForm.opponent}
                      onChange={(e) => setMatchForm({ ...matchForm, opponent: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-display placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Goals</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={matchForm.goals}
                        onChange={(e) => setMatchForm({ ...matchForm, goals: e.target.value })}
                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 px-6 text-white text-center text-2xl font-display focus:border-[#22c55e] outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Assists</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={matchForm.assists}
                        onChange={(e) => setMatchForm({ ...matchForm, assists: e.target.value })}
                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 px-6 text-white text-center text-2xl font-display focus:border-[#22c55e] outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">xG</label>
                      <input
                        type="number" step="0.01"
                        placeholder="0.0"
                        value={matchForm.xg}
                        onChange={(e) => setMatchForm({ ...matchForm, xg: e.target.value })}
                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 px-6 text-white text-center text-2xl font-display focus:border-[#22c55e] outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'PASS %', value: matchForm.pass_accuracy, setter: (v: string) => setMatchForm({ ...matchForm, pass_accuracy: v }) },
                      { label: 'DUELS %', value: matchForm.duels_won, setter: (v: string) => setMatchForm({ ...matchForm, duels_won: v }) },
                      { label: 'PRESSURES', value: matchForm.pressures, setter: (v: string) => setMatchForm({ ...matchForm, pressures: v }) },
                      { label: 'DATE', value: matchForm.date, setter: (v: string) => setMatchForm({ ...matchForm, date: v }), type: 'date' },
                    ].map((f, i) => (
                      <div key={i} className="space-y-2">
                        <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">{f.label}</label>
                        <input
                          type={f.type || 'number'}
                          value={f.value}
                          onChange={(e) => f.setter(e.target.value)}
                          className={`w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 text-white text-center font-display focus:border-[#22c55e] outline-none ${f.type === 'date' ? 'text-[10px] font-sans font-bold px-2' : 'text-xl px-6'}`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* COACH DIRECTIVES (MATCH) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Match Feedback & Directives</label>
                    <textarea
                      placeholder="ENTER POST-MATCH ANALYSIS OR FOCUS AREAS..."
                      value={matchForm.directives}
                      onChange={(e) => setMatchForm({ ...matchForm, directives: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-3xl py-5 px-6 text-white text-xs font-bold focus:outline-none focus:border-[#22c55e] transition-all min-h-[120px] resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#22c55e] text-black font-black uppercase tracking-[3px] py-6 rounded-[24px] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_15px_40px_rgba(34,197,94,0.3)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <TrendingUp size={24} />}
                  <span>{loading ? "COMMITTING ANALYTICS..." : "COMMIT MATCH ANALYTICS"}</span>
                </button>
              </form>
            ) : activeTab === 'COGNITIVE' ? (
              <form onSubmit={handleCognitiveSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Reaction Time (ms)</label>
                      <input
                        type="number" placeholder="EX: 240"
                        value={cognitiveForm.reaction_time}
                        onChange={(e) => setCognitiveForm({ ...cognitiveForm, reaction_time: e.target.value })}
                        className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-display focus:outline-none focus:border-[#22c55e] transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Assessment Date</label>
                      <input
                        type="date"
                        value={cognitiveForm.date}
                        onChange={(e) => setCognitiveForm({ ...cognitiveForm, date: e.target.value })}
                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 px-6 text-white font-bold text-xs focus:border-[#22c55e] outline-none"
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase">Decision Score (0-10)</label>
                        <span className="text-white font-display text-xl">{cognitiveForm.decision_score}</span>
                      </div>
                      <input 
                        type="range" min="0" max="10" step="1"
                        value={cognitiveForm.decision_score}
                        onChange={(e) => setCognitiveForm({ ...cognitiveForm, decision_score: e.target.value })}
                        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#22c55e]"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase">Focus Score (%)</label>
                        <span className="text-white font-display text-xl">{cognitiveForm.focus_score}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="1"
                        value={cognitiveForm.focus_score}
                        onChange={(e) => setCognitiveForm({ ...cognitiveForm, focus_score: e.target.value })}
                        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#22c55e]"
                      />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Psychological Stress Level</label>
                    <div className="flex gap-4">
                      {['Low', 'Moderate', 'High', 'Critical'].map((lvl) => (
                        <button
                          key={lvl} type="button"
                          onClick={() => setCognitiveForm({ ...cognitiveForm, stress_level: lvl })}
                          className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            cognitiveForm.stress_level === lvl 
                              ? "bg-[#22c55e] text-black border-[#22c55e]" 
                              : "bg-white/5 text-white/40 border-white/5 hover:border-[#22c55e]/30"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                 </div>

                 <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#22c55e] text-black font-black uppercase tracking-[3px] py-6 rounded-[24px] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_15px_40px_rgba(34,197,94,0.3)] disabled:opacity-50"
                 >
                   {loading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                   <span>{loading ? "SYNCING COGNITIVE HUB..." : "COMMIT COGNITIVE LABS"}</span>
                 </button>
              </form>
            ) : (
              <form onSubmit={handleProgramSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                 <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Active Program Title</label>
                      <input
                        placeholder="EX: ELITE STRIDE MECHANICS"
                        value={programForm.title}
                        onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                        className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-display focus:outline-none focus:border-[#22c55e] transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Training Phase</label>
                        <select 
                          value={programForm.phase}
                          onChange={(e) => setProgramForm({ ...programForm, phase: e.target.value })}
                          className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 px-6 text-white font-bold text-xs focus:border-[#22c55e] outline-none uppercase"
                        >
                          <option value="Tactical">Tactical</option>
                          <option value="Strength">Strength</option>
                          <option value="Recovery">Recovery</option>
                          <option value="Conditioning">Conditioning</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Effective Date</label>
                        <input
                          type="date"
                          value={programForm.date}
                          onChange={(e) => setProgramForm({ ...programForm, date: e.target.value })}
                          className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 px-6 text-white font-bold text-xs focus:border-[#22c55e] outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Strategic Program Notes</label>
                      <textarea
                        placeholder="ENTER DETAILED INSTRUCTIONS FOR THIS TRAINING PHASE..."
                        value={programForm.notes}
                        onChange={(e) => setProgramForm({ ...programForm, notes: e.target.value })}
                        className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-3xl py-5 px-6 text-white text-xs font-bold focus:outline-none focus:border-[#22c55e] transition-all min-h-[150px] resize-none"
                      />
                    </div>
                 </div>

                 <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#22c55e] text-black font-black uppercase tracking-[3px] py-6 rounded-[24px] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_15px_40px_rgba(34,197,94,0.3)] disabled:opacity-50"
                 >
                   {loading ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
                   <span>{loading ? "ASSIGNING PROGRAM..." : "INITIALIZE ELITE PROGRAM"}</span>
                 </button>
              </form>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-red-500/10 border-2 border-red-500/30 rounded-3xl text-red-500 text-[11px] font-black uppercase tracking-[2px] text-center flex items-center justify-center gap-3"
              >
                <ShieldCheck size={18} /> CRITICAL ERROR: {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-[#22c55e]/10 border-2 border-[#22c55e]/30 rounded-3xl text-[#22c55e] text-[11px] font-black uppercase tracking-[2px] text-center flex items-center justify-center gap-3"
              >
                <ClipboardCheck size={18} /> ASSESSMENT COMMITTED SUCCESSFULLY
              </motion.div>
            )}

            {isFetching && (
               <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center rounded-[40px]">
                  <div className="flex flex-col items-center gap-4">
                     <Loader2 className="animate-spin text-[#22c55e]" size={40} />
                     <span className="text-[#22c55e] text-[10px] font-black uppercase tracking-[4px]">Syncing Current Matrix...</span>
                  </div>
               </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
