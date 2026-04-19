"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Clipboard, 
  Clock, 
  BarChart3, 
  CheckCircle2, 
  Lock,
  Zap,
  Loader2,
  Trophy,
  Activity
} from "lucide-react";


export default function MyProgramPage() {
  const { user, loading: authLoading } = useAuth();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProgram();
    }
  }, [user, authLoading]);

  const fetchProgram = async () => {
    try {
      const res = await fetch(`/api/admin/enrollments?userId=${user?.id}`);
      const data = await res.json();
      if (!data.error && data.length > 0) {
        setProgram(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch program:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="text-[#22c55e] animate-spin" size={40} />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-10 max-w-4xl text-center">
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Lock className="text-gray-500" size={32} />
        </div>
        <h2 className={`font-display text-3xl text-white uppercase tracking-wider mb-4`}>Protocol Locked</h2>
        <p className="text-white/40 text-sm max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
          You are not currently enrolled in an active training matrix. Contact your performance lead to initialize your architecture.
        </p>
      </div>
    );
  }

  const p = program.program;

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full mb-4">
            <Zap className="text-[#22c55e]" size={10} />
            <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[2px]">Core Evolution Protocol</span>
          </div>
          <h2 className={`font-display text-5xl text-white uppercase tracking-wider leading-none`}>{p.title}</h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[3px] mt-4">Initialized on {new Date(program.enrolled_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-[#111] border border-white/5 rounded-2xl flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Estimated Intensity</span>
            <span className="text-sm font-bold text-[#22c55e] uppercase">{p.level}</span>
          </div>
          <div className="px-6 py-3 bg-[#111] border border-white/5 rounded-2xl flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Cycle Duration</span>
            <span className="text-sm font-bold text-white uppercase">{p.duration}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Protocol Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Overview */}
          <section className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity size={120} />
            </div>
            <h3 className="text-[11px] font-black text-[#22c55e] uppercase tracking-[3px] mb-8">Evolution Track</h3>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-white uppercase tracking-[2px]">Protocol Completion</span>
              <span className="text-lg font-black text-[#22c55e]">35%</span>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mb-8">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '35%' }}
                className="h-full bg-[#22c55e] rounded-full shadow-[0_0_20px_#22c55e]" 
              />
            </div>
            
            <p className="text-sm text-white/60 leading-relaxed uppercase tracking-wider font-medium">
              You are currently in the **Initial Adaptation** phase. Your performance markers show consistent stability across the core biomechanical thresholds.
            </p>
          </section>

          {/* Curriculum Modules */}
          <section className="space-y-4">
             <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[3px] mb-6 px-2">Syllabus Breakdown</h3>
             {[
               { title: 'Biomechanical Initialization', status: 'completed', icon: <CheckCircle2 size={16} /> },
               { title: 'Reactive Power Development', status: 'active', icon: <Zap size={16} /> },
               { title: 'Maximal Strength Integration', status: 'locked', icon: <Lock size={16} /> },
               { title: 'Elite Resilience Protocol', status: 'locked', icon: <Lock size={16} /> },
             ].map((m, i) => (
               <div 
                 key={i}
                 className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${
                   m.status === 'completed' ? 'bg-[#22c55e]/5 border-[#22c55e]/20 opacity-60' :
                   m.status === 'active' ? 'bg-[#111] border-[#22c55e] shadow-[0_0_30px_rgba(34,197,94,0.1)]' :
                   'bg-[#111] border-white/5 opacity-40'
                 }`}
               >
                 <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                     m.status === 'completed' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                     m.status === 'active' ? 'bg-[#22c55e] text-black' : 'bg-white/5 text-gray-500'
                   }`}>
                     {m.icon}
                   </div>
                   <div>
                     <p className={`text-sm font-bold uppercase tracking-widest ${m.status === 'locked' ? 'text-gray-500' : 'text-white'}`}>{m.title}</p>
                     <p className="text-[8px] font-black uppercase tracking-[2px] text-gray-500 mt-1">{m.status}</p>
                   </div>
                 </div>
                 {m.status === 'active' && <span className="text-[10px] font-black text-[#22c55e] animate-pulse uppercase tracking-[2px]">Live Now</span>}
               </div>
             ))}
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-[#111] border border-white/5 rounded-3xl p-8">
            <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[3px] mb-8">Performance Lead</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center">
                <Trophy className="text-[#22c55e]" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-wider">H. Performance Team</p>
                <p className="text-[9px] font-black text-[#22c55e] uppercase tracking-[2px]">Elite Supervision</p>
              </div>
            </div>
            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-[2px] transition-all hover:bg-[#22c55e] hover:text-black">
              Message Coaching Staff
            </button>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-3xl p-8 overflow-hidden relative">
            <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[3px] mb-6">Cycle Insights</h3>
            <div className="space-y-4">
               {[
                 { label: 'Weekly Commitment', value: '4 Sessions' },
                 { label: 'Recovery Blocks', value: '2 Units' },
                 { label: 'Protocol Type', value: p.category },
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                   <span className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">{item.label}</span>
                   <span className="text-xs font-bold text-white tracking-widest">{item.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
