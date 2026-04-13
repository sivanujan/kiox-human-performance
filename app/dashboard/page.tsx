"use client";

import { createClient } from '@/utils/supabase/client';
import { format } from "date-fns";
import { TrainingSession } from "@/hooks/useSessions";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Zap, 
  Target, 
  ShieldCheck, 
  Clock, 
  Star,
  Bell,
  Calendar as CalendarIcon,
  Play,
  TrendingUp,
  Loader2,
  MapPin,
  ArrowRight,
  Video
} from "lucide-react";
import { Anton, Orbitron } from "next/font/google";
import Link from "next/link";

// Dashboard Components
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import MetricCard from "@/components/dashboard/MetricCard";
import SwipeableCards from "@/components/dashboard/SwipeableCards";
import StatusBadge from "@/components/dashboard/StatusBadge";
import GoalProgressBar from "@/components/dashboard/GoalProgressBar";
import WellnessCard from "@/components/dashboard/WellnessCard";
import ProgressBar from "@/components/dashboard/ProgressBar";
import AthleteLoadCard from "@/components/dashboard/AthleteLoadCard";
import AthleteAlertsCard from "@/components/dashboard/AthleteAlertsCard";

const anton = Anton({ 
  weight: '400', 
  subsets: ['latin'] 
});

const orbitron = Orbitron({ subsets: ["latin"] });

export default function DashboardOverview() {
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [metrics, setMetrics] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<TrainingSession[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any>({
    activePlan: null,
    activeInjuries: [],
    pendingSurveys: [],
    videoFeedback: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
      fetchAthleteSessions();
    }
  }, [user, authLoading]);

  const fetchAthleteSessions = async () => {
    if (!supabase || !user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    
    const { data, error } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("scheduled_date", today)
      .contains("assigned_athletes", [user.id])
      .order("scheduled_time", { ascending: true });

    if (!error && data) {
      setTodaySessions(data as TrainingSession[]);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metRes, schRes, notRes, perfRes] = await Promise.all([
        fetch('/api/athlete/metrics'),
        fetch('/api/athlete/schedule'),
        fetch('/api/athlete/notifications'),
        fetch('/api/athlete/performance-hub')
      ]);
      
      const [metData, schData, notData, perfData] = await Promise.all([
        metRes.json(), 
        schRes.json(), 
        notRes.json(),
        perfRes.json()
      ]);

      if (!metData.error) setMetrics(metData);
      if (!schData.error) setSchedule(schData);
      if (!notData.error) setNotifications(notData);
      if (!perfData.error) setPerformanceData(perfData);
    } catch (err) {
      console.error("Failed to sync dashboard matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-[#22c55e] animate-spin" size={48} />
          <p className={`${orbitron.className} text-[#22c55e] text-[10px] tracking-[4px] uppercase animate-pulse`}>Synchronizing Matrix...</p>
        </div>
      </div>
    );
  }

  const athleteName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Athlete';
  const nextSession = schedule.find(s => s.type !== 'rest') || { session: 'No Session Scheduled', time: '--:--' };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* ========================
          SECTION 1: HEADER
          ======================== */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group overflow-hidden bg-gradient-to-br from-[#22c55e]/[0.08] to-transparent border border-[#22c55e]/15 rounded-[24px] p-8 flex flex-col md:flex-row justify-between items-center gap-8"
      >
        {/* Left: Profile */}
        <div className="flex items-center gap-6 w-full md:w-auto">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-[#22c55e]/10 border-2 border-[#22c55e] shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center justify-center text-3xl font-['Anton'] text-[#22c55e] z-10 relative">
              {athleteName[0].toUpperCase()}
            </div>
            <div className="absolute inset-0 bg-[#22c55e]/20 blur-xl rounded-full -z-0" />
          </div>

          <div>
            <div className="text-[#22c55e] text-[10px] sm:text-[11px] font-['Anton'] tracking-[0.3em] uppercase mb-1">
              Athlete Portal // Baseline Active
            </div>
            <h2 className={`${anton.className} text-3xl md:text-4xl text-white tracking-wider mb-3 leading-none`}>
              {athleteName.toUpperCase()}
            </h2>
            <div className="flex flex-wrap gap-3">
              <StatusBadge 
                label="TRAINING"
                value={metrics?.training_status?.toUpperCase() || 'READY'}
                colors={{
                  ready: '#22c55e',
                  monitor: '#f59e0b',
                  alert: '#ef4444',
                }}
              />
              <StatusBadge
                label="RECOVERY"
                value={`${metrics?.recovery_index || 0}%`}
                color="#22c55e"
              />
            </div>
          </div>
        </div>

        {/* Right: Next Session */}
        <div className="w-full md:w-auto bg-black/40 border border-[#22c55e]/20 rounded-2xl p-6 text-center md:text-right relative">
           <div className="text-white/20 text-[10px] font-['Anton'] tracking-[0.3em] uppercase mb-1">
             NEXT OPS SESSION
           </div>
           <div className="text-white font-['Anton'] text-xl tracking-wider mb-2">
             {nextSession.session.toUpperCase()}
           </div>
           <div className="text-[#22c55e] font-['Anton'] text-3xl drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]">
             {nextSession.time}
           </div>
           <div className="absolute bottom-2 right-4 text-[40px] opacity-5 font-['Anton'] pointer-events-none">
             SYSTEM_01
           </div>
        </div>
      </motion.div>

      {/* ========================
          SECTION 2: WEEKLY SUMMARY
          ======================== */}
      <SwipeableCards cards={[
        { 
          label: 'WEEKLY SCORE',
          value: `${metrics?.weekly_score || 0}/100`,
          stars: Math.round((metrics?.weekly_score || 0) / 20),
          icon: '⭐',
          color: '#22c55e',
        },
        { 
          label: 'TRAINING LOAD',
          value: `${metrics?.weekly_load || 0} AU`,
          icon: '🏋️',
          color: '#22c55e',
        },
        { 
          label: 'INJURY RISK',
          value: (metrics?.injury_risk || 'LOW').toUpperCase(),
          icon: '🩺',
          color: metrics?.injury_risk === 'high' ? '#ef4444' : metrics?.injury_risk === 'medium' ? '#f59e0b' : '#22c55e',
        },
        { 
          label: 'RECOVERY INDEX',
          value: `${metrics?.recovery_index || 0}%`,
          icon: '💪',
          color: '#22c55e',
        },
      ]} />

      {/* ========================
          SECTION 3: QUICK METRICS
          ======================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOP SPEED', value: metrics?.top_speed || 0, unit: 'km/h', icon: '⚡', trend: '↑' },
          { label: 'DISTANCE', value: metrics?.distance || 0, unit: 'km', icon: '📍', trend: '↑' },
          { label: 'SPRINTS', value: metrics?.sprints || 0, icon: '🏃', trend: '→' },
          { label: 'HRV', value: metrics?.hrv || 0, unit: 'ms', icon: '💓', trend: '↑' },
        ].map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          {/* PHYSICAL PERFORMANCE */}
          <CollapsibleSection title="⚡ PHYSICAL PERFORMANCE">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'VO₂ MAX', value: metrics?.vo2_max || 0, trend: '↑' },
                { label: 'RESTING HR', value: `${metrics?.resting_hr || 0} BPM`, trend: '↓' },
                { label: 'POWER OUTPUT', value: `${metrics?.power_output || 0} W`, trend: '↑' },
                { label: 'HIGH INTENSITY', value: metrics?.high_intensity_efforts || 0, unit: 'efforts' },
              ].map((m, i) => (
                <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center group">
                  <div>
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{m.label}</div>
                    <div className="text-xl font-['Anton'] text-white mt-1 group-hover:text-[#22c55e] transition-colors">{m.value}</div>
                  </div>
                  <div className="text-[#22c55e] font-black">{m.trend}</div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* MATCH METRICS */}
          <CollapsibleSection title="⚽ MATCH METRICS" defaultOpen={false}>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'GOALS', value: metrics?.goals || 0 },
                { label: 'ASSISTS', value: metrics?.assists || 0 },
                { label: 'xG', value: metrics?.xg || 0 },
                { label: 'PASS ACC.', value: `${metrics?.pass_accuracy || 0}%` },
                { label: 'DUELS WON', value: `${metrics?.duels_won || 0}%` },
                { label: 'PRESSURES', value: metrics?.pressures || 0 },
              ].map((m, i) => (
                <div key={i} className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-['Anton'] text-[#22c55e]">{m.value}</div>
                  <div className="text-[8px] font-black text-white/20 tracking-[1.5px] uppercase mt-2">{m.label}</div>
                </div>
              ))}
            </div>
            
            {/* Heatmap Placeholder */}
            <div className="bg-[#00ff41]/5 border border-[#00ff41]/20 rounded-xl p-5 flex items-center justify-between cursor-pointer group hover:bg-[#00ff41]/10 transition-all">
              <div>
                <div className="text-[#22c55e] font-['Anton'] text-sm tracking-wider uppercase">Tactical Heatmap</div>
                <div className="text-white/30 text-[10px] uppercase font-bold mt-1">Access Spatial Density Matrix →</div>
              </div>
              <div className="text-4xl filter grayscale group-hover:grayscale-0 transition-all">🗺️</div>
            </div>
          </CollapsibleSection>

          {/* COGNITIVE & MENTAL */}
          <CollapsibleSection title="🧠 COGNITIVE & MENTAL">
            <div className="space-y-6">
              {[
                { label: 'REACTION TIME', value: `${metrics?.reaction_time || 0} ms`, trend: '↑', good: 'lower is better' },
                { label: 'DECISION SCORE', value: `${metrics?.decision_score || 0}/10`, progress: (metrics?.decision_score || 0) * 10 },
                { label: 'FOCUS SCORE', value: `${metrics?.focus_score || 0}%`, progress: metrics?.focus_score || 0 },
              ].map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{m.label}</div>
                    <div className="text-sm font-['Anton'] text-[#22c55e]">{m.value}</div>
                  </div>
                  {m.progress !== undefined && <ProgressBar value={m.progress} color="#22c55e" height={4} />}
                </div>
              ))}
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                 <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">STRESS LEVEL</span>
                 <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                   metrics?.stress_level === 'low' ? 'bg-[#22c55e]/10 text-[#22c55e]' : metrics?.stress_level === 'moderate' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                 }`}>
                   {metrics?.stress_level?.toUpperCase() || 'LOW'}
                 </span>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* TODAY'S SCHEDULE - NEW HIGH-FIDELITY TRACKING */}
          <div className="bg-[#111] border border-[#22c55e]/20 rounded-3xl p-10 relative overflow-hidden h-fit">
            <div className="flex justify-between items-center mb-10">
               <div className="text-[#22c55e] font-['Anton'] text-sm tracking-[0.2em] uppercase flex items-center gap-3">
                  <CalendarIcon size={18} /> Today's Operational Status
               </div>
               <div className="flex items-center gap-2 px-4 py-1.5 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                  <span className="text-[9px] font-black text-[#22c55e] lg:tracking-widest">LIVE OPS</span>
               </div>
            </div>

            <div className="space-y-4 mb-2">
              {todaySessions.length === 0 ? (
                <div className="py-12 text-center text-white/10 uppercase font-bold text-[10px] tracking-widest italic border border-white/5 rounded-2xl bg-white/[0.01]">
                  Field Operations Clear // No Sessions Detected
                </div>
              ) : (
                todaySessions.map((s, i) => (
                  <div key={i} className={`flex items-center gap-6 p-6 rounded-2xl border-l-[6px] border border-white/5 transition-all group ${
                    s.session_type === 'STRENGTH' ? 'border-l-amber-500 bg-amber-500/5' :
                    s.session_type === 'TACTICAL' ? 'border-l-blue-500 bg-blue-500/5' :
                    s.session_type === 'CONDITIONING' ? 'border-l-[#22c55e] bg-[#22c55e]/5' :
                    'border-l-purple-500 bg-purple-500/5'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                           s.status === 'IN_PROGRESS' ? 'bg-[#22c55e] text-black animate-pulse' : 'bg-white/5 text-white/40'
                         }`}>
                           {s.status}
                         </span>
                         <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={10} /> {s.scheduled_time.slice(0, 5)}
                         </span>
                      </div>
                      <h4 className="text-white font-['Anton'] text-lg tracking-wider uppercase truncate">{s.title}</h4>
                      <div className="flex items-center gap-3 text-white/30 text-[9px] font-black tracking-widest uppercase mt-1">
                         <div className="flex items-center gap-1.5"><MapPin size={10} /> {s.location || 'HQ FIELD'}</div>
                         <div className="flex items-center gap-1.5"><Activity size={10} /> {s.duration_minutes}m</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="absolute top-0 right-0 p-8 opacity-5 font-['Anton'] text-8xl pointer-events-none">SQUAD</div>
         </div>

          {/* PERSONAL ALERTS */}
          <AthleteAlertsCard athleteId={user?.id || ''} />

          {/* PERSONAL TRAINING LOAD */}
          <AthleteLoadCard athleteId={user?.id || ''} currentAu={metrics?.weekly_load || 0} />

          {/* MY ELITE PROGRAM */}
          <CollapsibleSection title="🔥 MY ELITE PROGRAM" defaultOpen={true}>
            {performanceData.activePlan ? (
              <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 p-6 rounded-3xl relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <div className="text-[#22c55e] text-[10px] font-black tracking-[4px] uppercase mb-1">CURRENT PHASE</div>
                       <h3 className="text-white font-['Anton'] text-2xl tracking-wider uppercase">{performanceData.activePlan.title}</h3>
                    </div>
                    <div className="bg-[#22c55e] text-black font-['Anton'] text-[10px] px-4 py-1 rounded-full tracking-widest">
                       {performanceData.activePlan.phase.toUpperCase()}
                    </div>
                 </div>
                 
                 <div className="p-4 bg-black/40 border border-white/5 rounded-2xl mb-6">
                    <div className="text-white/20 text-[9px] font-black tracking-[3px] uppercase mb-2">COACH INSTRUCTIONS</div>
                    <p className="text-white/70 text-xs leading-relaxed italic">"{performanceData.activePlan.notes}"</p>
                 </div>

                 <div className="flex justify-between items-center text-[9px] font-black text-white/20 uppercase tracking-[2px]">
                    <div>EFFECTIVE: {new Date(performanceData.activePlan.effective_date).toLocaleDateString()}</div>
                    <div className="text-[#22c55e]">AUTO-SYNCHRONIZED</div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 text-7xl opacity-[0.03] font-['Anton'] pointer-events-none group-hover:opacity-[0.06] transition-opacity">PLAN</div>
              </div>
            ) : (
              <div className="py-12 text-center bg-white/[0.02] border border-white/5 rounded-3xl text-white/10 uppercase font-bold text-[10px] tracking-widest italic">
                NO ACTIVE PROGRAM ASSIGNED
              </div>
            )}
          </CollapsibleSection>

          {/* PROVISIONAL RECOVERY HUB */}
          <CollapsibleSection title="🩺 RECOVERY HUB" defaultOpen={performanceData.activeInjuries.length > 0}>
             <div className="space-y-4">
                <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest mb-1">ACTIVE CLINICAL LOGS</div>
                {performanceData.activeInjuries.length === 0 ? (
                  <div className="py-6 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-white/10 uppercase font-bold text-[9px] tracking-widest italic">
                    NO ACTIVE INJURIES // OPTIMAL STATUS
                  </div>
                ) : (
                  performanceData.activeInjuries.map((injury: any, i: number) => (
                    <div key={i} className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl relative group overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10 font-['Anton'] text-4xl pointer-events-none group-hover:opacity-20 transition-opacity">MED</div>
                       <div className="relative z-10">
                          <div className="flex justify-between items-center mb-2">
                             <div className="text-red-500 font-['Anton'] text-[11px] tracking-widest uppercase flex items-center gap-2">
                                <ShieldCheck size={14} /> {injury.injury_type}
                             </div>
                             <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                               injury.severity === 'High' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-500'
                             }`}>
                               {injury.severity} SEVERITY
                             </div>
                          </div>
                          <div className="text-white font-bold text-sm uppercase tracking-wide mb-1">{injury.body_part}</div>
                          <div className="text-white/40 text-[10px] font-medium leading-relaxed mb-3">"{injury.notes}"</div>
                          <div className="flex justify-between items-center pt-3 border-t border-red-500/10">
                             <div className="text-red-500/60 text-[9px] font-black uppercase tracking-widest">STATUS: {injury.status.toUpperCase()}</div>
                             <div className="text-white/10 text-[8px] font-black uppercase">{new Date(injury.logged_at).toLocaleDateString()}</div>
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </CollapsibleSection>

          {/* RECOVERY & WELLNESS */}
          <CollapsibleSection title="💤 RECOVERY & WELLNESS">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'SLEEP', value: `${metrics?.sleep_score || 0}/10`, icon: '😴', progress: (metrics?.sleep_score || 0) * 10 },
                { label: 'SORENESS', value: `${metrics?.soreness || 0}/10`, icon: '🩹', progress: (metrics?.soreness || 0) * 10, invert: true },
                { label: 'HYDRATION', value: (metrics?.hydration || 'Optimal').toUpperCase(), icon: '💧', color: metrics?.hydration === 'Low' ? '#f59e0b' : '#22c55e' },
                { label: 'MOOD', value: (metrics?.mood || 'Good').toUpperCase(), icon: '😊', color: '#22c55e' },
              ].map((m, i) => (
                <WellnessCard key={i} {...m} />
              ))}
            </div>

            {/* Recommendations */}
            <div className="bg-[#22c55e]/[0.02] border border-[#22c55e]/10 rounded-2xl p-6">
              <div className="text-[#22c55e] font-['Anton'] text-[11px] tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                <Target size={14} /> Recovery Protocol
              </div>
              <div className="space-y-3">
                {[
                  '🤸 Light mobility session (20m)',
                  '❄️ Cold plunge protocol (8 min)',
                  '🥩 Optimize protein intake (+20g)',
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/40 text-[11px] uppercase tracking-wider bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="w-1 h-1 rounded-full bg-[#22c55e]" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* VIDEO & TACTICAL FEEDBACK */}
          <CollapsibleSection title="🎬 TACTICAL REVIEW" defaultOpen={true}>
             <div className="space-y-4 mb-6">
                <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest mb-1">COACH FEEDBACK TRANSMISSIONS</div>
                {performanceData.videoFeedback.length === 0 ? (
                  <div className="py-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-white/10 uppercase font-bold text-[9px] tracking-widest italic">
                    NO TACTICAL CLIPS ASSIGNED
                  </div>
                ) : (
                  performanceData.videoFeedback.map((clip: any, i: number) => (
                    <div key={i} className="flex flex-col gap-3 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-blue-500/30 cursor-pointer group transition-all">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Play size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-white font-bold tracking-wide uppercase">{clip.title}</span>
                        </div>
                        <div className="bg-blue-500/10 text-blue-500 text-[9px] font-['Anton'] px-3 py-1 rounded-full uppercase tracking-widest">
                          {clip.category}
                        </div>
                      </div>
                      <Link 
                        href={clip.video_url} 
                        target="_blank"
                        className="relative rounded-lg overflow-hidden aspect-video bg-black/40 flex items-center justify-center border border-white/5"
                      >
                         <Video className="text-white/10" size={32} />
                         <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute bottom-3 right-3 bg-black/80 px-3 py-1 rounded text-[8px] font-black text-white/40 uppercase tracking-widest">
                           WATCH FEEDBACK →
                         </div>
                      </Link>
                      {clip.notes && <p className="text-[10px] text-white/30 italic leading-relaxed px-1">"{clip.notes}"</p>}
                    </div>
                  ))
                )}
             </div>
          </CollapsibleSection>

          {/* GOALS & PROGRESS */}
          <CollapsibleSection title="🎯 GOALS & PROGRESS">
             <GoalProgressBar 
                label="SPRINT SPEED" 
                current={metrics?.sprint_speed_current || 0} 
                target={metrics?.sprint_speed_target || 35} 
                unit="km/h" 
                change="+3.2%" 
             />
             <GoalProgressBar 
                label="PASS ACCURACY" 
                current={metrics?.pass_accuracy || 0} 
                target={metrics?.pass_accuracy_target || 90} 
                unit="%" 
             />
             <GoalProgressBar 
                label="FATIGUE DIPS" 
                current={metrics?.fatigue_dips_per_week || 0} 
                target={1} 
                unit="/wk" 
                invert={true}
             />
          </CollapsibleSection>
        </div>
      </div>

      {/* DASHBOARD BOTTOM SECTION - NOTIFICATIONS & SCHEDULE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        
        {/* PENDING PERFORMANCE SURVEYS */}
        <div className="bg-[#111] border border-amber-500/20 rounded-3xl p-8 relative overflow-hidden h-fit">
           <div className="flex justify-between items-center mb-8">
              <div className="text-amber-500 font-['Anton'] text-sm tracking-[0.2em] uppercase flex items-center gap-3">
                 <Activity size={18} /> ACTION ITEMS
              </div>
              <div className="px-3 py-1 bg-amber-500 text-black text-[10px] font-black rounded-full uppercase tracking-widest">
                {performanceData.pendingSurveys.length} PENDING
              </div>
           </div>

           <div className="space-y-4">
             {performanceData.pendingSurveys.length === 0 ? (
               <div className="py-10 text-center text-white/10 uppercase font-bold text-[10px] tracking-widest italic">
                 NO PENDING ACTION ITEMS
               </div>
             ) : (
               performanceData.pendingSurveys.map((survey: any, i: number) => (
                 <div key={i} className="group bg-white/5 border border-white/5 p-5 rounded-2xl hover:border-amber-500/30 transition-all cursor-pointer">
                    <div className="flex justify-between items-center mb-4">
                       <div className="text-white font-bold text-sm uppercase tracking-wide">{survey.survey_type}</div>
                       <ArrowRight size={16} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                    </div>
                    <div className="text-white/40 text-[10px] font-medium leading-relaxed mb-4">"{survey.instructions}"</div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                       <div className="text-amber-500/60 text-[9px] font-black uppercase tracking-widest">DUE: {new Date(survey.due_date).toLocaleDateString()}</div>
                       <button className="text-[10px] font-black text-white/40 group-hover:text-amber-500 transition-colors uppercase tracking-widest">START SESSION →</button>
                    </div>
                 </div>
               ))
             )}
           </div>
           <div className="absolute top-0 right-0 p-8 opacity-5 font-['Anton'] text-8xl pointer-events-none">TASK</div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="bg-[#111] border border-[#22c55e]/20 rounded-3xl p-8 relative overflow-hidden h-fit">
           <div className="flex justify-between items-center mb-8">
              <div className="text-[#22c55e] font-['Anton'] text-sm tracking-[0.2em] uppercase flex items-center gap-3">
                 <Bell size={18} /> System Alerts
              </div>
              <div className="px-3 py-1 bg-[#22c55e] text-black text-[10px] font-black rounded-full">
                {notifications.filter(n => !n.read).length} NEW
              </div>
           </div>

           <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-[#22c55e]/20">
             {notifications.length === 0 ? (
               <div className="py-10 text-center text-white/10 uppercase font-bold text-[10px] tracking-widest italic">
                 Neutral Status // No alerts pending
               </div>
             ) : (
               notifications.map((n, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl relative group">
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
                    n.type === 'warning' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e]'
                  }`}>
                    {n.type === 'warning' ? '!' : 'i'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/50 leading-relaxed font-medium">{n.message}</p>
                    <p className="text-[8px] text-white/10 mt-2 uppercase font-black tracking-widest">
                      {new Date(n.created_at).toLocaleDateString()} // {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
               ))
             )}
           </div>
           <div className="absolute top-0 right-0 p-8 opacity-5 font-['Anton'] text-8xl pointer-events-none">NOTIF</div>
        </div>

        {/* WEEKLY PLAN */}
        <div className="bg-[#111] border border-[#22c55e]/20 rounded-3xl p-8 relative overflow-hidden h-fit">
           <div className="flex justify-between items-center mb-8">
              <div className="text-white/30 font-['Anton'] text-sm tracking-[0.2em] uppercase flex items-center gap-3">
                 <CalendarIcon size={18} /> Weekly Plan Overview
              </div>
              <Link href="/dashboard/booking" className="bg-[#22c55e] hover:bg-white text-black font-['Anton'] text-[10px] px-6 py-2 rounded-lg transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                BOOK OPS +
              </Link>
           </div>

           <div className="divide-y divide-white/5">
             {schedule.length === 0 ? (
               <div className="py-10 text-center text-white/10 uppercase font-bold text-[10px] tracking-widest italic">
                 Schedule Matrix Not Synthesized
               </div>
             ) : (
               schedule.map((day, i) => (
                <div key={i} className="flex items-center gap-6 py-4 group">
                  <div className="w-14 shrink-0 font-['Anton'] text-[#22c55e] text-xs tracking-[0.2em] uppercase group-hover:tracking-[0.3em] transition-all">
                    {day.day.slice(0,3)}
                  </div>
                  <div className={`flex-1 text-sm font-medium ${day.type === 'rest' ? 'text-white/20 italic' : 'text-white/80'}`}>
                    {day.session.toUpperCase()}
                  </div>
                  {day.time && (
                    <div className="text-[#22c55e] font-['Anton'] text-xs tracking-widest">
                      {day.time}
                    </div>
                  )}
                </div>
               ))
             )}
           </div>
           <div className="absolute top-0 right-0 p-8 opacity-5 font-['Anton'] text-8xl pointer-events-none">PLAN</div>
        </div>

      </div>

    </div>
  );
}
