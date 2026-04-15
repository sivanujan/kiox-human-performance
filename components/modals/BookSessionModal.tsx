"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Zap,
  Target,
  ShieldCheck,
  Activity
} from "lucide-react";
import { Anton } from "next/font/google";

const anton = Anton({ weight: '400', subsets: ['latin'] });

interface BookSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any | null;
  onSuccess: () => void;
}

export default function BookSessionModal({ isOpen, onClose, session, onSuccess }: BookSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
    }
  }, [isOpen]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/athlete/metrics');
      const data = await res.json();
      if (!data.error) setMetrics(data);
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    }
  };

  const currentLoad = metrics?.weekly_load || 0;
  const isHighLoad = currentLoad > 600;

  const handleBooking = async () => {
    if (!confirmed) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/athlete/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          notes
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !session) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl bg-[#0a0a0a] border border-[#22c55e]/20 rounded-[32px] shadow-[0_20px_50px_rgba(34,197,94,0.15)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 text-[#22c55e] mb-3">
                 <div className="p-2 bg-[#22c55e]/10 rounded-xl">
                    {session.session_type === 'STRENGTH' ? <Zap size={18} /> : 
                     session.session_type === 'TACTICAL' ? <Target size={18} /> : 
                     <ShieldCheck size={18} />}
                 </div>
                 <span className="text-[10px] font-black tracking-[3px] uppercase">DEPLOYMENT_INITIATION</span>
              </div>
              <h2 className={`${anton.className} text-3xl text-white uppercase tracking-wider`}>
                {session.title}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="text-white/40" size={24} />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                  <div className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-1">DEPLOYMENT WINDOW</div>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                     <Clock size={14} className="text-[#22c55e]" />
                     {session.scheduled_time.slice(0, 5)} // {session.duration_minutes}m
                  </div>
               </div>
               <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                  <div className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-1">OPERATIONAL HQ</div>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                     <MapPin size={14} className="text-[#22c55e]" />
                     {session.location || 'MAIN FIELD'}
                  </div>
               </div>
            </div>

            {/* Load Matrix Warning */}
            <div className={`p-6 rounded-2xl border transition-all ${
              isHighLoad ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#22c55e]/5 border-[#22c55e]/20'
            }`}>
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                     <Activity className={isHighLoad ? 'text-amber-500' : 'text-[#22c55e]'} size={18} />
                     <span className={`text-[10px] font-black uppercase tracking-widest ${isHighLoad ? 'text-amber-500' : 'text-[#22c55e]'}`}>
                        ATHLETE LOAD CONTEXT
                     </span>
                  </div>
                  <span className="text-white font-['Anton'] text-lg">{currentLoad} AU</span>
               </div>
               
               {isHighLoad ? (
                 <div className="flex gap-4 items-start p-4 bg-black/40 rounded-xl border border-amber-500/20">
                    <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                    <p className="text-[10px] text-white/60 leading-relaxed uppercase tracking-widest">
                       <span className="text-amber-500 font-black">WARNING: HIGH LOAD WEEK.</span> INITIALIZATION WILL REQUIRE COACHING STAFF APPROVAL (STATUS: PENDING).
                    </p>
                 </div>
               ) : (
                 <p className="text-[10px] text-white/30 uppercase tracking-widest italic ml-8">
                    Operational load within safety margins. Auto-confirmation active.
                 </p>
               )}
            </div>

            {/* Note Field */}
            <div>
              <label className="text-[9px] font-black text-white/20 uppercase tracking-[3px] mb-3 block">Deployment Notes (Optional)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Brief directives or status updates for the coaching staff..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-xs focus:border-[#22c55e] transition-all outline-none min-h-[100px] resize-none"
              />
            </div>

            {/* Confirmation Checkbox */}
            <div 
              onClick={() => setConfirmed(!confirmed)}
              className="flex items-center gap-4 cursor-pointer group"
            >
               <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                 confirmed ? 'bg-[#22c55e] border-[#22c55e]' : 'bg-black/40 border-white/20 group-hover:border-[#22c55e]/50'
               }`}>
                  {confirmed && <CheckCircle2 className="text-black" size={16} />}
               </div>
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest select-none">
                 I confirm I am physically operational for this deployment.
               </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                <AlertTriangle size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
               <button 
                 onClick={onClose}
                 className="flex-1 py-5 bg-white/5 text-white/40 text-[11px] font-black uppercase tracking-[2px] rounded-2xl hover:bg-white/10 transition-all"
               >
                 ABORT
               </button>
               <button 
                 disabled={!confirmed || loading}
                 onClick={handleBooking}
                 className="flex-[2] py-5 bg-[#22c55e] text-black text-[11px] font-black uppercase tracking-[2px] rounded-2xl hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-3"
               >
                 {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                 CONFIRM DEPLOYMENT
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
