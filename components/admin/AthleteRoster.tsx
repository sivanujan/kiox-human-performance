"use client";

import { useEffect, useState } from "react";
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
  AlertCircle,
  Video,
  User,
  BarChart2,
  Zap,
  Layers
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAthleteRoster, AthleteStatus, AthleteData } from "@/hooks/useAthleteRoster";
import LoadProgressBar from "./LoadProgressBar";
import { SkeletonRow } from "@/components/ui/Skeleton";



interface AthleteRosterProps {
  onSelectAthlete: (id: string) => void;
  onViewProfile?: (athlete: AthleteData) => void;
  onLogSession: (id: string) => void;
  onLogInjury: (id: string) => void;
  onViewAnalytics: (id: string) => void;
  onAssess: (id: string) => void;
  onAssignProgram?: (id: string) => void;
  externalSearchQuery?: string;
}

export default function AthleteRoster({ 
  onSelectAthlete, 
  onViewProfile,
  onLogSession, 
  onLogInjury, 
  onViewAnalytics,
  onAssess,
  onAssignProgram,
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

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const getStatusTooltip = (status: AthleteStatus) => {
    switch (status) {
      case 'READY': return 'Ready: Fully fit and cleared for all training activities.';
      case 'MONITOR': return 'Monitor: Under close observation due to moderate fatigue or recovery.';
      case 'ALERT': return 'Alert: High injury risk; recommend immediate workload reduction.';
      case 'INJURED': return 'Injured: Active injury logged. Regular training is restricted until cleared.';
      case 'REST': return 'Rest: Scheduled active recovery or rest protocol.';
      default: return '';
    }
  };

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
    <div className="w-full overflow-hidden bg-bg-card border border-border-card rounded-[32px] shadow-2xl flex flex-col h-full">
      {/* Header Section */}
      <div className="px-4 md:px-10 py-6 md:py-8 border-b border-border-card space-y-6 md:space-y-8 bg-bg-secondary/10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-bg-input border border-border-input flex items-center justify-center text-accent-green flex-shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <div className="text-accent-green font-label font-bold mb-0.5 md:mb-1 text-[10px] md:text-xs">My Athletes</div>
              <h2 className="font-display text-xl md:text-2xl text-text-primary font-black tracking-wide uppercase truncate">
                My Athletes <span className="text-text-muted font-stat ml-2">({stats.total})</span>
              </h2>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search athletes..."
                className="w-full bg-bg-input border border-border-input rounded-2xl pl-12 pr-4 py-2.5 md:py-3 text-xs text-text-primary font-label focus:border-accent-green outline-none transition-all placeholder:text-text-muted shadow-xl"
              />
            </div>
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-bg-input border border-border-input rounded-2xl px-4 py-2.5 md:py-3 text-[10px] font-label text-text-secondary focus:border-accent-green outline-none cursor-pointer appearance-none text-center sm:text-left"
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
            { id: 'ALL', label: 'ALL ATHLETES', count: stats.total, color: '#ffffff', dotColor: '#00ff88' },
            { id: 'READY', label: 'READY', count: stats.ready, color: '#00ff88', dotColor: '#00ff88' },
            { id: 'MONITOR', label: 'MONITOR', count: stats.monitor, color: '#f59e0b', dotColor: '#f59e0b' },
            { id: 'ALERT', label: 'ALERT', count: stats.alert, color: '#ef4444', dotColor: '#ef4444' },
            { id: 'INJURED', label: 'INJURED', count: stats.injured, color: '#ef4444', dotColor: '#ef4444' },
            { id: 'TRAINING_TODAY', label: 'TRAINING TODAY', count: stats.trainingToday, color: '#3b82f6', dotColor: '#3b82f6' },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id as any)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-xs tracking-wider uppercase whitespace-nowrap touch-manipulation transition-all min-h-[38px] ${
                statusFilter === filter.id 
                  ? "bg-bg-card-hover border-border-active text-text-primary" 
                  : "bg-bg-input border-border-input text-text-muted hover:text-text-secondary"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: filter.dotColor }} />
              <span>{filter.label}</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-bg-input border border-border-input text-text-secondary font-mono">
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Athlete List */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-36 space-y-3 scrollbar-hide">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : (
          <AnimatePresence>
            {athletes.length === 0 ? (
              <div className="space-y-3 w-full">
                <div className="py-32 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-bg-input flex items-center justify-center text-text-muted mb-6 border border-border-input">
                    <AlertCircle size={40} />
                  </div>
                  <h3 className="font-display text-xl text-text-primary font-black uppercase tracking-widest mb-2">No Athletes Detected</h3>
                  <p className="text-text-muted font-label font-bold max-w-[280px]">
                    Ensure users are registered with the 'athlete' role to populate this unit inventory.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                {athletes.map((athlete) => {
                  const athleteName = `${athlete.first_name} ${athlete.last_name}`;
                  const status = athlete.computed_status || 'READY';
                  
                  // Get subtle row tint matching status
                  const getRowStyle = (status: string) => {
                    switch (status) {
                      case 'READY': return 'bg-bg-card border-green-500/20 hover:border-green-500/40 shadow-[inset_0_0_12px_rgba(34,197,94,0.03)]';
                      case 'MONITOR': return 'bg-bg-card border-amber-500/20 hover:border-amber-500/40 shadow-[inset_0_0_12px_rgba(245,158,11,0.03)]';
                      case 'ALERT':
                      case 'INJURED': return 'bg-bg-card border-red-500/20 hover:border-red-500/40 shadow-[inset_0_0_12px_rgba(239,68,68,0.03)]';
                      default: return 'bg-bg-card border-border-card hover:border-border-primary';
                    }
                  };

                  // Get colored initials circle background
                  const getAvatarBg = (status: string) => {
                    switch (status) {
                      case 'READY': return 'bg-green-500/10 border-green-500/20 text-accent-green';
                      case 'MONITOR': return 'bg-amber-500/10 border-amber-500/20 text-[#f59e0b]';
                      case 'ALERT':
                      case 'INJURED': return 'bg-red-500/10 border-red-500/20 text-[#ef4444]';
                      default: return 'bg-bg-input border-border-input text-text-primary';
                    }
                  };

                  const loadBarColor = 
                    athlete.weekly_load < 500 ? '#3b82f6' :
                    athlete.weekly_load <= 650 ? '#22c55e' :
                    athlete.weekly_load <= 800 ? '#f59e0b' : '#ef4444';

                  return (
                    <motion.div
                      key={athlete.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all relative w-full ${getRowStyle(status)}`}
                      style={{ borderLeft: `4px solid ${getBorderColor(athlete)}` }}
                    >
                      {/* SECTION 1 — Avatar (fixed width, never shrinks) */}
                      <button
                        onClick={() => onViewProfile?.(athlete)}
                        className="flex-shrink-0 relative focus:outline-none group/avatar cursor-pointer"
                        title={`View ${athleteName}'s Profile`}
                      >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-display text-sm font-bold border transition-all duration-200 group-hover/avatar:scale-105 group-hover/avatar:border-accent-green ${getAvatarBg(status)}`}>
                          {getInitials(athleteName)}
                        </div>
                        {/* Online dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-card bg-green-400" />
                      </button>

                      {/* SECTION 2 — Identity (fixed width, text truncates) */}
                      <div className="flex-shrink-0 w-[160px] min-w-0">
                        <button
                          onClick={() => onViewProfile?.(athlete)}
                          className="font-display text-sm font-bold text-text-primary hover:text-accent-green tracking-wider uppercase truncate block text-left w-full transition-colors duration-200 focus:outline-none cursor-pointer"
                          title={`View ${athleteName}'s Profile`}
                        >
                          {athleteName}
                        </button>
                        <div className="font-mono text-xs text-text-muted tracking-wider truncate mt-0.5">
                          @{athlete.username} • {athlete.sport}
                        </div>
                      </div>

                      {/* SECTION 2.5 — Recovery (fixed width) */}
                      <div className="flex-shrink-0 w-[110px] px-2 flex flex-col gap-1 border-x border-border-card">
                        <div className="font-mono text-[9px] text-text-muted tracking-widest uppercase mb-0.5">RECOVERY</div>
                        <div className="flex items-end gap-1.5 leading-none h-5">
                          <span className="font-display text-base font-black text-text-primary">{((athlete as any).recovery_score ?? 50)}%</span>
                          <div className={`w-1.5 h-1.5 rounded-full mb-1 ${((athlete as any).recovery_score ?? 50) > 80 ? 'bg-green-400' : ((athlete as any).recovery_score ?? 50) > 50 ? 'bg-orange-400' : 'bg-red-400'}`} />
                        </div>
                        <div className="h-1 bg-bg-input rounded-full w-full overflow-hidden mt-0.5">
                          <div 
                            className="h-full transition-all duration-1000" 
                            style={{ 
                              width: `${((athlete as any).recovery_score ?? 50)}%`, 
                              backgroundColor: ((athlete as any).recovery_score ?? 50) > 80 ? '#22c55e' : ((athlete as any).recovery_score ?? 50) > 50 ? '#f59e0b' : '#ef4444' 
                            }} 
                          />
                        </div>
                      </div>

                      {/* SECTION 3 — Load Metrics (flexible, takes remaining space) */}
                      <div className="flex-1 min-w-0 px-2">
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs text-text-secondary font-bold uppercase">
                            Training Load: <span className="text-text-primary">{athlete.weekly_load}</span> / 650
                            <span className={`ml-1 text-xs ${
                              athlete.load_trend === 'up' ? 'text-red-400' : 
                              athlete.load_trend === 'down' ? 'text-green-400' : 
                              'text-text-muted'
                            }`}>
                              {athlete.load_trend === 'up' ? '↑' : 
                               athlete.load_trend === 'down' ? '↓' : '→'}
                            </span>
                          </span>
                          <span className="font-mono text-xs text-text-muted tracking-wider truncate ml-2">
                            {athlete.last_session ? (
                              `LAST: ${athlete.last_session.title.toUpperCase()}`
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] rounded-full bg-bg-input border border-border-input text-text-muted uppercase font-mono tracking-wider font-normal">
                                LAST SESSION: N/A
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-bg-input rounded-full w-full relative overflow-visible">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min((athlete.weekly_load / 650) * 100, 100)}%`,
                              backgroundColor: loadBarColor,
                              boxShadow: `0 0 10px ${loadBarColor}`
                            }}
                          />
                        </div>
                      </div>

                      {/* SECTION 4 — Status (fixed width) */}
                      <div className="flex-shrink-0 w-[100px] flex flex-col items-center gap-1.5">
                        {/* Availability badge */}
                        <span 
                          title={getStatusTooltip(athlete.computed_status as any)}
                          className={`px-3 py-1 rounded font-mono text-xs font-bold tracking-widest uppercase w-full text-center cursor-help ${
                            athlete.computed_status === 'READY' ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/50' :
                            athlete.computed_status === 'MONITOR' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/50' :
                            athlete.computed_status === 'ALERT' ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/50' :
                            athlete.computed_status === 'INJURED' ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/50' :
                            'bg-bg-input text-text-muted border border-border-input'
                          }`}
                        >
                          {athlete.computed_status}
                        </span>

                        {/* Risk badge */}
                        <span className={`font-mono text-xs tracking-wider uppercase flex items-center gap-1 ${
                          athlete.injury_risk === 'high' ? 'text-red-500' :
                          athlete.injury_risk === 'medium' ? 'text-orange-500' :
                          'text-accent-green'
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
                      <div className="flex-shrink-0 flex items-center gap-2 relative">
                        {/* Training Plan View button */}
                        <button
                          title="Configure Training Plan"
                          onClick={() => onSelectAthlete(athlete.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-accent-green hover:bg-accent-green-dim text-text-on-green font-mono text-[10px] font-bold rounded-xl transition-all touch-manipulation min-h-[36px] uppercase tracking-wider shadow-[0_4px_10px_rgba(34,197,94,0.2)]"
                        >
                          View
                        </button>

                        {/* Dropdown trigger */}
                        <button
                          title="More Actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === athlete.id ? null : athlete.id);
                          }}
                          className="w-9 h-9 flex items-center justify-center bg-bg-input hover:bg-bg-card-hover border border-border-input rounded-xl text-text-secondary hover:text-text-primary transition-all touch-manipulation"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {/* Dropdown overlay */}
                        {activeDropdownId === athlete.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40 bg-transparent" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId(null);
                              }}
                            />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-bg-card border border-border-card rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLogInjury(athlete.id);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-all text-left"
                              >
                                <Stethoscope size={14} className="text-red-500" />
                                <span>Register Injury Record</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAssess(athlete.id);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-all text-left"
                              >
                                <BarChart3 size={14} className="text-accent-green" />
                                <span>Performance Assessment</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewAnalytics(athlete.id);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-all text-left"
                              >
                                <Video size={14} className="text-blue-500" />
                                <span>Video Analytics</span>
                              </button>
                              {onAssignProgram && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAssignProgram(athlete.id);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-all text-left border-t border-border-card"
                                >
                                  <Layers size={14} className="text-accent-green" />
                                  <span>Assign Program</span>
                                </button>
                              )}
                            </div>
                          </>
                        )}
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
      <div className="px-4 md:px-8 py-6 md:py-8 border-t border-border-card bg-bg-secondary/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center sm:items-start">
             <div className="font-label text-text-muted font-bold text-[9px] uppercase tracking-widest">REGISTRY: SQUAD_OMEGA_ACTIVE</div>
             <div className="font-label text-text-muted font-bold text-[9px] uppercase tracking-widest hidden xs:block">ENCRYPTION: AES_256_ACTIVE</div>
          </div>
         <button className="font-button text-accent-green text-[10px] hover:tracking-[0.2em] transition-all flex items-center gap-3 group active-scale">
            TACTICAL INVENTORY <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
         </button>
      </div>
    </div>
  );
}
