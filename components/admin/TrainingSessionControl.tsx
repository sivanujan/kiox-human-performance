"use client";

import { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  Plus, 
  Activity, 
  MapPin, 
  Play, 
  CheckCircle2, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSessions, TrainingSession } from "@/hooks/useSessions";
import { format } from "date-fns";

interface TrainingSessionControlProps {
  onViewDetails: (session: TrainingSession) => void;
  onAdjustLoad: () => void;
  onCreate: () => void;
  isSuperAdmin?: boolean;
}

export default function TrainingSessionControl({ onViewDetails, onAdjustLoad, onCreate, isSuperAdmin = false }: TrainingSessionControlProps) {
  const { sessions, loading, fetchSessions, updateSessionStatus } = useSessions();

  useEffect(() => {
    fetchSessions();
  }, []);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'STRENGTH': return "border-l-[#f59e0b] bg-amber-500/5";
      case 'TACTICAL': return "border-l-[#3b82f6] bg-blue-500/5";
      case 'CONDITIONING': return "border-l-[#00ff88] bg-[#22c55e]/5";
      case 'RECOVERY': return "border-l-[#a855f7] bg-purple-500/5";
      default: return "border-l-white/20 bg-white/5";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return "bg-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse";
      case 'COMPLETED': return "bg-white/10 text-white/40 border border-white/10";
      default: return "bg-transparent border border-white/20 text-white/30";
    }
  };

  return (
    <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
      {/* Static Background Decoration */}
      <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Calendar size={140} className="text-white" />
      </div>

      <div className="flex justify-between items-center mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#22c55e]">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-[#22c55e] font-['Anton'] text-[10px] tracking-[0.3em] uppercase">Operational Control</div>
            <h2 className="text-white font-['Anton'] text-xl tracking-wider uppercase">Training Session Control</h2>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white/20 font-black text-[10px] tracking-widest uppercase mb-1">CURRENT OPS DATE</div>
          <div className="text-white font-['Anton'] text-lg tracking-widest">{format(new Date(), "MMMM dd, yyyy").toUpperCase()}</div>
        </div>
      </div>

      <div className="space-y-4 mb-10 relative z-10 min-h-[350px]">
        {loading && sessions.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#22c55e]" size={32} />
            <div className="text-white/20 text-[10px] font-black tracking-widest uppercase">Syncing Schedule...</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-24 text-center">
            <div className="text-white/5 font-['Anton'] text-6xl mb-6 tracking-tighter items-center gap-3">
               ZERO SQUAD OPS
            </div>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-10">NO SESSIONS SCHEDULED TODAY</p>
            <button 
              onClick={onCreate}
              className="px-8 py-4 bg-[#22c55e] text-black font-['Anton'] text-xs tracking-widest rounded-2xl hover:bg-white transition-all uppercase shadow-xl flex items-center justify-center gap-3 mx-auto group/new"
            >
              <Plus size={18} className="group-hover/new:rotate-90 transition-transform" /> CREATE FIRST SESSION
            </button>
          </div>
        ) : (
          sessions.map((session) => (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-6 p-6 rounded-3xl border-l-[6px] border border-white/5 transition-all group/item hover:bg-white/[0.03] ${getTypeStyle(session.session_type)}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${getStatusBadge(session.status)}`}>
                    {session.status}
                  </span>
                  <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={10} /> {session.start_time.slice(0, 5)}
                  </span>
                </div>
                <h4 className="text-white font-['Anton'] text-lg tracking-wider uppercase mb-1 truncate">{session.title}</h4>
                <div className="flex items-center gap-3 text-white/30 text-[10px] font-black tracking-widest uppercase">
                   <div className="flex items-center gap-1.5"><MapPin size={12} /> {session.location || 'HQ FIELD'}</div>
                   <div className="flex items-center gap-1.5"><Activity size={12} /> {session.duration_minutes} MIN</div>
                </div>
              </div>

              <div className="flex items-center gap-3 opacity-0 group-hover/item:opacity-100 transition-opacity">
                {session.status === 'SCHEDULED' && (
                  <button 
                    onClick={() => updateSessionStatus(session.id, 'IN_PROGRESS')}
                    className="h-12 px-6 bg-[#22c55e] text-black rounded-xl font-['Anton'] text-[10px] tracking-widest uppercase hover:bg-white transition-all shadow-lg flex items-center gap-2"
                  >
                    <Play size={14} fill="currentColor" /> START
                  </button>
                )}
                <button 
                  onClick={() => onViewDetails(session)}
                  className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <button 
            onClick={onAdjustLoad}
            className="bg-transparent border-2 border-white/10 text-white/40 py-4 rounded-2xl font-['Anton'] text-xs tracking-[0.2em] hover:bg-white/5 hover:text-white hover:border-white transition-all uppercase flex items-center justify-center gap-3"
          >
            ADJUST TRAINING LOAD <ArrowRight size={16} />
          </button>
          <button 
            onClick={onCreate}
            className="bg-[#22c55e] text-black py-4 rounded-2xl font-['Anton'] text-xs tracking-[0.2em] hover:bg-white transition-all uppercase flex items-center justify-center gap-3 shadow-xl"
          >
            CREATE NEW SESSION <ArrowRight size={16} />
          </button>
        </div>
      )}
      {!isSuperAdmin && (
        <div className="relative z-10 pt-4 border-t border-white/5">
           <p className="text-white/20 text-[9px] font-black uppercase tracking-[3px] text-center italic">
              Administrative Control Locked // Superadmin Clearance Required for Session Modification
           </p>
        </div>
      )}
    </div>
  );
}
