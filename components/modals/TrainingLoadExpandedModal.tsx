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
  Cell,
  Legend
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Activity, Calendar as CalendarIcon, Loader2, Save } from "lucide-react";
import { Anton } from "next/font/google";
import { useTrainingLoad } from "@/hooks/useTrainingLoad";
import { createPortal } from "react-dom";

const anton = Anton({ weight: "400", subsets: ["latin"] });

interface TrainingLoadExpandedModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: any[];
}

export default function TrainingLoadExpandedModal({ isOpen, onClose, athletes }: TrainingLoadExpandedModalProps) {
  const { getTeamWeeklyLoads, logLoad, loading } = useTrainingLoad();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [form, setForm] = useState({
    athleteId: "",
    value: "",
    type: "Tactical",
    date: new Date().toISOString().split("T")[0]
  });

  const targetMin = 500;
  const targetMax = 650;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  const loadData = async () => {
    const loads = await getTeamWeeklyLoads();
    setData(loads);
  };

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.athleteId || !form.value) return;

    const res = await logLoad(form.athleteId, parseInt(form.value), form.type, form.date);
    if (res.success) {
      setForm({ ...form, value: "" });
      setIsLogging(false);
      loadData();
    }
  };

  const getStatus = (val: number) => {
    if (val < targetMin) return { label: "UNDER", color: "#f59e0b" };
    if (val > targetMax) return { label: "OVERLOAD", color: "#ef4444" };
    return { label: "OPTIMAL", color: "#22c55e" };
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-10 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#22c55e]/5 to-transparent">
            <div>
              <div className="text-[#22c55e] text-[10px] font-black tracking-[4px] uppercase mb-1 flex items-center gap-2">
                <Activity size={12} /> TRAINING INTENSITY MATRIX
              </div>
              <h2 className={`${anton.className} text-3xl text-white tracking-wider uppercase`}>Team Load Analytics</h2>
            </div>
            <button onClick={onClose} className="p-4 rounded-full bg-white/5 text-white/30 hover:text-white transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left: Chart Area */}
              <div className="lg:col-span-2 space-y-10">
                <div className="h-[400px] w-full bg-black/40 border border-white/5 rounded-3xl p-8">
                  <div className="flex justify-between items-center mb-8">
                     <span className="text-white/20 text-[10px] font-black uppercase tracking-[3px]">AGGREGATE WEEKLY AU BY SUBJECT</span>
                     <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-amber-500" />
                           <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">UNDER</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                           <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">OPTIMAL</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-red-500" />
                           <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">OVERLOAD</span>
                        </div>
                     </div>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#444', fontSize: 10, fontFamily: 'Anton' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#444', fontSize: 10 }}
                        domain={[0, 1000]}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ 
                          backgroundColor: '#111', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '16px',
                          textTransform: 'uppercase',
                          fontFamily: 'Anton'
                        }}
                      />
                      <Bar dataKey="weekly_total" radius={[6, 6, 0, 0]}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getStatus(entry.weekly_total).color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-white/20 text-[10px] font-black uppercase tracking-[3px] mb-2">MATRIX TARGET</div>
                      <div className="text-xl font-['Anton'] text-[#22c55e]">500 - 650 AU</div>
                   </div>
                   <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-white/20 text-[10px] font-black uppercase tracking-[3px] mb-2">SYSTEM STATUS</div>
                      <div className="text-xl font-['Anton'] text-white">ACTIVE OPS cycle</div>
                   </div>
                </div>
              </div>

              {/* Right: Automation Banner & Table */}
              <div className="space-y-8 lg:col-span-1">
                <div className="p-6 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-3xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 bg-[url('/bg-texture.png')] mix-blend-overlay w-full h-full pointer-events-none" />
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center text-black">
                         <Activity size={20} />
                      </div>
                      <div className="text-white text-[12px] font-black uppercase tracking-[3px]">System Automated</div>
                   </div>
                   <p className="text-white/60 text-[11px] leading-relaxed font-medium">
                     Training Loads (AU) are now synchronized globally in the background. The matrix automatically extracts duration and exertion metrics when Command Staff marks a session as <strong>COMPLETED</strong>. Manual entry is no longer required.
                   </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                   <div className="p-6 border-b border-white/5 bg-white/5">
                      <span className="text-white/20 text-[10px] font-black uppercase tracking-[3px]">SUBJECT BREAKDOWN</span>
                   </div>
                   <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto scrollbar-hide">
                      {data.map((subject, i) => (
                        <div key={i} className="p-6 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                           <div>
                              <div className="text-white font-bold text-xs uppercase tracking-wide">{subject.name}</div>
                              <div className="text-[10px] font-black tracking-widest mt-1" style={{ color: getStatus(subject.weekly_total).color }}>
                                 {getStatus(subject.weekly_total).label}
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-xl font-['Anton'] text-white">{subject.weekly_total}</div>
                              <div className="text-[8px] text-white/10 font-bold uppercase tracking-widest">AU TOTAL</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
