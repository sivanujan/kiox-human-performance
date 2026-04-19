"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Zap, TrendingUp, Info } from "lucide-react";
import { useTrainingLoad } from "@/hooks/useTrainingLoad";
import ProgressBar from "./ProgressBar";


interface AthleteLoadCardProps {
  athleteId: string;
  currentAu: number;
}

export default function AthleteLoadCard({ athleteId, currentAu }: AthleteLoadCardProps) {
  const { getAthletePersonalTrend, loading } = useTrainingLoad();
  const [trendData, setTrendData] = useState<any[]>([]);
  
  const targetMin = 500;
  const targetMax = 650;

  useEffect(() => {
    if (athleteId) loadTrend();
  }, [athleteId]);

  const loadTrend = async () => {
    const data = await getAthletePersonalTrend(athleteId);
    setTrendData(data);
  };

  const getStatusColor = (val: number) => {
    if (val < targetMin) return "#f59e0b"; // Under
    if (val > targetMax) return "#ef4444"; // Overload
    return "#22c55e"; // Optimal
  };

  const currentStatus = valToStatus(currentAu, targetMin, targetMax);
  const progressPercent = Math.min((currentAu / targetMax) * 100, 100);

  return (
    <div className="bg-[#111] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-gray-500 text-[10px] font-black tracking-[3px] uppercase mb-1">PHYSIOLOGICAL DATA</div>
          <h3 className={`font-display text-xl text-white tracking-widest uppercase`}>My Weekly Load</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
           <Zap size={18} />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
         <span className={`font-display text-5xl`} style={{ color: getStatusColor(currentAu) }}>
           {currentAu}
         </span>
         <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">AU TOTAL</span>
      </div>

      <div className="space-y-2 mb-6">
         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span style={{ color: getStatusColor(currentAu) }}>{currentStatus}</span>
            <span className="text-gray-500">TARGET: {targetMin}-{targetMax}</span>
         </div>
         <ProgressBar value={progressPercent} color={getStatusColor(currentAu)} height={6} />
      </div>

      {/* Sparkline Trend */}
      <div className="pt-4 border-t border-white/5">
         <div className="flex justify-between items-center mb-3">
            <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1">
               <TrendingUp size={10} /> 4-WEEK INTENSITY TREND
            </div>
         </div>
         <div className="h-12 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="auGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getStatusColor(currentAu)} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={getStatusColor(currentAu)} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="au" 
                    stroke={getStatusColor(currentAu)} 
                    fillOpacity={1} 
                    fill="url(#auGradient)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[8px] text-gray-700 uppercase font-black tracking-widest">
                 Synthesizing History...
              </div>
            )}
         </div>
      </div>

      <div className="absolute -bottom-4 -right-4 opacity-[0.02] font-display text-7xl pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        LOAD
      </div>
    </div>
  );
}

function valToStatus(val: number, min: number, max: number) {
  if (val < min) return "UNDERLOAD";
  if (val > max) return "OVERLOAD ALERT";
  return "OPTIMAL RANGE";
}
