"use client";

import { useTrainingToday, TrainingTodayRow } from "@/hooks/useTrainingToday";
import { useTimezoneContext } from "@/components/providers/TimezoneProvider";
import { motion } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  Activity, 
  Search, 
  RotateCw, 
  UserCheck 
} from "lucide-react";
import { useState, useMemo } from "react";

export default function TrainingTodayWidget() {
  const { sessions, loading, error, refetch } = useTrainingToday();
  const { userTimezone: timezone } = useTimezoneContext();
  const [filterQuery, setFilterQuery] = useState("");

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const q = filterQuery.toLowerCase();
      return (
        s.athleteName.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.assignedCoach.toLowerCase().includes(q) ||
        s.trainingType.toLowerCase().includes(q)
      );
    });
  }, [sessions, filterQuery]);

  // Accent and Badge styles depending on training type
  const getTypeBadgeStyles = (type: string) => {
    switch (type.toUpperCase()) {
      case "STRENGTH":
        return "bg-green-500/10 border-green-500/20 text-accent-green shadow-[0_0_10px_rgba(34,197,94,0.1)]";
      case "CONDITIONING":
        return "bg-teal-500/10 border-teal-500/20 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.1)]";
      case "TACTICAL":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]";
      case "RECOVERY":
        return "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]";
      case "ASSESSMENT":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-300 shadow-none";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (error) {
    return (
      <div className="w-full bg-bg-card border border-red-500/20 rounded-[32px] p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-red-500/[0.02] pointer-events-none" />
        <h3 className="font-display text-lg text-red-500 font-bold uppercase tracking-wider mb-2">Failed to Load Today's Training</h3>
        <p className="text-text-muted text-xs mb-4">{error}</p>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 hover:bg-red-500/20 transition-all font-mono"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-bg-card border border-border-card rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative group">
      {/* Background neon grid line decoration */}
      <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[radial-gradient(#00ff88_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Header Widget */}
      <div className="px-6 md:px-10 py-6 md:py-8 border-b border-border-card bg-bg-secondary/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-accent-green font-display tracking-[0.25em] uppercase font-black">Daily Orchestration Matrix</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <h2 className="font-display text-2xl md:text-3xl text-text-primary font-black uppercase tracking-tight">
              Training Today
            </h2>
            {!loading && (
              <span className="px-3 py-1 text-[10px] font-mono font-bold bg-accent-green/10 border border-accent-green/20 rounded-full text-accent-green">
                {filteredSessions.length} {filteredSessions.length === 1 ? 'SESSION' : 'SESSIONS'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-muted tracking-wider uppercase">
            <Calendar size={10} className="text-accent-green" />
            <span>Timezone: {timezone || "Browser default"}</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 w-full md:w-auto relative">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <input 
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter today's roster..."
              className="w-full bg-bg-input border border-border-input rounded-2xl pl-10 pr-4 py-2.5 text-xs text-text-primary outline-none focus:border-accent-green transition-all placeholder:text-text-muted"
            />
          </div>
          <button 
            onClick={refetch}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center bg-bg-input border border-border-input hover:border-accent-green/50 rounded-2xl text-text-secondary hover:text-text-primary transition-all disabled:opacity-50"
            title="Refresh schedule feed"
          >
            <RotateCw size={14} className={loading ? "animate-spin text-accent-green" : ""} />
          </button>
        </div>
      </div>

      {/* Roster / Matrix view */}
      <div className="flex-1 overflow-x-auto min-h-[220px] p-6 md:p-8 no-scrollbar">
        {loading ? (
          <div className="w-full h-40 flex flex-col items-center justify-center gap-3">
            <RotateCw size={24} className="animate-spin text-accent-green" />
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Parsing live training channels...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-bg-input border border-border-input flex items-center justify-center text-text-muted mb-4 shadow-inner">
              <UserCheck size={28} />
            </div>
            <h3 className="font-display text-lg text-text-primary font-black uppercase tracking-wider mb-1">Clear Slate Today</h3>
            <p className="text-text-muted text-xs font-label max-w-[280px]">No active training sessions mapped for today's roster index.</p>
          </div>
        ) : (
          <div className="w-full min-w-[700px] flex flex-col gap-3">
            {/* Header row labels */}
            <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-mono text-text-muted uppercase tracking-wider font-bold">
              <div className="col-span-3">Athlete Name</div>
              <div className="col-span-3">Session & Category</div>
              <div className="col-span-2">Time Schedule</div>
              <div className="col-span-2">Assigned Coach</div>
              <div className="col-span-2 text-right">Location & Status</div>
            </div>

            {/* Session rows */}
            <div className="flex flex-col gap-2.5">
              {filteredSessions.map((session, index) => {
                const isCurriculum = session.isCurriculum;
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="grid grid-cols-12 items-center px-6 py-4 bg-bg-secondary border border-border-card/50 hover:border-accent-green/30 rounded-2xl transition-all shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden"
                  >
                    {/* Athlete Details */}
                    <div className="col-span-3 flex items-center gap-3.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        {session.athleteAvatar ? (
                          <img
                            src={session.athleteAvatar}
                            alt={session.athleteName}
                            className="w-9 h-9 rounded-xl object-cover border border-border-card"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-bg-input border border-border-input flex items-center justify-center text-accent-green font-display text-[11px] font-bold">
                            {getInitials(session.athleteName)}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg-secondary bg-green-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-xs font-black text-text-primary tracking-wide uppercase truncate">
                          {session.athleteName}
                        </div>
                        <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider truncate mt-0.5">
                          {session.athleteId ? "Academy Player" : "Guest Client"}
                        </div>
                      </div>
                    </div>

                    {/* Session Type & Badges */}
                    <div className="col-span-3 flex flex-col gap-1.5 items-start">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded border text-[9px] font-mono uppercase font-bold tracking-widest ${getTypeBadgeStyles(session.trainingType)}`}>
                          {session.trainingType}
                        </span>
                        {isCurriculum && (
                          <span className="px-2.5 py-0.5 rounded border border-orange-500/20 bg-orange-500/10 text-orange-400 text-[9px] font-mono uppercase font-bold tracking-widest">
                            Curriculum
                          </span>
                        )}
                      </div>
                      <span className="font-display text-[10px] font-bold text-text-secondary uppercase tracking-wider pl-1">
                        {session.trainingType}
                      </span>
                    </div>

                    {/* Time Schedule */}
                    <div className="col-span-2 flex items-center gap-2">
                      <Clock size={13} className="text-accent-green flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-display text-xs font-black text-text-primary leading-none">
                          {session.startTime} - {session.endTime}
                        </span>
                        <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest mt-1">
                          60 Minutes
                        </span>
                      </div>
                    </div>

                    {/* Assigned Coach */}
                    <div className="col-span-2 flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-bg-input border border-border-input flex items-center justify-center flex-shrink-0">
                        <User size={10} className="text-text-muted" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-[10px] font-bold text-text-primary uppercase tracking-wide truncate">
                          {session.assignedCoach}
                        </div>
                        <span className="font-mono text-[8px] text-text-muted uppercase tracking-wider block mt-0.5">
                          Lead Coach
                        </span>
                      </div>
                    </div>

                    {/* Location and Status */}
                    <div className="col-span-2 flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5 text-text-secondary min-w-0 justify-end w-full">
                        <MapPin size={11} className="text-accent-green flex-shrink-0" />
                        <span className="font-display text-[10px] font-black uppercase tracking-wide truncate">
                          {session.location}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-bg-input border border-border-input text-[8px] font-mono text-text-muted uppercase tracking-wider font-bold">
                        Scheduled
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
