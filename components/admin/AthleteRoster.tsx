"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MoreVertical,
  User as UserIcon,
  Activity,
  Stethoscope,
  BarChart3,
  Loader2,
  AlertCircle,
  Video,
  User,
  BarChart2,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAthleteRoster, AthleteStatus } from "@/hooks/useAthleteRoster";
import LoadProgressBar from "./LoadProgressBar";



interface AthleteRosterProps {
  onSelectAthlete: (id: string) => void;
  onLogSession: (id: string) => void;
  onLogInjury: (id: string) => void;
  onViewAnalytics: (id: string) => void;
  onAssess: (id: string) => void;
  externalSearchQuery?: string;
}

export default function AthleteRoster({ 
  onSelectAthlete, 
  onLogSession, 
  onLogInjury, 
  onViewAnalytics,
  onAssess,
  externalSearchQuery = ""
}: AthleteRosterProps) {
  const router = useRouter();
  const { 
    athletes, 
    loading, 
    stats, 
    searchQuery, 
    setSearchQuery, 
    statusFilter, 
    setStatusFilter,
    sortBy,
    setSortBy
  } = useAthleteRoster();

  // Sync with external search query if provided
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery, setSearchQuery]);

  const getStatusConfig = (status: AthleteStatus) => {
    switch (status) {
      case 'INJURED': return { color: '#ef4444', label: 'INJURED', bg: 'bg-red-500/10', tint: 'bg-[#ef444408]', pulsing: false };
      case 'ALERT': return { color: '#ef4444', label: 'ALERT', bg: 'bg-red-500/10', tint: 'bg-[#ef444408]', pulsing: true };
      case 'MONITOR': return { color: '#f59e0b', label: 'MONITOR', bg: 'bg-amber-500/10', tint: 'bg-[#f59e0b08]', pulsing: false };
      case 'REST': return { color: '#a855f7', label: 'REST', bg: 'bg-purple-500/10', tint: 'bg-transparent', pulsing: false };
      default: return { color: '#22c55e', label: 'READY', bg: 'bg-[#22c55e]/10', tint: 'bg-transparent', pulsing: false };
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getBorderColor = (athlete: any) => {
    return getRiskColor(athlete.injury_risk);
  };

  return (
    <div className="w-full overflow-hidden bg-[#111] border border-white/5 rounded-[32px] shadow-2xl flex flex-col h-full">
      {/* Header Section */}
      <div className="px-4 md:px-10 py-6 md:py-8 border-b border-white/5 space-y-6 md:space-y-8 bg-white/[0.01]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#22c55e] flex-shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <div className="text-[#22c55e] font-label font-bold mb-0.5 md:mb-1 text-[10px] md:text-xs">Squad Inventory</div>
              <h2 className="font-display text-xl md:text-2xl text-white font-black tracking-wide uppercase truncate">
                Athlete Roster <span className="text-gray-400 font-stat ml-2">({stats.total})</span>
              </h2>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="SEARCH OPERATIVES..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 md:py-3 text-xs text-white font-label focus:border-[#22c55e] outline-none transition-all placeholder:text-gray-500 shadow-xl"
              />
            </div>
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 md:py-3 text-[10px] font-label text-gray-400 focus:border-[#22c55e] outline-none cursor-pointer appearance-none text-center sm:text-left"
            >
              <option value="NAME">BY NAME</option>
              <option value="LOAD">BY LOAD</option>
              <option value="RISK">BY RISK</option>
              <option value="STATUS">BY STATUS</option>
            </select>
          </div>
        </div>

        {/* Summary Stats & Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {[
            { id: 'ALL', label: 'SQUAD ALL', count: stats.total, color: 'white' },
            { id: 'READY', label: 'READY', count: stats.ready, color: '#22c55e' },
            { id: 'MONITOR', label: 'MONITOR', count: stats.monitor, color: '#f59e0b' },
            { id: 'ALERT', label: 'ALERT', count: stats.alert, color: '#ef4444' },
            { id: 'INJURED', label: 'INJURED', count: stats.injured, color: '#ef4444' },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id as any)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-xs tracking-wider uppercase whitespace-nowrap touch-manipulation transition-all min-h-[36px] ${
                statusFilter === filter.id 
                  ? "bg-white/5 border-white/20 text-white" 
                  : "bg-transparent border-transparent text-gray-500 hover:text-white/40"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" style={{ color: filter.color }} />
              {filter.label} {filter.count}
            </button>
          ))}
        </div>
      </div>

      {/* Athlete List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#22c55e]" size={32} />
            <div className="text-gray-400 font-label font-bold tracking-widest">Syncing Roster...</div>
          </div>
        ) : (
          <AnimatePresence>
            {athletes.length === 0 ? (
              <div className="space-y-3 w-full">
                <div className="py-32 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-6 border border-white/5">
                    <AlertCircle size={40} />
                  </div>
                  <h3 className="font-display text-xl text-white font-black uppercase tracking-widest mb-2">No Athletes Detected</h3>
                  <p className="text-gray-400 font-label font-bold max-w-[280px]">
                    Ensure users are registered with the 'athlete' role to populate this unit inventory.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                {athletes.map((athlete) => {
                  const athleteName = `${athlete.first_name} ${athlete.last_name}`;
                  
                  return (
                    <motion.div
                      key={athlete.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-[#111] border border-gray-800 hover:border-gray-700 transition-all overflow-hidden w-full"
                      style={{ borderLeft: `3px solid ${getBorderColor(athlete)}` }}
                    >
                      {/* SECTION 1 — Avatar (fixed width, never shrinks) */}
                      <div className="flex-shrink-0 relative">
                        <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center font-display text-sm font-bold text-white border border-gray-700">
                          {getInitials(athleteName)}
                        </div>
                        {/* Online dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111] bg-green-400" />
                      </div>

                      {/* SECTION 2 — Identity (fixed width, text truncates) */}
                      <div className="flex-shrink-0 w-[160px] min-w-0">
                        <div className="font-display text-sm font-bold text-white tracking-wider uppercase truncate">
                          {athleteName}
                        </div>
                        <div className="font-mono text-xs text-gray-500 tracking-wider truncate mt-0.5">
                          @{athlete.username} • {athlete.sport}
                        </div>
                      </div>

                      {/* SECTION 2.5 — Recovery (fixed width) */}
                      <div className="flex-shrink-0 w-[110px] px-2 flex flex-col gap-1 border-x border-white/5">
                        <div className="font-mono text-[9px] text-gray-500 tracking-widest uppercase mb-0.5">RECOVERY</div>
                        <div className="flex items-end gap-1.5 leading-none h-5">
                          <span className="font-display text-base font-black text-white">{(athlete as any).recovery_score || 75}%</span>
                          <div className={`w-1.5 h-1.5 rounded-full mb-1 ${((athlete as any).recovery_score || 75) > 80 ? 'bg-green-400' : ((athlete as any).recovery_score || 75) > 50 ? 'bg-orange-400' : 'bg-red-400'}`} />
                        </div>
                        <div className="h-1 bg-gray-800 rounded-full w-full overflow-hidden mt-0.5">
                          <div 
                            className="h-full transition-all duration-1000" 
                            style={{ 
                              width: `${(athlete as any).recovery_score || 75}%`, 
                              backgroundColor: ((athlete as any).recovery_score || 75) > 80 ? '#22c55e' : ((athlete as any).recovery_score || 75) > 50 ? '#f59e0b' : '#ef4444' 
                            }} 
                          />
                        </div>
                      </div>

                      {/* SECTION 3 — Load Metrics (flexible, takes remaining space) */}
                      <div className="flex-1 min-w-0 px-2">
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">
                            LOAD METRICS
                            <span className={`ml-1 text-xs ${
                              athlete.load_trend === 'up' ? 'text-red-400' : 
                              athlete.load_trend === 'down' ? 'text-green-400' : 
                              'text-gray-500'
                            }`}>
                              {athlete.load_trend === 'up' ? '↑' : 
                               athlete.load_trend === 'down' ? '↓' : '→'}
                            </span>
                          </span>
                          <span className="font-mono text-xs text-gray-600 tracking-wider truncate ml-2">
                            {athlete.last_session 
                              ? `LAST: ${athlete.last_session.title.toUpperCase()}` 
                              : 'NO RECENT ACTIVITY'}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden w-full">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min((athlete.weekly_load / 650) * 100, 100)}%`,
                              backgroundColor:
                                athlete.weekly_load < 500 ? '#3b82f6' :
                                athlete.weekly_load <= 650 ? '#00ff88' :
                                athlete.weekly_load <= 800 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>

                        {/* Load value */}
                        <div className="font-mono text-xs text-gray-400 tracking-wider mt-1 truncate">
                          <span className="text-white font-bold">{athlete.weekly_load}</span>
                          {' AU / 650 TARGET OPTIMIZATION ZONE'}
                        </div>
                      </div>

                      {/* SECTION 4 — Status (fixed width) */}
                      <div className="flex-shrink-0 w-[100px] flex flex-col items-center gap-1.5">
                        {/* Availability badge */}
                        <span className={`px-3 py-1 rounded font-mono text-xs font-bold tracking-widest uppercase w-full text-center ${
                          athlete.computed_status === 'READY' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                          athlete.computed_status === 'MONITOR' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
                          athlete.computed_status === 'ALERT' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                          athlete.computed_status === 'INJURED' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                        }`}>
                          {athlete.computed_status}
                        </span>

                        {/* Risk badge */}
                        <span className={`font-mono text-xs tracking-wider uppercase flex items-center gap-1 ${
                          athlete.injury_risk === 'high' ? 'text-red-400' :
                          athlete.injury_risk === 'medium' ? 'text-orange-400' :
                          'text-green-400'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: 
                                  athlete.injury_risk === 'high' ? '#ef4444' :
                                  athlete.injury_risk === 'medium' ? '#f59e0b' : '#22c55e'
                                }} />
                          {athlete.injury_risk?.toUpperCase()} RISK
                        </span>
                      </div>

                      {/* SECTION 5 — Actions (fixed width, never shrinks or hides) */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {/* Training Plan button */}
                        <button
                          title="Configure Training Plan"
                          onClick={() => onSelectAthlete(athlete.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/30 hover:border-[#22c55e]/50 rounded-xl font-mono text-[10px] text-[#22c55e] hover:text-[#4ade80] transition-all touch-manipulation min-h-[36px]"
                        >
                          <span className="text-xs">📋</span>
                          <span className="hidden xl:block tracking-widest uppercase">Training Plan</span>
                        </button>

                        {/* Log session button */}
                        <button
                          title="Log Training Session"
                          onClick={() => onLogSession(athlete.id)}
                          className="w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-xl text-gray-400 hover:text-yellow-400 transition-all touch-manipulation"
                        >
                          <Zap size={14} />
                        </button>

                        {/* Log injury button */}
                        <button
                          title="Register Injury Record"
                          onClick={() => onLogInjury(athlete.id)}
                          className="w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-xl text-gray-400 hover:text-red-400 transition-all touch-manipulation"
                        >
                          <Stethoscope size={14} />
                        </button>

                        {/* Assessment button */}
                        <button
                          title="Run Performance Assessment"
                          onClick={() => onAssess(athlete.id)}
                          className="w-9 h-9 flex items-center justify-center bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/20 hover:border-[#22c55e]/40 rounded-xl text-[#22c55e] transition-all touch-manipulation shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                        >
                          <BarChart3 size={14} />
                        </button>

                        {/* Analytics button */}
                        <button
                          title="View Multimedia Analytics"
                          onClick={() => onViewAnalytics(athlete.id)}
                          className="w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-xl text-gray-400 hover:text-blue-400 transition-all touch-manipulation"
                        >
                          <Video size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Inventory Link */}
      <div className="px-4 md:px-8 py-6 md:py-8 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center sm:items-start">
             <div className="font-label text-gray-500 font-bold text-[9px] uppercase tracking-widest">REGISTRY: SQUAD_OMEGA_ACTIVE</div>
             <div className="font-label text-gray-500 font-bold text-[9px] uppercase tracking-widest hidden xs:block">ENCRYPTION: AES_256_ACTIVE</div>
          </div>
         <button className="font-button text-[#22c55e] text-[10px] hover:tracking-[0.2em] transition-all flex items-center gap-3 group active-scale">
            TACTICAL INVENTORY <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
         </button>
      </div>
    </div>
  );
}
