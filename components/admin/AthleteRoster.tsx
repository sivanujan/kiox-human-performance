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
  Video
} from "lucide-react";
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

  return (
    <div className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-full">
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
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex items-center gap-3 pb-2 min-w-max">
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
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all active-scale ${
                  statusFilter === filter.id 
                    ? "bg-white/5 border-white/20 text-white" 
                    : "bg-transparent border-transparent text-gray-500 hover:text-white/40"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: filter.color }} />
                <span className="font-label font-bold text-[10px] uppercase whitespace-nowrap">{filter.label}</span>
                <span className="font-stat text-gray-400 font-bold text-[10px]">{filter.count}</span>
              </button>
            ))}
          </div>
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
              <div className="py-32 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-6 border border-white/5">
                  <AlertCircle size={40} />
                </div>
                <h3 className="font-display text-xl text-white font-black uppercase tracking-widest mb-2">No Athletes Detected</h3>
                <p className="text-gray-400 font-label font-bold max-w-[280px]">
                  Ensure users are registered with the 'athlete' role to populate this unit inventory.
                </p>
              </div>
            ) : (
              athletes.map((athlete, i) => {
                const config = getStatusConfig(athlete.computed_status);
                const riskColor = getRiskColor(athlete.injury_risk);
                
                return (
                   <motion.div
                    key={athlete.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                    className={`relative flex flex-col lg:flex-row lg:items-center p-4 md:p-5 rounded-[24px] border border-white/5 hover:border-white/10 group transition-all active-scale lg:active-scale-none overflow-hidden ${config.tint} border-l-[6px] gap-4 md:gap-6`}
                    style={{ borderLeftColor: riskColor }}
                    onClick={() => onSelectAthlete(athlete.id)}
                  >
                    {/* IDENTITY & STATUS - STACKED ON MOBILE */}
                    <div className="flex items-center justify-between lg:justify-start gap-4 md:gap-6 lg:min-w-[280px]">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center font-display text-lg text-gray-500 group-hover:text-[#22c55e] transition-colors shadow-2xl">
                            {athlete.first_name?.[0] || '?'}{athlete.last_name?.[0] || ''}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#111] bg-[#22c55e]`} title="Online Active" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-white font-display text-md md:text-lg leading-none mb-1.5 group-hover:text-[#22c55e] transition-colors truncate">
                            {athlete.first_name} {athlete.last_name}
                          </h4>
                          <div className="font-label text-gray-500 text-[10px] md:text-xs truncate">
                            <span className="hidden xs:inline">@{athlete.username} • </span>{athlete.sport}
                          </div>
                        </div>
                      </div>

                      {/* Status Tag - Visible on Mobile side by side */}
                      <div className="lg:hidden">
                        <span className={`px-3 py-1 rounded-lg font-label font-black text-[9px] tracking-widest leading-none border ${config.bg} border-white/5 text-white shadow-xl ${config.pulsing ? 'animate-pulse' : ''}`}>
                             {config.label}
                        </span>
                      </div>
                    </div>

                    {/* PERFORMANCE LOAD - FULL WIDTH ON MOBILE */}
                    <div className="w-full lg:flex-1 lg:px-8 lg:border-x lg:border-white/5 lg:max-w-[400px]">
                        <div className="flex items-center justify-between mb-2 lg:mb-3 font-label">
                         <div className="flex items-center gap-2 text-gray-500 font-bold text-[10px]">
                            LOAD METRICS {athlete.load_trend === 'up' ? <TrendingUp size={10} className="text-[#ef4444]" /> : athlete.load_trend === 'down' ? <TrendingDown size={10} className="text-[#22c55e]" /> : <Minus size={10} className="text-gray-500" />}
                         </div>
                         <div className="text-gray-500 font-bold text-[10px] hidden sm:block">{athlete.last_session ? `LAST: ${athlete.last_session.title.toUpperCase()}` : 'NO RECENT ACTIVITY'}</div>
                      </div>
                      <LoadProgressBar current={athlete.weekly_load} showLabels={false} />
                      <div className="flex justify-between items-center mt-2 px-0 md:px-1">
                         <span className="font-label text-gray-500 font-bold text-[10px] truncate mr-2">{athlete.weekly_load} AU / 650 TARGET</span>
                         <span className="font-label text-[#22c55e] font-black tracking-widest text-[9px] whitespace-nowrap">OPTIMIZATION ZONE</span>
                      </div>
                    </div>

                    {/* STATUS & RISK - DESKTOP ONLY ROWS */}
                    <div className="hidden lg:flex px-8 shrink-0 min-w-[150px] flex-col gap-3">
                      <div className="flex items-center gap-3">
                          <span className={`px-4 py-1.5 rounded-xl font-label font-bold tracking-widest leading-none border ${config.bg} border-white/5 text-white shadow-xl ${config.pulsing ? 'animate-pulse' : ''}`}>
                             {config.label}
                          </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: riskColor }} />
                         <span className="font-label text-gray-500 text-[10px]" style={{ color: riskColor }}>{(athlete.injury_risk || 'LOW').toUpperCase()} RISK</span>
                      </div>
                    </div>

                    {/* QUICK ACTIONS - SCROLLABLE ON MOBILE */}
                    <div className="flex items-center gap-2 lg:ml-auto no-scrollbar overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                      {[
                        { icon: <UserIcon size={14} />, action: (e: any) => { e.stopPropagation(); onSelectAthlete(athlete.id); }, label: 'Profile' },
                        { icon: <Activity size={14} />, action: (e: any) => { e.stopPropagation(); onLogSession(athlete.id); }, label: 'Log Load' },
                        { icon: <Stethoscope size={14} />, action: (e: any) => { e.stopPropagation(); onLogInjury(athlete.id); }, label: 'Log Injury' },
                        { 
                          icon: <BarChart3 size={14} />, 
                          action: (e: any) => { e.stopPropagation(); onAssess(athlete.id); }, 
                          label: 'Assess',
                          primary: true 
                        },
                        { icon: <Video size={14} />, action: (e: any) => { e.stopPropagation(); onViewAnalytics(athlete.id); }, label: 'Analytics' },
                      ].map((btn, idx) => (
                        <button
                          key={idx}
                          onClick={btn.action}
                          className={`flex-shrink-0 flex items-center gap-2 h-10 px-3 md:px-4 rounded-xl border transition-all active-scale ${
                            btn.primary 
                               ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-black" 
                               : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                           }`}
                           title={btn.label}
                         >
                            {btn.icon}
                            {(btn.primary || idx === 0) && <span className="font-label text-inherit font-black uppercase tracking-widest text-[10px]">{btn.label}</span>}
                         </button>
                       ))}
                       <div className="hidden lg:flex items-center">
                         <div className="w-px h-8 bg-white/5 mx-2" />
                         <button className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-white transition-all">
                            <ArrowRight size={18} />
                         </button>
                       </div>
                    </div>
                  </motion.div>
                );
              })
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
