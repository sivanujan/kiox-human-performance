"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Save, Loader2, Minus, Plus, Users, Activity, TrendingDown, TrendingUp } from "lucide-react";
import { Anton } from "next/font/google";
import { useSessions, TrainingSession } from "@/hooks/useSessions";
import { createPortal } from "react-dom";

const anton = Anton({ weight: "400", subsets: ["latin"] });

interface AdjustLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: TrainingSession[];
  athletes: any[];
}

export default function AdjustLoadModal({ isOpen, onClose, sessions, athletes }: AdjustLoadModalProps) {
  const { loading } = useSessions();
  const [mounted, setMounted] = useState(false);
  const [sessionTargets, setSessionTargets] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const targets: Record<string, number> = {};
      sessions.forEach(s => {
        targets[s.id] = s.target_load_au || 450;
      });
      setSessionTargets(targets);
    }
  }, [isOpen, sessions]);

  if (!mounted || !isOpen) return null;

  const handleAdjust = (sid: string, delta: number) => {
    setSessionTargets(prev => ({
      ...prev,
      [sid]: Math.max(0, (prev[sid] || 0) + delta)
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
          className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-10 border-b border-white/5 bg-gradient-to-r from-blue-500/[0.05] to-transparent flex justify-between items-center">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[24px] bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                   <Target size={32} />
                </div>
                <div>
                   <div className="text-blue-500 text-[10px] font-black tracking-[5px] uppercase mb-1">Operational Optimization</div>
                   <h2 className={`${anton.className} text-4xl text-white tracking-wider uppercase`}>Intensity Calibration</h2>
                </div>
             </div>
             <button onClick={onClose} className="p-5 rounded-full bg-white/5 text-white/30 hover:text-white transition-all">
                <X size={28} />
             </button>
          </div>

          <div className="p-10">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left: Global Metrics */}
                <div className="lg:col-span-1 space-y-6">
                   <div className="p-8 bg-black/40 border border-white/5 rounded-3xl">
                      <div className="text-white/20 text-[10px] font-black tracking-widest uppercase mb-4">SQUAD AVG LOAD</div>
                      <div className="text-5xl font-['Anton'] text-white">542 <span className="text-xl text-white/20">AU</span></div>
                      <div className="flex items-center gap-2 mt-4 text-[#22c55e] text-[9px] font-black uppercase tracking-widest">
                         <TrendingDown size={12} /> -12% vs last cycle
                      </div>
                   </div>

                   <div className="p-8 bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-3xl">
                      <div className="text-[#22c55e] text-[10px] font-black tracking-widest uppercase mb-4">OPTIMIZATION RANGE</div>
                      <div className="text-2xl font-['Anton'] text-white">500 - 650 <span className="text-sm text-[#22c55e]">AU</span></div>
                      <div className="h-2 w-full bg-white/5 rounded-full mt-4 relative overflow-hidden">
                         <div className="absolute top-0 left-1/4 right-3/4 h-full bg-[#22c55e]" />
                      </div>
                   </div>
                </div>

                {/* Right: Session Adjustments */}
                <div className="lg:col-span-2 space-y-6">
                   <div className="text-white/20 text-[10px] font-black tracking-widest uppercase ml-1 flex items-center gap-2">
                      <Activity size={12} /> ACTIVE SQUAD OPS CALIBRATION
                   </div>

                   <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                      {sessions.length === 0 ? (
                        <div className="py-20 text-center border border-white/5 rounded-3xl bg-white/[0.01]">
                           <span className="text-white/10 text-[10px] font-black tracking-[0.3em] uppercase">No sessions to calibrate</span>
                        </div>
                      ) : sessions.map((s) => (
                        <div key={s.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl border-l-[6px] border-l-blue-500/40 group hover:bg-white/[0.05] transition-all">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <h4 className="text-white font-['Anton'] text-lg tracking-wider uppercase mb-1">{s.title}</h4>
                                 <div className="text-white/20 text-[9px] font-black uppercase tracking-widest">{s.session_type} // TARGET SET POINT</div>
                              </div>
                              <div className="text-right">
                                 <div className="text-2xl font-['Anton'] text-blue-400">{sessionTargets[s.id] || 0} AU</div>
                              </div>
                           </div>

                           <div className="flex items-center gap-4">
                              <button 
                                onClick={() => handleAdjust(s.id, -25)}
                                className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white hover:text-black transition-all"
                              >
                                 <Minus size={20} />
                              </button>
                              
                              <div className="flex-1 px-4">
                                 <input 
                                   type="range"
                                   min="0"
                                   max="1000"
                                   step="25"
                                   value={sessionTargets[s.id] || 0}
                                   onChange={e => handleAdjust(s.id, parseInt(e.target.value) - (sessionTargets[s.id] || 0))}
                                   className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                                 />
                              </div>

                              <button 
                                onClick={() => handleAdjust(s.id, 25)}
                                className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white hover:text-black transition-all"
                              >
                                 <Plus size={20} />
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>

                   <button 
                     disabled={loading}
                     className="w-full bg-blue-500 text-black py-5 rounded-2xl font-['Anton'] text-sm tracking-[0.2em] hover:bg-white transition-all uppercase shadow-2xl flex items-center justify-center gap-3 mt-4"
                   >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      APPLY CALIBRATED TARGETS
                   </button>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
