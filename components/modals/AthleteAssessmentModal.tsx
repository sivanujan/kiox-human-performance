"use client";

import { useState } from "react";
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
import { Anton } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"] });

interface AthleteAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

export default function AthleteAssessmentModal({ isOpen, onClose, athleteId, athleteName }: AthleteAssessmentModalProps) {
  const [activeTab, setActiveTab] = useState<'PHYSICAL' | 'MATCH'>('PHYSICAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [physicalForm, setPhysicalForm] = useState({
    top_speed: "",
    distance: "",
    sprints: "",
    power: "",
    vo2_max: "",
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
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onClose();
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
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to commit match stats.");
    } finally {
      setLoading(false);
    }
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
              <h2 className={`${anton.className} text-3xl text-white tracking-wider uppercase`}>
                INITIATE ASSESSMENT
              </h2>
              <div className="mt-2 flex items-center gap-3">
                 <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">SUBJ:</span>
                 <span className="text-white font-bold text-xs uppercase tracking-wide px-3 py-1 bg-white/5 rounded-full border border-white/5">{athleteName}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-4 rounded-full bg-white/5 text-white/30 hover:text-white transition-all self-end md:self-auto">
              <X size={24} />
            </button>
          </div>

          <div className="p-10">
            {/* Tab Selector */}
            <div className="flex gap-2 mb-10 bg-black/40 border border-white/5 p-1.5 rounded-3xl w-fit">
              <button 
                onClick={() => setActiveTab('PHYSICAL')}
                className={`px-8 py-3 rounded-2xl text-[10px] font-['Anton'] tracking-[2px] uppercase transition-all flex items-center gap-3 ${
                  activeTab === 'PHYSICAL' 
                    ? "bg-[#22c55e] text-black shadow-[0_5px_20px_rgba(34,197,94,0.3)]" 
                    : "text-white/30 hover:text-white hover:bg-white/5"
                }`}
              >
                <Activity size={14} /> PHYSICAL LABS
              </button>
              <button 
                onClick={() => setActiveTab('MATCH')}
                className={`px-8 py-3 rounded-2xl text-[10px] font-['Anton'] tracking-[2px] uppercase transition-all flex items-center gap-3 ${
                  activeTab === 'MATCH' 
                    ? "bg-[#22c55e] text-black shadow-[0_5px_20px_rgba(34,197,94,0.3)]" 
                    : "text-white/30 hover:text-white hover:bg-white/5"
                }`}
              >
                <Target size={14} /> MATCH ANALYTICS
              </button>
            </div>

            {activeTab === 'PHYSICAL' ? (
              <form onSubmit={handlePhysicalSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Top Speed (km/h)</label>
                    <input
                      type="number" step="0.1"
                      placeholder="EX: 34.5"
                      value={physicalForm.top_speed}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, top_speed: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-['Anton'] placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Distance (km)</label>
                    <input
                      type="number" step="0.1"
                      placeholder="EX: 12.4"
                      value={physicalForm.distance}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, distance: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-['Anton'] placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Sprints</label>
                    <input
                      type="number"
                      placeholder="EX: 28"
                      value={physicalForm.sprints}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, sprints: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-['Anton'] placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Power (Watts)</label>
                    <input
                      type="number"
                      placeholder="EX: 850"
                      value={physicalForm.power}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, power: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-['Anton'] placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">VO2 Max</label>
                    <input
                      type="number" step="0.1"
                      placeholder="EX: 62.1"
                      value={physicalForm.vo2_max}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, vo2_max: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-['Anton'] placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#22c55e] text-black font-black uppercase tracking-[3px] py-6 rounded-[24px] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_15px_40px_rgba(34,197,94,0.3)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <ClipboardCheck size={24} />}
                  <span>{loading ? "SYNCING MATRIX..." : "COMMIT PHYSICAL LABS"}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleMatchSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Opponent Unit</label>
                    <input
                      placeholder="EX: LIVERPOOL ACADEMY"
                      value={matchForm.opponent}
                      onChange={(e) => setMatchForm({ ...matchForm, opponent: e.target.value })}
                      className="w-full bg-black/40 border-2 border-white/5 hover:border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white text-lg font-['Anton'] placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
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
                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 px-6 text-white text-center text-2xl font-['Anton'] focus:border-[#22c55e] outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Assists</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={matchForm.assists}
                        onChange={(e) => setMatchForm({ ...matchForm, assists: e.target.value })}
                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 px-6 text-white text-center text-2xl font-['Anton'] focus:border-[#22c55e] outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">xG</label>
                      <input
                        type="number" step="0.01"
                        placeholder="0.0"
                        value={matchForm.xg}
                        onChange={(e) => setMatchForm({ ...matchForm, xg: e.target.value })}
                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 px-6 text-white text-center text-2xl font-['Anton'] focus:border-[#22c55e] outline-none"
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
                          className={`w-full bg-black/40 border-2 border-white/5 rounded-2xl py-5 text-white text-center font-['Anton'] focus:border-[#22c55e] outline-none ${f.type === 'date' ? 'text-[10px] font-sans font-bold px-2' : 'text-xl px-6'}`}
                        />
                      </div>
                    ))}
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
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
