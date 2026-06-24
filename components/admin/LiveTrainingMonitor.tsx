"use client";

import { useLiveMonitor, LiveAthleteMetric } from "@/hooks/useLiveMonitor";
import { Activity, Zap, Users, ArrowRight, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/ui/Avatar";
import { SkeletonRow } from "@/components/ui/Skeleton";

export default function LiveTrainingMonitor() {
  const { athletes, loading } = useLiveMonitor();

  return (
    <div className="w-full bg-bg-card border border-border-card rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-2xl relative overflow-hidden group">
      {/* Background Pulse Effect */}
      <div className="absolute top-0 right-0 p-8 md:p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Activity className="w-[120px] h-[120px] md:w-[160px] md:h-[160px] text-accent-green" />
      </div>

      <div className="flex flex-row items-center gap-4 mb-8 md:mb-10 relative z-10">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center text-accent-green shrink-0">
          <Zap className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-accent-green font-display text-[9px] md:text-[10px] tracking-[0.3em] uppercase">Live Monitor</div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <h2 className="text-text-primary font-display text-lg md:text-xl tracking-wider uppercase">Live Session Monitor</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-bg-input border border-accent-green/20 rounded-full shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse shadow-[0_0_10px_var(--accent-green)]" />
              <span className="text-[8px] font-black text-accent-green tracking-widest">REAL-TIME</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`space-y-4 mb-6 relative z-10 ${athletes.length === 0 ? '' : 'min-h-[300px]'}`}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : athletes.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-center">
            <Activity className="text-text-muted animate-pulse" size={24} />
            <div className="text-text-muted text-xs font-mono tracking-wider">
              No active training sessions
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

      <button className="relative z-10 w-full bg-transparent border-2 border-accent-green/20 text-accent-green py-4 rounded-2xl font-display text-xs tracking-[0.2em] hover:bg-accent-green hover:text-text-on-green hover:border-accent-green transition-all uppercase flex items-center justify-center gap-3 group/btn">
        VIEW ALL LIVE SESSIONS 
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
      className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-bg-card border border-border-card p-4 md:p-5 rounded-2xl md:rounded-3xl hover:border-accent-green/30 transition-all group/item active-scale sm:active-scale-none"
    >
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <Avatar 
          src={athlete.avatar_url}
          name={`${athlete.first_name} ${athlete.last_name}`}
          size="md"
        />
        <div className="min-w-0">
          <div className="text-text-primary font-bold text-sm md:text-md uppercase tracking-wide truncate">
            {athlete.first_name} {athlete.last_name[0]}.
          </div>
          <div className="text-text-muted text-[8px] md:text-[9px] font-black uppercase tracking-widest mt-1">SENSOR: {athlete.athlete_id.slice(0, 8)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end flex-1 gap-4 md:gap-8">
        {/* Sparkline - Show on SM+ */}
        <div className="hidden sm:block w-20 md:w-24 h-8 shrink-0">
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

        <div className="flex items-center gap-6 md:gap-8 shrink-0 ml-auto sm:ml-0">
          <div className="text-right">
            <div className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-0.5 md:mb-1">SPEED</div>
            <div className="flex items-baseline gap-1">
              <span className="text-text-primary font-display text-lg md:text-xl">{athlete.speed.toFixed(1)}</span>
              <span className="text-text-secondary text-[7px] md:text-[8px] font-bold">KM/H</span>
            </div>
          </div>

          <div className="text-right min-w-[70px] md:min-w-[80px]">
            <div className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-0.5 md:mb-1 flex items-center justify-end gap-1">
              <Heart size={10} className={athlete.heart_rate > 170 ? "animate-pulse text-red-500" : ""} /> HR
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span 
                key={athlete.heart_rate}
                initial={{ scale: 1.2, color: "#fff" }}
                animate={{ scale: 1, color: hrColor }}
                className="font-display text-xl md:text-2xl"
              >
                {athlete.heart_rate}
              </motion.span>
              <span className="text-text-secondary text-[7px] md:text-[8px] font-bold">BPM</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
