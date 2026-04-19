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
    <div className="bg-[#111] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e]">
             <Activity size={20} />
          </div>
          <div>
            <div className={`text-white/40 text-[10px] uppercase tracking-[0.3em] font-black`}>Performance Matrix</div>
            <h2 className={`font-display text-xl text-white tracking-wider uppercase`}>Training Load Management</h2>
          </div>
        </div>
        <button 
          onClick={onExpand}
          className="p-3 rounded-xl bg-white/5 text-white/40 hover:text-[#22c55e] hover:bg-[#22c55e]/10 transition-all group-hover:scale-110"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Metric Column */}
        <div className="space-y-6">
          <div className="p-6 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden">
             <div className="text-gray-500 text-[10px] font-black uppercase tracking-[3px] mb-1">TEAM AVG WEEKLY LOAD</div>
             <div className="flex items-baseline gap-2">
                <span className={`font-display text-4xl text-white`}>{teamAvg}</span>
                <span className="text-xs text-gray-500 font-bold">AU</span>
             </div>
             <div className="mt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: status.color }}>
                   {status.label} STATUS
                </span>
             </div>
             <Zap className="absolute -bottom-4 -right-4 text-white/5" size={80} />
          </div>

          <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
               <span className="text-gray-500 text-[10px] font-black uppercase tracking-[3px]">TARGET RANGE</span>
               <span className="text-[10px] text-[#22c55e] font-black tracking-widest">{targetMin} - {targetMax} AU</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
               <div className="h-full bg-amber-500/30" style={{ width: '40%' }} />
               <div className="h-full bg-[#22c55e]/50" style={{ width: '30%' }} />
               <div className="h-full bg-red-500/30" style={{ width: '30%' }} />
            </div>
          </div>
        </div>

        {/* Chart Column */}
        <div className="h-[200px] w-full bg-black/40 border border-white/5 rounded-2xl p-4">
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
                  backgroundColor: '#111', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '10px',
                  textTransform: 'uppercase'
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
        className="mt-6 w-full py-4 border border-dashed border-white/10 rounded-2xl text-[10px] text-gray-500 font-black tracking-[0.4em] hover:border-[#22c55e]/30 hover:text-[#22c55e] transition-all uppercase"
      >
        TAP TO EXPAND ANALYSIS →
      </button>
    </div>
  );
}
