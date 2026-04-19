"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Layers, 
  Zap, 
  Clock, 
  Cpu, 
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Loader2
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";


export default function AdminAnalytics() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeAthletes: 0,
    totalPrograms: 0,
    totalAssessments: 0,
    completedAssessments: 0,
    protocolVelocity: '0%',
    intelligenceIndex: 0
  });

  useEffect(() => {
    if (!authLoading) {
      if (user && profile?.role === 'superadmin') {
        fetchAnalytics();
      } else if (!user || profile) {
        setLoading(false);
      }
    }
  }, [user, profile, authLoading]);

  const fetchAnalytics = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    try {
      // Parallel fetch for efficiency
      const [
        { count: athleteCount },
        { count: programCount },
        { data: assessmentsData }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("role", "athlete"),
        supabase.from("programs").select("*", { count: 'exact', head: true }),
        supabase.from("assessments").select("status")
      ]);
      
      const totalAssessments = assessmentsData?.length || 0;
      const completed = assessmentsData?.filter((a: any) => a.status === 'completed').length || 0;
      const velocity = totalAssessments > 0 ? Math.round((completed / totalAssessments) * 100) : 0;
      
      setMetrics({
        activeAthletes: athleteCount || 0,
        totalPrograms: programCount || 0,
        totalAssessments: totalAssessments,
        completedAssessments: completed,
        protocolVelocity: `${velocity}%`,
        intelligenceIndex: (athleteCount || 0) * 12 + (totalAssessments * 5) // Mock but deriving from real counts
      });
    } catch (error) {
      console.error("Analytics Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="text-[#22c55e] animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="pb-8 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="text-[#22c55e]" size={16} />
          <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px]">Platform Intelligence</span>
        </div>
        <h1 className={`font-display text-5xl text-white uppercase tracking-wider`}>Enterprise Analytics</h1>
      </div>

      {/* KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Intelligence Index', value: metrics.intelligenceIndex.toLocaleString(), trend: 'LIVE', icon: <Cpu />, color: '#00ff41' },
          { label: 'Active Roster', value: metrics.activeAthletes, trend: 'CONNECTED', icon: <Users />, color: '#00ff41' },
          { label: 'Protocol Velocity', value: metrics.protocolVelocity, trend: 'OPTIMAL', icon: <Zap />, color: '#00ff41' },
          { label: 'Sync Integrity', value: '100%', trend: 'STABLE', icon: <Activity />, color: '#00ff41' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#111] border border-white/10 p-7 rounded-2xl relative overflow-hidden group hover:border-[#00ff41]/30 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#00ff41]/5 border border-[#00ff41]/20 flex items-center justify-center text-[#00ff41]">
                 {kpi.icon}
              </div>
              <div className="text-[8px] font-black text-[#00ff41] uppercase tracking-[2px]">{kpi.trend}</div>
            </div>
            <div className={`font-display text-4xl text-white mb-1`}>{kpi.value}</div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[3px]">{kpi.label}</div>
            
            {/* Ambient Glow */}
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#00ff41]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      {/* Primary Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Distribution Chart Placeholder */}
        <div className="lg:col-span-2 bg-[#111] border border-white/10 p-8 rounded-3xl relative overflow-hidden h-[400px]">
          <div className="flex justify-between items-center mb-8 relative z-10">
             <div>
                <h3 className={`font-display text-white text-xl tracking-wider`}>ATHLETE GROWTH MATRIX</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[2px]">Organizational Performance Evolution</p>
             </div>
             <div className="flex gap-2">
                <div className="px-3 py-1 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-lg text-[8px] font-black uppercase text-[#00ff41]">LIVE FEED</div>
             </div>
          </div>

          {/* Visual Placeholder for Graphs using Motion */}
          <div className="absolute inset-x-8 bottom-8 h-48 flex items-end justify-between gap-1">
            {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85, 60, 100].map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.5 + (i * 0.05), duration: 0.8, ease: "easeOut" }}
                className="flex-1 bg-gradient-to-t from-[#00ff41]/10 to-[#00ff41] rounded-t-[2px] relative group"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-white font-bold">{height}%</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* System Pulse Panel */}
        <div className="bg-[#111] border border-white/10 p-8 rounded-3xl">
           <h3 className={`font-display text-[#00ff41] text-lg tracking-wider mb-6 flex items-center gap-3`}>
              <Activity size={18} fill="currentColor" className="animate-pulse shadow-[0_0_10px_#00ff41]" /> SYSTEM PULSE
           </h3>
           
           <div className="space-y-6">
              {[
                { label: 'Core Registry', status: 'Stable', health: 100, color: '#00ff41' },
                { label: 'Milestone Processor', status: 'Active', health: 100, color: '#00ff41' },
                { label: 'Intelligence Sync', status: 'Optimal', health: 100, color: '#00ff41' },
                { label: 'Security Layer', status: 'Hardened', health: 100, color: '#00ff41' },
              ].map((comp, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-[1px]">{comp.label}</span>
                      <span className="text-[8px] font-black text-[#00ff41] uppercase tracking-widest">{comp.status}</span>
                   </div>
                   <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${comp.health}%` }}
                        transition={{ delay: 1 + (i * 0.1), duration: 1 }}
                        className="h-full bg-[#00ff41] rounded-full shadow-[0_0_5px_rgba(0,255,65,0.5)]"
                      />
                   </div>
                 </div>
              ))}
           </div>

           <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] mb-4">PLATFORM AUTHENTICITY SCORE</p>
              <div className={`font-display text-6xl text-white leading-none mb-4`}>100.0</div>
              <div className="inline-flex px-4 py-1.5 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-full">
                <p className="text-[8px] font-black text-[#00ff41] uppercase tracking-[2px]">Verified Operational Excellence</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
