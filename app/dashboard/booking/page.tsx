"use client";

import { useState } from "react";
import { 
  Calendar, 
  Clock, 
  Shield, 
  CheckCircle2, 
  Plus, 
  Send,
  Loader2,
  AlertCircle,
  Zap,
  Target,
  Activity,
  ChevronRight,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import WeeklySchedule from "@/components/dashboard/WeeklySchedule";


export default function BookingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'SESSIONS' | 'EVALUATIONS'>('SESSIONS');

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h2 className={`font-display text-5xl md:text-6xl text-white uppercase tracking-wider leading-tight`}>
            Strategic Booking Hub
          </h2>
          <p className="text-white/40 text-[10px] md:text-[11px] font-black uppercase tracking-[4px] mt-4 flex items-center gap-2">
             <Monitor size={14} className="text-[#22c55e]" /> MATRIX_ACCESS // INITIALIZE OPERATIONAL LOGISTICS
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 w-full md:w-auto">
           <button 
             onClick={() => setActiveTab('SESSIONS')}
             className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 ${
               activeTab === 'SESSIONS' ? 'bg-[#22c55e] text-black shadow-[0_10px_20px_rgba(34,197,94,0.2)]' : 'text-white/40 hover:text-white'
             }`}
           >
             <Zap size={14} /> Training Sessions
           </button>
           <button 
             onClick={() => setActiveTab('EVALUATIONS')}
             className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 ${
               activeTab === 'EVALUATIONS' ? 'bg-[#22c55e] text-black shadow-[0_10px_20px_rgba(34,197,94,0.2)]' : 'text-white/40 hover:text-white'
             }`}
           >
             <Shield size={14} /> Strategic Labs
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'SESSIONS' ? (
          <motion.div 
            key="sessions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-[#111] border border-[#22c55e]/20 rounded-[32px] p-8 md:p-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5 font-display text-[120px] pointer-events-none uppercase">WEEKLY</div>
               <div className="relative z-10">
                  <WeeklySchedule />
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="evaluations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#111] border border-white/5 rounded-[32px] p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-8"
          >
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-2">
                <Shield size={40} className="text-[#22c55e]" />
             </div>
             <div>
                <h3 className={`font-display text-3xl text-white uppercase tracking-wider mb-4`}>High-Fidelity Lab Scheduling</h3>
                <p className="text-white/40 text-xs md:text-sm uppercase tracking-[2px] max-w-md mx-auto leading-relaxed">
                  Strategic evaluations (VO2 Max, Biomechanical Capture) are currently managed via direct coach directive.
                </p>
             </div>
             <button className="px-10 py-5 bg-[#22c55e] text-black text-[11px] font-black uppercase tracking-[3px] rounded-2xl hover:bg-white transition-all shadow-[0_20px_40px_rgba(34,197,94,0.2)]">
                REQUEST EVALUATION MILESTONE
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Notice Sidebar style footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { icon: <Clock size={20} />, title: 'Deployment Buffer', desc: 'Arrive 15 minutes prior to operational start for initial vitals sync.' },
           { icon: <AlertCircle size={20} />, title: 'Cancellation Protocol', desc: 'Deployments must be cancelled 12H in advance to avoid penalty.' },
           { icon: <Shield size={20} />, title: 'Medically Cleared', desc: 'By booking, you confirm full physical readiness for deployment.' },
         ].map((item, i) => (
           <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
              <div className="text-[#22c55e] mb-4">{item.icon}</div>
              <h4 className="text-white font-bold text-[11px] uppercase tracking-widest mb-2">{item.title}</h4>
              <p className="text-gray-400 text-[10px] leading-relaxed uppercase font-semibold">{item.desc}</p>
           </div>
         ))}
      </div>
    </div>
  );
}
