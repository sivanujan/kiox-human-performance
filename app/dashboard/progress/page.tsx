"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  Activity, 
  TrendingUp, 
  Zap, 
  Target,
  Dumbbell,
  ArrowUpRight,
  Loader2,
  PieChart
} from "lucide-react";


export default function ProgressPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!authLoading && user) {
        try {
          const [mRes, hRes] = await Promise.all([
            fetch('/api/athlete/metrics'),
            fetch('/api/athlete/performance-history')
          ]);
          
          const mData = await mRes.json();
          const hData = await hRes.json();

          if (!mData.error) setMetricsData(mData);
          if (!Array.isArray(hData.error)) setHistoryData(hData || []);
        } catch (err) {
          console.error("Analytics Sync Error:", err);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [authLoading, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="text-accent-green animate-spin" size={40} />
      </div>
    );
  }

  const metrics = [
    { 
      label: 'Reactive Power', 
      value: metricsData?.power_output || 0, 
      change: '+5%', 
      color: 'var(--accent-green)' 
    },
    { 
      label: 'Metabolic Efficiency', 
      value: metricsData?.vo2_max || 0, 
      change: '+2%', 
      color: 'var(--accent-green)' 
    },
    { 
      label: 'Force Output', 
      value: Math.round(((metricsData?.top_speed || 0) / (metricsData?.sprint_speed_target || 35)) * 100), 
      change: '+12%', 
      color: 'var(--accent-green)' 
    },
    { 
      label: 'Recovery Rate', 
      value: metricsData?.recovery_index || 0, 
      change: '-1%', 
      color: metricsData?.recovery_index > 70 ? 'var(--accent-green)' : '#f59e0b' 
    },
  ];

  const distribution = [
    { label: 'Mechanical Load', val: Math.min(100, Math.round(((metricsData?.weekly_load || 0) / 650) * 100)), icon: <Dumbbell size={14} /> },
    { label: 'Physiological Strain', val: metricsData?.stress_level === 'high' ? 85 : metricsData?.stress_level === 'moderate' ? 50 : metricsData?.stress_level === 'low' ? 25 : 0, icon: <Activity size={14} /> },
    { label: 'Focus / Accuracy', val: metricsData?.focus_score || 0, icon: <Target size={14} /> },
  ];

  // Process history for the chart (grouped by date or just last 9 points)
  const chartPoints = historyData.length > 0 
    ? historyData.slice(-9).map(h => Math.round((h.power_output_watts / 1000) * 100)) // Normalize watts to %
    : [0, 0, 0, 0, 0, 0, 0, 0, 0]; // Show empty baseline for new users
  
  const chartLabels = historyData.length > 0
    ? historyData.slice(-9).map(h => new Date(h.date).toLocaleDateString('en-US', { month: 'short' }))
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h2 className={`font-display text-5xl text-text-primary uppercase tracking-wider leading-none`}>Performance Analytics</h2>
          <p className="text-text-secondary text-[10px] font-black uppercase tracking-[3px] mt-4">Quantitative evolution of your core athletic markers</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-bg-primary/50 border border-border-primary/50 rounded-xl">
           <Activity size={16} className="text-accent-green" />
           <span className="text-[10px] font-black text-text-primary uppercase tracking-[2px]">Real-time Sync: Active</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {metrics.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-bg-card border border-border-primary/50 p-6 rounded-2xl relative overflow-hidden group hover:border-accent-green/20 transition-all shadow-lg shadow-accent/5"
          >
            <div className="text-[8px] font-black text-text-muted tracking-[3px] uppercase mb-1">{m.label}</div>
            <div className={`text-4xl font-black mb-1 drop-shadow-2xl`} style={{ color: m.color }}>
              {m.value}%
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest" style={{ color: m.change.startsWith('+') ? 'var(--accent-green)' : '#f59e0b' }}>
              <ArrowUpRight size={10} className={m.change.startsWith('+') ? '' : 'rotate-90'} /> {m.change}
            </div>
            <div className="absolute top-0 right-0 p-4 pointer-events-none text-text-primary/5 group-hover:text-text-primary/10 transition-colors">
               <TrendingUp size={48} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Progression Chart (Placeholder with Framer Motion) */}
        <div className="lg:col-span-2 bg-bg-card border border-border-primary/50 rounded-3xl p-10 relative overflow-hidden shadow-2xl shadow-accent/5">
          <div className="flex justify-between items-center mb-12">
            <div>
               <h3 className="text-[12px] font-black text-text-primary uppercase tracking-[3px] mb-1">Architecture Evolution</h3>
               <p className="text-[9px] font-black text-text-muted uppercase tracking-[2px]">Monthly performance indices</p>
            </div>
            <div className="flex gap-2">
               <div className="px-3 py-1 bg-bg-primary/50 border border-border-primary/50 rounded-lg text-[8px] font-black text-text-primary uppercase tracking-[2px]">30D</div>
               <div className="px-3 py-1 bg-accent-green/10 text-accent-green border border-accent-green/30 rounded-lg text-[8px] font-black uppercase tracking-[2px]">90D</div>
            </div>
          </div>

          {/* Simple Animated SVG Chart Placeholder */}
          <div className="h-[250px] w-full relative flex items-end gap-1 px-4">
             {chartPoints.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4">
                   <motion.div 
                     initial={{ height: 0 }}
                     animate={{ height: `${val}%` }}
                     transition={{ duration: 1, delay: i * 0.1 }}
                     className="w-full bg-gradient-to-t from-accent-green/5 to-accent-green/40 border-t-2 border-accent-green rounded-t-lg relative group"
                   >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-card text-text-primary border border-border-primary/50 text-[9px] font-black px-2 py-1 rounded shadow-xl">
                         {val}%
                      </div>
                   </motion.div>
                   <span className="text-[8px] font-black text-text-muted uppercase tracking-[2px]">{chartLabels[i]}</span>
                </div>
             ))}
          </div>
        </div>

        {/* Breakdown Sidebar */}
        <div className="space-y-8">
           <div className="bg-bg-card border border-border-primary/50 rounded-3xl p-8 shadow-2xl shadow-accent/5">
              <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[3px] mb-8">Metric Distribution</h3>
              <div className="space-y-6">
                 {distribution.map((item, i) => (
                   <div key={i} className="space-y-2">
                     <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[2px]">
                        <div className="flex items-center gap-2 text-text-secondary">
                           {item.icon} {item.label}
                        </div>
                        <span className="text-text-primary">{item.val}%</span>
                     </div>
                     <div className="w-full h-1 bg-bg-primary/50 border border-border-primary/50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.val}%` }}
                          transition={{ duration: 1.5 }}
                          className="h-full bg-accent-green" 
                        />
                     </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-bg-card to-bg-secondary border border-border-primary/50 rounded-3xl p-8 shadow-2xl shadow-accent/5">
              <h3 className="text-[11px] font-black text-accent-green uppercase tracking-[3px] mb-6">Elite Benchmark</h3>
              <p className="text-xs text-text-secondary leading-relaxed uppercase tracking-wider font-semibold mb-6">
                Your current force-to-velocity ratio is scoring in the **Top 8th Percentile** for your deploy base.
              </p>
              <button className="w-full py-4 bg-accent-green/5 border border-accent-green/20 rounded-xl text-[9px] font-black text-accent-green uppercase tracking-[2px] transition-all hover:bg-accent-green hover:text-text-on-green">
                Export Performance Dossier
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
