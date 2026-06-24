"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { motion } from "framer-motion";
import { Activity, Maximize2, Zap } from "lucide-react";
import { useTrainingLoad } from "@/hooks/useTrainingLoad";


interface TrainingLoadWidgetProps {
  onExpand: () => void;
}

export default function TrainingLoadWidget({ onExpand }: TrainingLoadWidgetProps) {
  const { getTeamWeeklyLoads, loading } = useTrainingLoad();
  const [data, setData] = useState<any[]>([]);
  const targetMin = 500;
  const targetMax = 650;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loads = await getTeamWeeklyLoads();
    setData(loads);
  };

  const teamAvg = data.length > 0 
    ? Math.round(data.reduce((acc, curr) => acc + curr.weekly_total, 0) / data.length)
    : 0;

  const getStatus = (val: number) => {
    if (val < targetMin) return { label: "UNDER", color: "#f59e0b" };
    if (val > targetMax) return { label: "OVERLOAD", color: "#ef4444" };
    return { label: "OPTIMAL", color: "#22c55e" };
  };

  const status = getStatus(teamAvg);

  return (
    <div className="bg-bg-card border border-border-card rounded-3xl p-8 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green">
             <Activity size={20} />
          </div>
          <div>
            <div className={`text-text-muted text-[10px] uppercase tracking-[0.3em] font-black`}>Performance Matrix</div>
            <h2 className={`font-display text-xl text-text-primary tracking-wider uppercase`}>Training Load Management</h2>
          </div>
        </div>
        <button 
          onClick={onExpand}
          className="p-3 rounded-xl bg-bg-input border border-border-input text-text-muted hover:text-accent-green hover:bg-accent-green/10 transition-all group-hover:scale-110"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Metric Column */}
        <div className="space-y-6">
          <div className="p-6 bg-bg-input border border-border-input rounded-2xl relative overflow-hidden">
             <div className="text-text-muted text-[10px] font-black uppercase tracking-[3px] mb-1">TEAM AVG WEEKLY LOAD</div>
             <div className="flex items-baseline gap-2">
                <span className={`font-display text-4xl text-text-primary`}>{teamAvg}</span>
                <span className="text-xs text-text-muted font-bold">AU</span>
             </div>
             <div className="mt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: status.color }}>
                   {status.label} STATUS
                </span>
             </div>
             <Zap className="absolute -bottom-4 -right-4 text-text-primary/5" size={80} />
          </div>

          <div className="p-6 bg-bg-input border border-border-input rounded-2xl">
            <div className="flex justify-between items-center mb-4">
               <span className="text-text-muted text-[10px] font-black uppercase tracking-[3px]">TARGET RANGE</span>
               <span className="text-[10px] text-accent-green font-black tracking-widest">{targetMin} - {targetMax} AU</span>
            </div>
            <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden flex">
               <div className="h-full bg-amber-500/30" style={{ width: '40%' }} />
               <div className="h-full bg-accent-green/50" style={{ width: '30%' }} />
               <div className="h-full bg-red-500/30" style={{ width: '30%' }} />
            </div>
          </div>
        </div>

        {/* Chart Column */}
        <div className="h-[200px] w-full bg-bg-input border border-border-input rounded-2xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#444', fontSize: 8 }}
                hide
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-card)',
                  borderRadius: '12px',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)'
                }}
              />
              <Bar dataKey="weekly_total" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatus(entry.weekly_total).color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <button 
        onClick={onExpand}
        className="mt-6 w-full py-4 border border-dashed border-border-input rounded-2xl text-[10px] text-text-secondary font-black tracking-[0.4em] hover:border-accent-green/30 hover:text-accent-green transition-all uppercase"
      >
        TAP TO EXPAND ANALYSIS →
      </button>
    </div>
  );
}
