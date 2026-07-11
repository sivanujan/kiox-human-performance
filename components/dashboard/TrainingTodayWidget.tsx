"use client";

import { useTrainingToday, FlatTrainingSession } from "@/hooks/useTrainingToday";
import { useTimezone } from "@/hooks/useTimezone";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  MapPin, 
  User, 
  Activity, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  Sparkles
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useState } from "react";

export default function TrainingTodayWidget() {
  const { sessions, loading, error, refetch } = useTrainingToday();
  const { getFriendlyLabel, userTimezone } = useTimezone();
  const [searchQuery, setSearchQuery] = useState("");

  // Map session types to premium Tailwind colors and glow effects
  const getSessionTypeStyle = (type: string) => {
    const t = type.toUpperCase();
    switch (t) {
      case "STRENGTH":
        return {
          bg: "bg-[#22c55e]/10",
          border: "border-[#22c55e]/20",
          text: "text-[#22c55e]",
          glow: "shadow-[0_0_15px_rgba(34,197,94,0.15)]"
        };
      case "CONDITIONING":
        return {
          bg: "bg-teal-500/10",
          border: "border-teal-500/20",
          text: "text-teal-400",
          glow: "shadow-[0_0_15px_rgba(20,184,166,0.15)]"
        };
      case "TACTICAL":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          text: "text-blue-400",
          glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]"
        };
      case "RECOVERY":
        return {
          bg: "bg-purple-500/10",
          border: "border-purple-500/20",
          text: "text-purple-400",
          glow: "shadow-[0_0_15px_rgba(168,85,247,0.15)]"
        };
      case "ASSESSMENT":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          text: "text-amber-400",
          glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]"
        };
      default:
        return {
          bg: "bg-white/5",
          border: "border-white/10",
          text: "text-white/70",
          glow: ""
        };
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "IN_PROGRESS":
        return "bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default: // SCHEDULED
        return "bg-white/5 text-white/50 border-white/10";
    }
  };

  const filteredSessions = sessions.filter(s => {
    const query = searchQuery.toLowerCase();
    return (
      s.athlete_name.toLowerCase().includes(query) ||
      s.title.toLowerCase().includes(query) ||
      s.location.toLowerCase().includes(query) ||
      s.coach_name.toLowerCase().includes(query) ||
      s.session_type.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-bg-card border border-border-card rounded-[28px] p-6 md:p-8 shadow-2xl relative overflow-hidden group/widget z-10 transition-all duration-300 hover:border-accent-green/20">
      {/* Glow effect on hover */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent-green/[0.02] rounded-full blur-[100px] pointer-events-none group-hover/widget:bg-accent-green/[0.04] transition-all duration-500" />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-accent-green uppercase tracking-[4px]">Daily Orchestration Matrix</span>
            <Sparkles size={12} className="text-accent-green animate-pulse" />
          </div>
          <h2 className="font-display font-black text-2xl md:text-3xl text-text-primary uppercase tracking-wide mt-1 flex items-center gap-3">
            Training Today
            {sessions.length > 0 && (
              <span className="text-xs bg-accent-green/10 border border-accent-green/30 text-accent-green px-3 py-1 rounded-full font-black">
                {sessions.length} {sessions.length === 1 ? "SESSION" : "SESSIONS"}
              </span>
            )}
          </h2>
          <div className="text-[10px] text-text-muted font-mono uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
            <Calendar size={10} className="text-accent-green" />
            Timezone: {getFriendlyLabel(userTimezone || "UTC")}
          </div>
        </div>

        {/* Search Bar / Action Buttons */}
        {sessions.length > 0 && (
          <div className="flex w-full sm:w-auto items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Filter today's roster..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-bg-input border border-border-input hover:border-white/10 rounded-xl px-4 py-2.5 pl-9 text-xs text-text-primary focus:outline-none focus:border-accent-green transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <button
              onClick={() => refetch()}
              className="p-2.5 bg-bg-input border border-border-input hover:border-accent-green/30 hover:bg-accent-green/5 rounded-xl text-text-muted hover:text-accent-green transition-all"
              title="Refresh Roster"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-accent-green" : ""} />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {loading && sessions.length === 0 ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-accent-green/10 animate-ping absolute inset-0" />
                <div className="w-12 h-12 rounded-full border-t-2 border-accent-green animate-spin" />
              </div>
              <p className="text-xs text-text-muted font-bold tracking-widest uppercase animate-pulse">Syncing Daily Operations...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-400">
                <AlertCircle size={22} />
              </div>
              <div>
                <h4 className="font-display font-black uppercase text-sm text-text-primary tracking-wide">Sync Error</h4>
                <p className="text-text-secondary text-xs mt-1">{error}</p>
              </div>
              <button 
                onClick={() => refetch()} 
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Retry Connection
              </button>
            </motion.div>
          ) : sessions.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-bg-primary/40 border border-border-card/50 rounded-2xl py-14 px-6 text-center space-y-4 shadow-inner"
            >
              <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto text-text-muted">
                📅
              </div>
              <div>
                <h4 className="font-display font-black uppercase text-base text-text-primary tracking-widest">No training scheduled today</h4>
                <p className="text-text-secondary text-xs max-w-sm mx-auto mt-1 leading-relaxed">
                  All active athletes are currently in recovery or have no assigned sessions scheduled for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.
                </p>
              </div>
            </motion.div>
          ) : filteredSessions.length === 0 ? (
            <motion.div 
              key="no-filter-match"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-bg-primary/20 border border-white/5 rounded-2xl py-12 px-6 text-center space-y-2"
            >
              <p className="text-text-secondary text-xs">No active sessions match "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery("")}
                className="text-xs text-accent-green hover:underline font-bold"
              >
                Clear Search Filter
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Desktop Header Row (Hidden on mobile) */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-2 text-[9px] font-black text-text-muted uppercase tracking-widest border-b border-white/5">
                <div className="col-span-3">Athlete Name</div>
                <div className="col-span-3">Session & Category</div>
                <div className="col-span-2">Time Schedule</div>
                <div className="col-span-2">Assigned Coach</div>
                <div className="col-span-2 text-right">Location & Status</div>
              </div>

              {/* Sessions Grid */}
              <div className="space-y-3.5">
                {filteredSessions.map((session) => {
                  const typeStyle = getSessionTypeStyle(session.session_type);
                  return (
                    <div 
                      key={session.id}
                      className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl p-5 lg:px-6 lg:py-4.5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center transition-all duration-200 shadow-md group/row"
                    >
                      {/* 1. Athlete Information */}
                      <div className="col-span-1 lg:col-span-3 flex items-center gap-3.5 min-w-0">
                        {session.athlete_id ? (
                          <Avatar 
                            src={session.athlete_avatar || undefined}
                            name={session.athlete_name}
                            role="athlete"
                            size="md"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-text-muted">
                            <User size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-display font-black text-sm uppercase tracking-wide text-text-primary group-hover/row:text-accent-green transition-colors truncate">
                            {session.athlete_name}
                          </h4>
                          <span className="text-[9px] text-text-muted font-mono tracking-wider block mt-0.5">
                            {session.athlete_id ? "ACADEMY PLAYER" : "GUEST CLIENT"}
                          </span>
                        </div>
                      </div>

                      {/* 2. Session Type & Title */}
                      <div className="col-span-1 lg:col-span-3 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[8px] font-black px-2.5 py-0.5 rounded border uppercase tracking-wider ${typeStyle.bg} ${typeStyle.border} ${typeStyle.text} ${typeStyle.glow}`}>
                            {session.session_type}
                          </span>
                          {session.is_curriculum && (
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Curriculum
                            </span>
                          )}
                        </div>
                        <h5 className="font-display font-bold text-xs uppercase text-text-secondary truncate">
                          {session.title}
                        </h5>
                      </div>

                      {/* 3. Time Schedule */}
                      <div className="col-span-1 lg:col-span-2 flex items-center gap-3 lg:gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-accent-green">
                          <Clock size={14} />
                        </div>
                        <div>
                          <div className="font-display font-black text-xs text-text-primary tracking-wide">
                            {session.start_time} – {session.end_time}
                          </div>
                          <span className="text-[8px] text-text-muted font-mono uppercase tracking-widest block mt-0.5">
                            {session.duration_minutes} Minutes
                          </span>
                        </div>
                      </div>

                      {/* 4. Assigned Coach */}
                      <div className="col-span-1 lg:col-span-2 flex items-center gap-3 lg:gap-2.5">
                        {session.coach_id ? (
                          <Avatar 
                            src={session.coach_avatar || undefined}
                            name={session.coach_name}
                            role="staff"
                            size="sm"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-text-muted">
                            <Activity size={12} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-text-secondary truncate">
                            {session.coach_name}
                          </div>
                          <span className="text-[8.5px] text-text-muted uppercase tracking-widest block mt-0.5">
                            Lead Coach
                          </span>
                        </div>
                      </div>

                      {/* 5. Location & Status */}
                      <div className="col-span-1 lg:col-span-2 flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 text-right">
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary font-bold uppercase shrink-0">
                          <MapPin size={12} className="text-accent-green shrink-0" />
                          <span className="truncate max-w-[120px]">{session.location}</span>
                        </div>
                        <span className={`text-[8.5px] font-black border px-2 py-0.5 rounded uppercase tracking-widest shrink-0 ${getStatusBadgeStyle(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
