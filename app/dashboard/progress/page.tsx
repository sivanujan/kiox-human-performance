"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Zap, 
  Target,
  Dumbbell,
  ArrowUpRight,
  Loader2,
  Scale,
  ShieldCheck,
  Bookmark
} from "lucide-react";

export default function ProgressPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  
  // New Assessments state
  const [latestAssessment, setLatestAssessment] = useState<any>(null);
  const [assessmentsHistory, setAssessmentsHistory] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!authLoading && user) {
        try {
          const [mRes, hRes, aRes] = await Promise.all([
            fetch('/api/athlete/metrics'),
            fetch('/api/athlete/performance-history'),
            fetch('/api/athlete/assessments')
          ]);
          
          const mData = await mRes.json();
          const hData = await hRes.json();
          const aData = await aRes.json();

          if (!mData.error) setMetricsData(mData);
          if (!Array.isArray(hData.error)) setHistoryData(hData || []);
          
          if (aData.success) {
            setLatestAssessment(aData.latest);
            setAssessmentsHistory(aData.history || []);
          }
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

  // Find previous assessment for progress delta calculations
  const previousAssessment = latestAssessment 
    ? (assessmentsHistory.find(h => h.id === latestAssessment.previous_assessment_id) || assessmentsHistory[1] || null)
    : null;

  const calculateDelta = (key: string, invert = false) => {
    if (!latestAssessment || !previousAssessment) return null;
    const currentVal = latestAssessment[key];
    const prevVal = previousAssessment[key];
    if (currentVal === null || currentVal === undefined || prevVal === null || prevVal === undefined) return null;
    
    const diff = Number(currentVal) - Number(prevVal);
    const isPositiveImprovement = invert ? diff < 0 : diff > 0;
    
    return {
      diff: diff > 0 ? `+${diff}` : `${diff}`,
      isImprovement: diff === 0 ? null : isPositiveImprovement,
      value: diff
    };
  };

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

  // VALD Muscle groups helper
  const valdMuscleGroups = [
    { key: "hamstrings", label: "Hamstrings" },
    { key: "adductors", label: "Adductors" },
    { key: "hip_extension", label: "Hip Extension" },
    { key: "hip_abduction", label: "Hip Abduction" },
    { key: "hip_flexion", label: "Hip Flexion" }
  ];

  // Functional tests helper
  const functionalTests = [
    { key: "cspine_rotation", label: "C-Spine Rotation" },
    { key: "forward_bend", label: "Forward Bend" },
    { key: "hip_ir_left", label: "Hip IR Left" },
    { key: "hip_er_both", label: "Hip ER Both" },
    { key: "deep_squat", label: "Deep Squat" },
    { key: "ankle_df", label: "Ankle DF" },
    { key: "great_toe_ext", label: "Great Toe Ext." },
    { key: "single_leg_stand", label: "Single Leg Stand" }
  ];

  // Performance impact helper
  const performanceImpacts = [
    { key: "acceleration_impact", label: "Acceleration" },
    { key: "sprint_impact", label: "Sprint" },
    { key: "change_of_direction_impact", label: "Change of Direction" },
    { key: "kicking_impact", label: "Kicking Mechanics" },
    { key: "landing_impact", label: "Landing Mechanics" },
    { key: "single_leg_stability", label: "Single-Leg Stability" }
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl space-y-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="font-display text-4xl md:text-5xl text-text-primary uppercase tracking-wider leading-none">Performance Analytics</h2>
          <p className="text-text-secondary text-[10px] font-black uppercase tracking-[3px] mt-4">Quantitative evolution of your core athletic markers</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-bg-primary/50 border border-border-primary/50 rounded-xl">
           <Activity size={16} className="text-accent-green" />
           <span className="text-[10px] font-black text-text-primary uppercase tracking-[2px]">Real-time Sync: Active</span>
        </div>
      </div>

      {/* BIOMECHANICAL & VALD ASSESSMENT ANALYSIS */}
      {latestAssessment ? (
        <div className="space-y-8 border-b border-white/5 pb-12">
          
          <div>
            <span className="text-[10px] font-black text-accent-green uppercase tracking-[4px]">Laboratory Telemetry</span>
            <h3 className="text-2xl font-display font-black text-white uppercase tracking-wider mt-1">Biomechanical & VALD Force Tracking</h3>
            {previousAssessment && (
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-1">
                Comparing current metrics against previous baseline on {previousAssessment.assessment_date}
              </p>
            )}
          </div>

          {/* 4 Score progression delta row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { key: "performance_score", label: "Performance Score", color: "text-green-400" },
              { key: "mobility_score", label: "Mobility Score", color: "text-blue-400" },
              { key: "symmetry_score", label: "Symmetry Score", color: "text-amber-500" },
              { key: "risk_score", label: "Risk Score", color: "text-red-500", invert: true }
            ].map((sc) => {
              const currentScore = latestAssessment[sc.key] || 0;
              const delta = calculateDelta(sc.key, sc.invert);

              return (
                <div key={sc.key} className="bg-bg-card border border-border-primary/50 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[120px]">
                  <div className="text-[8px] font-black text-text-muted tracking-[2px] uppercase">{sc.label}</div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className={`text-4xl font-display font-black ${sc.color}`}>{currentScore}</span>
                    <span className="text-[10px] text-gray-500 font-bold">/100</span>
                  </div>
                  
                  {delta && (
                    <div className="flex items-center gap-1 mt-2 text-[9px] font-black uppercase tracking-wider">
                      {delta.value > 0 ? (
                        <ArrowUpRight size={12} className={delta.isImprovement ? "text-green-400" : "text-red-400"} />
                      ) : delta.value < 0 ? (
                        <TrendingDown size={12} className={delta.isImprovement ? "text-green-400" : "text-red-400"} />
                      ) : null}
                      <span className={delta.isImprovement ? "text-green-400" : delta.isImprovement === false ? "text-red-400" : "text-gray-500"}>
                        {delta.diff} {delta.value === 0 ? "No change" : delta.isImprovement ? "Improvement" : "Dip"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* VALD FORCE COMPARISON BARS (Left vs Right kg) */}
            <div className="lg:col-span-7 bg-bg-card border border-border-primary/50 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-[10px] font-black text-white uppercase tracking-[2px] flex items-center gap-2">
                  <Scale size={14} className="text-accent-green" /> VALD Force Profiles (kg)
                </span>
                <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">Left vs Right Symmetry</span>
              </div>

              <div className="space-y-6">
                {valdMuscleGroups.map((group) => {
                  const leftKg = parseFloat(latestAssessment[`${group.key}_left`] || 0);
                  const rightKg = parseFloat(latestAssessment[`${group.key}_right`] || 0);
                  const maxKg = Math.max(leftKg, rightKg) || 100;
                  
                  const leftPct = (leftKg / maxKg) * 100;
                  const rightPct = (rightKg / maxKg) * 100;
                  
                  const asymVal = latestAssessment[`${group.key}_asymmetry`] || 0;
                  const status = latestAssessment[`${group.key}_status`] || "OK";
                  
                  // Compare asymmetry change
                  const prevAsym = previousAssessment ? (previousAssessment[`${group.key}_asymmetry`] || 0) : null;
                  const asymDiff = prevAsym !== null ? (asymVal - prevAsym).toFixed(1) : null;

                  return (
                    <div key={group.key} className="space-y-2">
                      
                      {/* Title & status tag row */}
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                        <span className="text-gray-300">{group.label}</span>
                        <div className="flex items-center gap-3">
                          {asymDiff && Number(asymDiff) !== 0 && (
                            <span className={`text-[8px] font-mono ${Number(asymDiff) < 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {Number(asymDiff) < 0 ? '↓' : '↑'} {Math.abs(Number(asymDiff))}% Asym
                            </span>
                          )}
                          <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${
                            status === "OK" ? "border-green-500/20 text-green-400 bg-green-500/5" :
                            status === "MONITOR" ? "border-amber-500/20 text-amber-500 bg-amber-500/5" :
                            "border-red-500/20 text-red-500 bg-red-500/5"
                          }`}>
                            {asymVal}% Asymmetry ({status})
                          </span>
                        </div>
                      </div>

                      {/* Left and Right side-by-side comparative bars */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Left bar */}
                        <div className="space-y-1 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-gray-500 uppercase">
                            <span>Left Force</span>
                            <span className="text-white">{leftKg} kg</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden w-full relative">
                            <div 
                              className="h-full bg-accent-green transition-all duration-1000" 
                              style={{ width: `${leftPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Right bar */}
                        <div className="space-y-1 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-gray-500 uppercase">
                            <span>Right Force</span>
                            <span className="text-white">{rightKg} kg</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden w-full relative">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-1000" 
                              style={{ width: `${rightPct}%` }}
                            />
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              
              {/* FUNCTIONAL MOVEMENT TESTS */}
              <div className="bg-bg-card border border-border-primary/50 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="pb-3 border-b border-white/5">
                  <span className="text-[10px] font-black text-white uppercase tracking-[2px] flex items-center gap-2">
                    <ShieldCheck size={14} className="text-accent-green" /> Functional Mobility Scores
                  </span>
                </div>
                <div className="space-y-4">
                  {functionalTests.map((test) => {
                    const score = latestAssessment[test.key] || 0;
                    const delta = calculateDelta(test.key);

                    return (
                      <div key={test.key} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                          <span className="text-gray-400">{test.label}</span>
                          <div className="flex items-center gap-2 font-mono">
                            {delta && delta.value !== 0 && (
                              <span className={delta.isImprovement ? "text-green-400" : "text-red-400"}>
                                ({delta.diff}%)
                              </span>
                            )}
                            <span className={score >= 70 ? "text-green-400" : score >= 50 ? "text-amber-500" : "text-red-500"}>{score}%</span>
                          </div>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden w-full">
                          <div 
                            className="h-full bg-accent-green transition-all duration-1000"
                            style={{ 
                              width: `${score}%`,
                              backgroundColor: score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SPORT PERFORMANCE IMPACT */}
              <div className="bg-bg-card border border-border-primary/50 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="pb-3 border-b border-white/5">
                  <span className="text-[10px] font-black text-white uppercase tracking-[2px] flex items-center gap-2">
                    <Zap size={14} className="text-accent-green" /> Sport Capacity & Impact
                  </span>
                </div>
                <div className="space-y-4">
                  {performanceImpacts.map((impact) => {
                    const score = latestAssessment[impact.key] || 0;
                    const delta = calculateDelta(impact.key);

                    return (
                      <div key={impact.key} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                          <span className="text-gray-400">{impact.label}</span>
                          <div className="flex items-center gap-2 font-mono">
                            {delta && delta.value !== 0 && (
                              <span className={delta.isImprovement ? "text-green-400" : "text-red-400"}>
                                ({delta.diff}%)
                              </span>
                            )}
                            <span className={score >= 85 ? "text-green-400" : score >= 65 ? "text-amber-500" : "text-red-500"}>{score}%</span>
                          </div>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden w-full">
                          <div 
                            className="h-full bg-accent-green transition-all duration-1000"
                            style={{ 
                              width: `${score}%`,
                              backgroundColor: score >= 85 ? '#22c55e' : score >= 65 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RETEST & NOTES WIDGET */}
              {latestAssessment.improvement_notes && (
                <div className="bg-gradient-to-br from-bg-card to-[#22c55e]/5 border border-border-primary/50 rounded-3xl p-6 shadow-xl space-y-3">
                  <div className="text-[#22c55e] font-display text-[10px] font-black tracking-widest flex items-center gap-2 uppercase">
                    <Bookmark size={12} /> Baseline Evaluation Notes
                  </div>
                  <p className="text-text-secondary text-xs leading-relaxed italic">
                    "{latestAssessment.improvement_notes}"
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>
      ) : (
        <div className="py-12 text-center bg-bg-card border border-border-primary/50 rounded-3xl text-text-muted/40 uppercase font-bold text-xs tracking-widest italic">
          No lab biomechanical assessments recorded on file yet.
        </div>
      )}

      {/* CORE VITALS & HISTORICAL CHART CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Progression Chart (Placeholder with Framer Motion) */}
        <div className="lg:col-span-2 bg-bg-card border border-border-primary/50 rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl shadow-accent/5">
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
           <div className="bg-bg-card border border-border-primary/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-accent/5">
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

           <div className="bg-gradient-to-br from-bg-card to-bg-secondary border border-border-primary/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-accent/5">
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
