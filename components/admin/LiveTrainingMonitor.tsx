"use client";

import { useLiveMonitor, LiveAthleteMetric } from "@/hooks/useLiveMonitor";
import { Activity, Zap, Users, ArrowRight, Loader2, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/ui/Avatar";

export default function LiveTrainingMonitor() {
  const { athletes, loading } = useLiveMonitor();

  return (
    <div className="bg-[#0a0a0a] border border-[#22c55e]/15 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
      {/* Background Pulse Effect */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Activity size={160} className="text-[#22c55e]" />
      </div>

      <div className="flex justify-between items-center mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e]">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <div className="text-[#22c55e] font-['Anton'] text-[10px] tracking-[0.3em] uppercase">Tactical Telemetry</div>
            <h2 className="text-white font-['Anton'] text-xl tracking-wider uppercase">Live Training Monitor</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-black border border-[#22c55e]/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_10px_#22c55e]" />
            <span className="text-[10px] font-black text-[#22c55e] tracking-widest">REAL-TIME</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-10 relative z-10 min-h-[300px]">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="text-[#22c55e] animate-spin" size={32} />
            <div className="text-white/20 text-[10px] font-black uppercase tracking-widest">Establishing Sensor Link...</div>
          </div>
        ) : athletes.length === 0 ? (
          <div className="py-24 text-center">
            <div className="text-white/5 font-['Anton'] text-5xl mb-4">INACTIVE</div>
            <div className="text-white/10 uppercase font-black text-[10px] tracking-[0.4em]">
              NO ACTIVE TRAINING SESSIONS DETECTED
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {athletes.map((athlete) => (
              <LiveAthleteRow key={athlete.athlete_id} athlete={athlete} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <button className="relative z-10 w-full bg-transparent border-2 border-[#22c55e]/20 text-[#22c55e] py-4 rounded-2xl font-['Anton'] text-xs tracking-[0.2em] hover:bg-[#22c55e] hover:text-black hover:border-[#22c55e] transition-all uppercase flex items-center justify-center gap-3 group/btn">
        VIEW FULL TELEMETRY GRID 
        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

function LiveAthleteRow({ athlete }: { athlete: LiveAthleteMetric }) {
  const hrColor = athlete.heart_rate >= 180 ? "#ef4444" : athlete.heart_rate >= 160 ? "#f59e0b" : "#00ff88";

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-6 bg-black/40 border border-white/5 p-5 rounded-3xl hover:border-[#22c55e]/30 transition-all group/item"
    >
      <div className="shrink-0">
        <Avatar 
          src={athlete.avatar_url}
          name={`${athlete.first_name} ${athlete.last_name}`}
          size="md"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-white font-bold text-sm uppercase tracking-wide truncate">
          {athlete.first_name} {athlete.last_name[0]}.
        </div>
        <div className="text-white/20 text-[9px] font-black uppercase tracking-widest mt-1">SENSOR_ID: {athlete.athlete_id.slice(0, 8)}</div>
      </div>

      {/* Sparkline */}
      <div className="hidden xl:block w-24 h-8 shrink-0">
         <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
            <path
              d={`M ${athlete.hr_history.map((val, i) => `${(i / 9) * 100},${40 - ((val - 60) / 140) * 40}`).join(' L ')}`}
              fill="none"
              stroke={hrColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500"
            />
         </svg>
      </div>

      <div className="flex items-center gap-8 shrink-0">
        <div className="text-right">
          <div className="text-xs font-black uppercase tracking-widest text-white/20 mb-1">SPEED</div>
          <div className="flex items-baseline gap-1">
            <span className="text-white font-['Anton'] text-xl">{athlete.speed.toFixed(1)}</span>
            <span className="text-white/40 text-[8px] font-bold">KM/H</span>
          </div>
        </div>

        <div className="text-right min-w-[80px]">
          <div className="text-xs font-black uppercase tracking-widest text-white/20 mb-1 flex items-center justify-end gap-1">
            <Heart size={10} className={athlete.heart_rate > 170 ? "animate-pulse text-red-500" : ""} /> HR
          </div>
          <div className="flex items-baseline gap-1">
            <motion.span 
              key={athlete.heart_rate}
              initial={{ scale: 1.2, color: "#fff" }}
              animate={{ scale: 1, color: hrColor }}
              className="font-['Anton'] text-2xl"
            >
              {athlete.heart_rate}
            </motion.span>
            <span className="text-white/40 text-[8px] font-bold">BPM</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
