"use client";

import { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  Plus, 
  Activity, 
  MapPin, 
  Play, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle,
  Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSessions, TrainingSession } from "@/hooks/useSessions";
import { format } from "date-fns";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { createClient } from "@/utils/supabase/client";

interface TrainingSessionControlProps {
  onViewDetails: (session: TrainingSession) => void;
  onAdjustLoad: () => void;
  onCreate: () => void;
  isSuperAdmin?: boolean;
}

export default function TrainingSessionControl({ onViewDetails, onAdjustLoad, onCreate, isSuperAdmin = false }: TrainingSessionControlProps) {
  const { updateSessionStatus } = useSessions();
  const supabase = createClient();

  const [viewMode, setViewMode] = useState<"today" | "last-week-scheduled" | "last-week-curriculum">("today");
  const [localSessions, setLocalSessions] = useState<TrainingSession[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Real-time counts for active visual tabs
  const [counts, setCounts] = useState({ today: 0, scheduled: 0, curriculum: 0 });

  const fetchCounts = async () => {
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = format(oneWeekAgo, "yyyy-MM-dd");
      
      const [todayRes, scheduledRes, curriculumRes] = await Promise.all([
        supabase.from("training_sessions").select("id", { count: 'exact', head: true }).eq("scheduled_date", todayStr),
        supabase.from("training_sessions").select("id", { count: 'exact', head: true }).eq("is_curriculum", false).gte("scheduled_date", oneWeekAgoStr).lte("scheduled_date", todayStr),
        supabase.from("training_sessions").select("id", { count: 'exact', head: true }).eq("is_curriculum", true).gte("scheduled_date", oneWeekAgoStr).lte("scheduled_date", todayStr)
      ]);

      setCounts({
        today: todayRes.count || 0,
        scheduled: scheduledRes.count || 0,
        curriculum: curriculumRes.count || 0
      });
    } catch (e) {
      console.error("Failed to fetch counts:", e);
    }
  };

  const fetchLocalSessions = async () => {
    setLocalLoading(true);
    setErrorMsg(null);
    try {
      if (viewMode === "today") {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const { data, error } = await supabase
          .from("training_sessions")
          .select("*")
          .eq("scheduled_date", todayStr)
          .order("start_time", { ascending: true });

        if (error) {
          setErrorMsg(error.message);
        } else if (data) {
          setLocalSessions(data);
        }
      } else {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = format(oneWeekAgo, "yyyy-MM-dd");
        
        const today = new Date();
        const todayStr = format(today, "yyyy-MM-dd");

        const { data, error } = await supabase
          .from("training_sessions")
          .select("*")
          .eq("is_curriculum", viewMode === "last-week-curriculum")
          .gte("scheduled_date", oneWeekAgoStr)
          .lte("scheduled_date", todayStr)
          .order("scheduled_date", { ascending: false })
          .order("start_time", { ascending: true });

        if (error) {
          setErrorMsg(error.message);
        } else if (data) {
          // Filter out dummy integration test sessions
          const filtered = data.filter((s: any) => {
            const title = (s.title || "").toLowerCase();
            return !title.includes("integration test") && !title.includes("next.js app");
          });
          setLocalSessions(filtered);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || String(err));
    } finally {
      setLocalLoading(false);
      fetchCounts(); // Refresh count indicators in parallel
    }
  };

  useEffect(() => {
    fetchLocalSessions();
  }, [viewMode]);

  const handleUpdateStatus = async (sessionId: string, status: TrainingSession['status']) => {
    setLocalLoading(true);
    const res = await updateSessionStatus(sessionId, status);
    if (res.success) {
      setLocalSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status } : s));
      fetchCounts();
    }
    setLocalLoading(false);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return {
          borderClass: "border-l-4 border-l-[#00ff88]",
          bgClass: "bg-[#00ff88]/[0.03] border border-[#00ff88]/20 shadow-[0_0_20px_rgba(0,255,136,0.08)] hover:bg-[#00ff88]/[0.05]",
          badgeClass: "bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30 animate-pulse font-mono",
          iconColor: "text-[#00ff88]",
          glowDot: true,
        };
      case 'SCHEDULED':
        return {
          borderClass: "border-l-4 border-l-cyan-500",
          bgClass: "bg-cyan-500/[0.02] border border-cyan-500/10 hover:border-cyan-500/20 hover:bg-cyan-500/[0.04]",
          badgeClass: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 font-mono",
          iconColor: "text-cyan-400",
          glowDot: false,
        };
      case 'COMPLETED':
        return {
          borderClass: "border-l-4 border-l-slate-600",
          bgClass: "bg-slate-900/[0.15] border border-border-card/60 opacity-60 hover:opacity-90 hover:bg-white/[0.01]",
          badgeClass: "bg-slate-800 text-text-secondary border border-border-input font-mono",
          iconColor: "text-slate-400",
          glowDot: false,
        };
      case 'CANCELLED':
      case 'MISSED':
        return {
          borderClass: "border-l-4 border-l-rose-500",
          bgClass: "bg-rose-500/[0.02] border border-rose-500/10 hover:border-rose-500/20 hover:bg-rose-500/[0.04]",
          badgeClass: "bg-rose-500/15 text-rose-400 border border-rose-500/25 font-mono",
          iconColor: "text-rose-400",
          glowDot: false,
        };
      default: // e.g. STANDBY
        return {
          borderClass: "border-l-4 border-l-amber-500",
          bgClass: "bg-amber-500/[0.02] border border-amber-500/10 hover:border-amber-500/20 hover:bg-amber-500/[0.04]",
          badgeClass: "bg-amber-500/15 text-amber-400 border border-amber-500/25 font-mono",
          iconColor: "text-amber-400",
          glowDot: false,
        };
    }
  };

  const renderSessionCard = (session: any, isMock = false) => {
    const status = session.status || 'SCHEDULED';
    const styles = getStatusStyles(status);
    const isInProgress = status === "IN_PROGRESS";

    return (
      <motion.div 
        key={session.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-[20px] transition-all group/item flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 ${styles.borderClass} ${styles.bgClass}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[8px] tracking-widest font-black uppercase ${styles.badgeClass}`}>
              {status}
            </span>
            <div className="flex items-center gap-1.5 text-text-muted text-[10px] font-semibold tracking-wider">
              <Clock size={11} className={styles.iconColor} />
              <span>
                {viewMode !== "today" && session.scheduled_date ? `[${session.scheduled_date}] ` : ""}
                {session.start_time ? session.start_time.slice(0, 5) : "TBD"}
              </span>
            </div>
            {styles.glowDot && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
              </span>
            )}
          </div>

          <h4 className={`text-text-primary font-display font-bold uppercase tracking-wide truncate ${isInProgress ? 'text-base md:text-lg text-[#00ff88]' : 'text-sm'}`} title={session.title}>
            {session.title}
          </h4>

          <div className="flex items-center gap-4 text-text-secondary text-[10px] font-bold tracking-widest uppercase mt-1.5">
            <div className="flex items-center gap-1.5"><MapPin size={11} className="opacity-60 text-text-muted" /> {session.location || 'HQ FIELD'}</div>
            <div className="flex items-center gap-1.5"><Activity size={11} className="opacity-60 text-text-muted" /> {session.duration_minutes} MIN</div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          {session.status === 'SCHEDULED' && !isMock && viewMode === 'today' && (
            <button 
              onClick={() => handleUpdateStatus(session.id, 'IN_PROGRESS')}
              className="h-10 px-5 bg-[#00ff88] hover:bg-[#00d070] text-black rounded-xl font-display text-[9px] tracking-widest uppercase font-black transition-all shadow-[0_4px_12px_rgba(0,255,136,0.15)] flex items-center gap-1.5 active-scale"
            >
              <Play size={10} fill="currentColor" /> Start
            </button>
          )}
          {session.status === 'STANDBY' && isMock && (
            <button 
              onClick={onCreate}
              className="h-10 px-5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-display text-[9px] tracking-widest uppercase font-black transition-all shadow-[0_4px_12px_rgba(245,158,11,0.15)] flex items-center gap-1.5 active-scale"
            >
              <Play size={10} fill="currentColor" /> Activate
            </button>
          )}
          <button 
            onClick={() => onViewDetails(session)}
            className="h-10 w-10 rounded-xl bg-bg-input border border-border-input flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-card-hover hover:border-border-active transition-all active-scale"
            title="View details & logs"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full bg-bg-card border border-border-card rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-2xl relative overflow-hidden group">
      {/* Static Background Decoration */}
      <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Calendar size={140} className="text-text-primary" />
      </div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bg-input border border-border-input flex items-center justify-center text-accent-green">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-accent-green font-display text-[10px] tracking-[0.3em] uppercase">Operational Control</div>
            <h2 className="text-text-primary font-display text-xl tracking-wider uppercase">Training Session Control</h2>
          </div>
        </div>
        <div className="text-right">
          <div className="text-text-muted font-black text-[10px] tracking-widest uppercase mb-1">CURRENT OPS DATE</div>
          <div className="text-text-primary font-display text-lg tracking-widest">{format(new Date(), "MMMM dd, yyyy").toUpperCase()}</div>
        </div>
      </div>

      {/* Segmented Tab Navigator with Active Indicators */}
      <div className="flex border-b border-border-card mb-8 relative z-10">
        {[
          { id: "today" as const, label: "Today", count: counts.today },
          { id: "last-week-scheduled" as const, label: "Past Week (Schedule)", count: counts.scheduled },
          { id: "last-week-curriculum" as const, label: "Past Week (Curriculum)", count: counts.curriculum },
        ].map((tab) => {
          const isActive = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setViewMode(tab.id)}
              className="flex-1 pb-3.5 text-center relative font-sans text-xs md:text-sm tracking-wide transition-all flex items-center justify-center gap-2 font-bold cursor-pointer"
            >
              <span className={isActive ? "text-[#00ff88] drop-shadow-[0_0_8px_rgba(0,255,136,0.3)] font-black" : "text-text-secondary hover:text-text-primary"}>
                {tab.label}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-colors ${
                isActive 
                  ? "bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/20" 
                  : "bg-bg-input text-text-muted border border-border-input"
              }`}>
                {tab.count}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeControlTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00ff88]" 
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 mb-10 relative z-10 min-h-[300px]">
        {localLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : errorMsg ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle size={16} />
            <span>Error: {errorMsg}</span>
          </div>
        ) : localSessions.length === 0 ? (
          viewMode === "today" ? (
            <div className="space-y-4">
              <div className="p-3 px-4 bg-bg-input border border-border-input rounded-2xl text-accent-green text-[10px] font-mono tracking-wider flex items-center gap-2.5">
                 <AlertCircle size={12} className="text-accent-green flex-shrink-0" />
                 <span>Tip: Showing standby training protocols. Click "ACTIVATE SESSION" or "CREATE NEW SESSION" to schedule custom ops.</span>
              </div>
              
              {[
                {
                  id: "mock-1",
                  title: "NEUROMUSCULAR STRENGTH PROTOCOL",
                  session_type: "STRENGTH",
                  status: "STANDBY",
                  start_time: "09:00:00",
                  location: "PERFORMANCE GYM",
                  duration_minutes: 90
                },
                {
                  id: "mock-2",
                  title: "AEROBIC CONDITIONING SYSTEM",
                  session_type: "CONDITIONING",
                  status: "STANDBY",
                  start_time: "14:30:00",
                  location: "HQ FIELD B",
                  duration_minutes: 45
                }
              ].map((session) => renderSessionCard(session, true))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 flex flex-col items-center justify-center gap-4 text-center border border-dashed border-border-input rounded-3xl p-8 bg-white/[0.01]"
            >
              <div className="w-12 h-12 rounded-2xl bg-bg-input border border-border-input flex items-center justify-center text-text-muted">
                <Inbox size={20} />
              </div>
              <div>
                <h4 className="text-text-primary font-bold text-sm tracking-wide uppercase">No Historical Sessions</h4>
                <p className="text-text-secondary text-[10px] font-semibold tracking-wider mt-1 uppercase max-w-xs mx-auto">
                  {viewMode === "last-week-scheduled" 
                    ? "No scheduled training sessions found in the past week." 
                    : "No curriculum training activities found in the past week."}
                </p>
              </div>
            </motion.div>
          )
        ) : (
          localSessions.map((session) => renderSessionCard(session))
        )}
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <button 
            onClick={onAdjustLoad}
            className="bg-transparent border-2 border-border-input text-text-secondary py-4 rounded-2xl font-display text-xs tracking-[0.2em] hover:bg-bg-card-hover hover:text-text-primary hover:border-border-active transition-all uppercase flex items-center justify-center gap-3 active-scale"
          >
            ADJUST TRAINING LOAD <ArrowRight size={16} />
          </button>
          <button 
            onClick={onCreate}
            className="bg-accent-green text-text-on-green py-4 rounded-2xl font-display text-xs tracking-[0.2em] hover:bg-accent-green-dim transition-all uppercase flex items-center justify-center gap-3 shadow-xl active-scale"
          >
            CREATE NEW SESSION <ArrowRight size={16} />
          </button>
        </div>
      )}
      {!isSuperAdmin && (
        <div className="relative z-10 pt-4 border-t border-border-card">
           <p className="text-text-muted text-[9px] font-black uppercase tracking-[3px] text-center italic">
              Administrative Control Locked // Superadmin Clearance Required for Session Modification
           </p>
        </div>
      )}
    </div>
  );
}
