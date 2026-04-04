"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Target
} from "lucide-react";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";

const anton = Anton({ weight: '400', subsets: ['latin'] });

const ASSESSMENT_TYPES = [
  { id: 'biomechanical', title: 'Biomechanical Lab', icon: <Zap size={16} />, desc: 'Motion capture and joint-torque analysis' },
  { id: 'metabolic', title: 'Metabolic Baseline', icon: <Activity size={16} />, desc: 'VO2 max and lactate threshold testing' },
  { id: 'physiometric', title: 'Physiometric Scan', icon: <Target size={16} />, desc: 'Body composition and force-plate symmetry' },
  { id: 'neuro-reactive', title: 'Neuro-Reactive', icon: <Shield size={16} />, desc: 'Cognitive load and reaction timing' },
];

import { Activity } from "lucide-react";

export default function BookingPage() {
  const { user, supabase } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("biomechanical");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return setError("Please specify date and time.");

    setLoading(true);
    setError(null);

    try {
      const assessmentDate = new Date(`${date}T${time}`);
      
      const res = await fetch('/api/admin/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          assessmentType: ASSESSMENT_TYPES.find(t => t.id === type)?.title || type,
          assessmentDate: assessmentDate.toISOString(),
          status: 'pending' // Admin needs to approve
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/schedule"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to book session");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all outline-none placeholder:text-white/10";
  const labelClasses = "text-[10px] font-black text-[#22c55e] uppercase tracking-[3px] mb-3 block";

  return (
    <div className="p-10 max-w-4xl">
      <div className="mb-12">
        <h2 className={`${anton.className} text-5xl text-white uppercase tracking-wider mb-2`}>Strategic Booking</h2>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[3px]">Initialize your next performance evaluation milestone</p>
      </div>

      <AnimatePresence>
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-3xl p-12 text-center"
          >
             <div className="w-20 h-20 bg-[#22c55e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                <CheckCircle2 className="text-black" size={40} />
             </div>
             <h3 className={`${anton.className} text-3xl text-white uppercase tracking-wider mb-2`}>Assessment Requested</h3>
             <p className="text-white/40 text-sm uppercase tracking-widest leading-relaxed">
               Your performance evaluation has been queued for initialization. Strategic review will confirm your slot within 12 hours.
             </p>
             <div className="mt-8 flex justify-center gap-4">
               <Loader2 className="animate-spin text-[#22c55e]" size={16} />
               <span className="text-[10px] font-black text-white/20 uppercase tracking-[2px]">Redirecting to Schedule...</span>
             </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section: Assessment Intensity */}
            <section className="bg-[#111] border border-white/5 rounded-3xl p-8">
               <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[3px] mb-8">Select Evaluation Type</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ASSESSMENT_TYPES.map((t) => (
                     <div 
                       key={t.id}
                       onClick={() => setType(t.id)}
                       className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col items-start gap-4 ${
                         type === t.id ? 'bg-[#22c55e]/10 border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'bg-black/20 border-white/5 hover:border-white/20'
                       }`}
                     >
                        <div className={`p-3 rounded-xl ${type === t.id ? 'bg-[#22c55e] text-black' : 'bg-white/5 text-[#22c55e]'}`}>
                           {t.icon}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white uppercase tracking-widest">{t.title}</p>
                           <p className="text-[9px] text-white/30 uppercase mt-1 leading-relaxed font-semibold">{t.desc}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* Section: Logistics */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111] border border-white/5 rounded-3xl p-8"
            >
              <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[3px] mb-8">Deployment Window</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <label className={labelClasses}>Deployment Date</label>
                    <div className="relative">
                       <input 
                         type="date" 
                         value={date}
                         onChange={(e) => setDate(e.target.value)}
                         className={inputClasses}
                         style={{ colorScheme: 'dark' }}
                       />
                       <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 pointer-events-none" />
                    </div>
                 </div>
                 <div>
                    <label className={labelClasses}>Initialization Time</label>
                    <div className="relative">
                       <input 
                         type="time" 
                         value={time}
                         onChange={(e) => setTime(e.target.value)}
                         className={inputClasses}
                         style={{ colorScheme: 'dark' }}
                       />
                       <Clock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 pointer-events-none" />
                    </div>
                 </div>
              </div>
            </motion.section>

            {/* Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
              <div className="flex-1">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-red-500"
                  >
                    <AlertCircle size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[2px]">{error}</span>
                  </motion.div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-12 py-5 bg-[#22c55e] text-black text-[11px] font-black uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-3 hover:bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(34,197,94,0.3)]"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Initialize Evaluation Milestone
              </button>
            </div>
          </form>
        )}
      </AnimatePresence>
    </div>
  );
}
