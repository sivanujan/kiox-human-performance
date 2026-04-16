"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Activity, 
  Moon, 
  Droplets, 
  Smile, 
  Brain, 
  Save, 
  Loader2,
  Heart,
  TrendingDown,
  ChevronRight
} from "lucide-react";
import { createPortal } from "react-dom";
import { Orbitron, Anton } from "next/font/google";

const orbitron = Orbitron({ subsets: ["latin"] });
const anton = Anton({ weight: "400", subsets: ["latin"] });

interface WellnessCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  onSuccess: () => void;
}

export default function WellnessCheckinModal({ isOpen, onClose, athleteId, onSuccess }: WellnessCheckinModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    sleep_score: 7,
    soreness_score: 3,
    hydration_status: 'optimal',
    mood: 'Good',
    stress_level: 'low',
    hrv_ms: 65,
    resting_hr_bpm: 60
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/athlete/${athleteId}/wellness/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        alert(`System Error: ${errorData.error}\nDetails: ${errorData.details}\n${errorData.hint || ''}`);
      }
    } catch (error: any) {
      console.error("Check-in failed:", error);
      alert("Network Error: Could not connect to the matrix server.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[#22c55e]/20 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.1)]"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#22c55e]/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center">
                <Activity className="text-[#22c55e]" size={24} />
              </div>
              <div>
                <div className="text-[#22c55e] text-[10px] font-['Anton'] tracking-[0.3em] uppercase">SYSTEM_CHECK_01</div>
                <h3 className={`${anton.className} text-2xl text-white tracking-wider uppercase`}>Daily Protocol Initialization</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* STEP 1: CORE BIOMETRICS */}
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Sleep Score */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <Moon size={14} className="text-blue-500" /> Sleep Quality
                        </label>
                        <span className="text-[#22c55e] font-['Anton'] text-lg">{formData.sleep_score}/10</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={formData.sleep_score}
                        onChange={(e) => setFormData({...formData, sleep_score: parseInt(e.target.value)})}
                        className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#22c55e]"
                      />
                      <div className="flex justify-between text-[8px] font-bold text-white/10 uppercase tracking-widest">
                        <span>Restless</span>
                        <span>Optimal</span>
                      </div>
                    </div>

                    {/* Soreness Score */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <TrendingDown size={14} className="text-amber-500" /> Physical Soreness
                        </label>
                        <span className="text-amber-500 font-['Anton'] text-lg">{formData.soreness_score}/10</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={formData.soreness_score}
                        onChange={(e) => setFormData({...formData, soreness_score: parseInt(e.target.value)})}
                        className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-[8px] font-bold text-white/10 uppercase tracking-widest">
                        <span>No Pain</span>
                        <span>Acute Fatigue</span>
                      </div>
                    </div>
                  </div>

                  {/* Hydration & Mood */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                        <Droplets size={14} className="text-cyan-500" /> Hydration Baseline
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['low', 'optimal', 'high'].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setFormData({...formData, hydration_status: h})}
                            className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${
                              formData.hydration_status === h 
                              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' 
                              : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                        <Smile size={14} className="text-purple-500" /> Psychological Baseline
                      </label>
                      <select 
                        value={formData.mood}
                        onChange={(e) => setFormData({...formData, mood: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white uppercase font-bold focus:border-purple-500/50 outline-none"
                      >
                        <option value="Excellent">Optimal / Elite</option>
                        <option value="Good">Good / Stable</option>
                        <option value="Neutral">Neutral / Average</option>
                        <option value="Fatigued">Fatigued / Low</option>
                        <option value="Poor">Poor / Critical</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all group"
                  >
                    Next Protocol Step <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}

              {/* STEP 2: VITAL READINGS */}
              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* HRV */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <Brain size={14} className="text-[#22c55e]" /> HRV (ms)
                        </label>
                        <input 
                          type="number"
                          value={formData.hrv_ms || ''}
                          onChange={(e) => setFormData({...formData, hrv_ms: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 font-['Anton'] text-2xl text-[#22c55e] outline-none focus:border-[#22c55e]/50"
                        />
                      </div>

                      {/* Resting HR */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <Heart size={14} className="text-red-500" /> Resting HR (BPM)
                        </label>
                        <input 
                          type="number"
                          value={formData.resting_hr_bpm || ''}
                          onChange={(e) => setFormData({...formData, resting_hr_bpm: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 font-['Anton'] text-2xl text-red-500 outline-none focus:border-red-500/50"
                        />
                      </div>
                   </div>

                   <div className="bg-[#22c55e]/5 border border-[#22c55e]/10 p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2 text-[#22c55e] text-[9px] font-black uppercase tracking-widest">
                        <Activity size={12} /> System Synchronization
                      </div>
                      <p className="text-white/40 text-[10px] leading-relaxed italic"> 
                        This data will be used to calibrate your readiness baseline and calculate current recovery capacity.
                      </p>
                   </div>

                   <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white/60 uppercase tracking-widest transition-all"
                      >
                        Previous
                      </button>
                      <button
                        disabled={loading}
                        className="flex-[2] py-4 bg-[#22c55e] hover:bg-white text-black rounded-2xl font-['Anton'] text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(34,197,94,0.3)]"
                      >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Confirm Daily Baseline
                      </button>
                   </div>
                </motion.div>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
