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
import { Anton } from "next/font/google";
import { useAthleteRoster, AthleteStatus } from "@/hooks/useAthleteRoster";
import LoadProgressBar from "./LoadProgressBar";

const anton = Anton({ weight: '400', subsets: ['latin'] });

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
      <div className="px-10 py-8 border-b border-white/5 space-y-8 bg-white/[0.01]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#22c55e]">
              <Users size={24} />
            </div>
            <div>
              <div className="text-[#22c55e] font-['Anton'] text-[10px] tracking-[0.4em] uppercase mb-1">Squad Inventory</div>
              <h2 className={`${anton.className} text-2xl text-white tracking-widest uppercase`}>
                Athlete Roster <span className="text-white/20 ml-2">({stats.total})</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="SEARCH OPERATIVES..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-xs text-white font-bold tracking-widest uppercase focus:border-[#22c55e] outline-none transition-all placeholder:text-white/5"
              />
            </div>
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-black text-white/40 uppercase tracking-widest focus:border-[#22c55e] outline-none cursor-pointer"
            >
              <option value="NAME">BY NAME</option>
              <option value="LOAD">BY LOAD</option>
              <option value="RISK">BY RISK</option>
              <option value="STATUS">BY STATUS</option>
            </select>
          </div>
        </div>

        {/* Summary Stats & Quick Filters */}
        <div className="flex flex-wrap items-center gap-3">
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
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
                statusFilter === filter.id 
                  ? "bg-white/5 border-white/20 text-white" 
                  : "bg-transparent border-transparent text-white/20 hover:text-white/40"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: filter.color }} />
              <span className="text-[10px] font-black tracking-widest uppercase">{filter.label}</span>
              <span className="text-[10px] font-['Anton'] opacity-40">{filter.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Athlete List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#22c55e]" size={32} />
            <div className="text-white/20 text-[10px] font-black tracking-widest uppercase">Syncing Roster...</div>
          </div>
        ) : (
          <AnimatePresence>
            {athletes.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/10 mb-6">
                  <AlertCircle size={40} />
                </div>
                <h3 className={`${anton.className} text-xl text-white/40 tracking-widest uppercase mb-2`}>No Athletes Detected</h3>
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest max-w-[280px]">
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                    className={`relative flex items-center p-5 rounded-[24px] border border-white/5 hover:border-white/10 group transition-all cursor-pointer ${config.tint} border-l-[6px]`}
                    style={{ borderLeftColor: riskColor }}
                    onClick={() => onSelectAthlete(athlete.id)}
                  >
                    {/* IDENTITY */}
                    <div className="flex items-center gap-6 min-w-[280px]">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center font-['Anton'] text-lg text-white/40 group-hover:text-[#22c55e] transition-colors shadow-2xl">
                          {athlete.first_name?.[0] || '?'}{athlete.last_name?.[0] || ''}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-[#111] bg-[#22c55e]`} title="Online Active" />
                      </div>
                      <div>
                        <h4 className="text-white font-['Anton'] text-lg tracking-wider uppercase leading-none mb-1.5 group-hover:text-[#22c55e] transition-colors">
                          {athlete.first_name} {athlete.last_name}
                        </h4>
                        <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                          @{athlete.username} • {athlete.sport} / {athlete.position_played}
                        </div>
                      </div>
                    </div>

                    {/* PERFORMANCE LOAD */}
                    <div className="flex-1 px-8 border-x border-white/5 max-w-[400px]">
                      <div className="flex items-center justify-between mb-3 text-[9px] font-black uppercase tracking-[0.2em]">
                         <div className="flex items-center gap-2 text-white/20">
                            LOAD METRICS {athlete.load_trend === 'up' ? <TrendingUp size={10} className="text-[#ef4444]" /> : athlete.load_trend === 'down' ? <TrendingDown size={10} className="text-[#22c55e]" /> : <Minus size={10} className="text-white/10" />}
                         </div>
                         <div className="text-white/40">{athlete.last_session ? `LAST: ${athlete.last_session.title.toUpperCase()}` : 'NO RECENT ACTIVITY'}</div>
                      </div>
                      <LoadProgressBar current={athlete.weekly_load} showLabels={false} />
                      <div className="flex justify-between items-center mt-2 px-1">
                         <span className="text-[9px] font-black text-white/10 tracking-[0.2em]">{athlete.weekly_load} AU / 650 TARGET</span>
                         <span className="text-[9px] font-black text-[#22c55e] tracking-[0.2em] uppercase">OPTIMIZATION ZONE</span>
                      </div>
                    </div>

                    {/* STATUS & RISK */}
                    <div className="px-8 shrink-0 min-w-[150px] space-y-3">
                      <div className="flex items-center gap-3">
                         <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest leading-none border ${config.bg} border-white/5 text-white shadow-xl ${config.pulsing ? 'animate-pulse' : ''}`}>
                            {config.label}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: riskColor }} />
                         <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]" style={{ color: riskColor }}>{(athlete.injury_risk || 'LOW').toUpperCase()} RISK</span>
                      </div>
                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="flex items-center gap-2 ml-auto">
                      {[
                        { icon: <UserIcon size={14} />, action: (e: any) => { e.stopPropagation(); onSelectAthlete(athlete.id); }, label: 'Profile' },
                        { icon: <Activity size={14} />, action: (e: any) => { e.stopPropagation(); onLogSession(athlete.id); }, label: 'Log Load' },
                        { icon: <Stethoscope size={14} />, action: (e: any) => { e.stopPropagation(); onLogInjury(athlete.id); }, label: 'Log Injury' },
                        { 
                          icon: <BarChart3 size={14} />, 
                          action: (e: any) => { e.stopPropagation(); onAssess(athlete.id); }, 
                          label: 'Initiate Assessment',
                          primary: true 
                        },
                        { icon: <Video size={14} />, action: (e: any) => { e.stopPropagation(); onViewAnalytics(athlete.id); }, label: 'Analytics' },
                      ].map((btn, idx) => (
                        <button
                          key={idx}
                          onClick={btn.action}
                          className={`flex items-center gap-2 h-10 px-3 rounded-xl border transition-all ${
                            btn.primary 
                              ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-black" 
                              : "bg-white/5 border-white/10 text-white/20 hover:text-white hover:bg-white/10"
                          }`}
                          title={btn.label}
                        >
                           {btn.icon}
                           {btn.primary && <span className="text-[8px] font-black uppercase tracking-wider">Assess</span>}
                        </button>
                      ))}
                      <div className="w-px h-8 bg-white/5 mx-2" />
                      <button className="w-10 h-10 rounded-xl flex items-center justify-center text-white/10 hover:text-white transition-all">
                         <ArrowRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Inventory Link */}
      <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
         <div className="flex gap-4">
            <div className="text-[9px] font-black text-white/10 uppercase tracking-[3px]">REGISTRY: SQUAD_OMEGA_ACTIVE</div>
            <div className="text-[9px] font-black text-white/10 uppercase tracking-[3px]">ENCRYPTION: AES_256_ACTIVE</div>
         </div>
         <button className={`${anton.className} text-[#22c55e] text-xs tracking-widest uppercase hover:tracking-[0.4em] transition-all flex items-center gap-3 group`}>
            DETAILED TACTICAL INVENTORY <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
         </button>
      </div>
    </div>
  );
}
