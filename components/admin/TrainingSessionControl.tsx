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
  Loader2,
  AlertCircle
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
    return "border-l-[#00ff88] bg-white/[0.02]";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return "bg-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse";
      case 'COMPLETED': return "bg-white/10 text-white/40 border border-white/10";
      default: return "bg-transparent border border-white/20 text-gray-400";
    }
  };

  return (
    <div className="w-full bg-[#111] border border-white/5 rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-2xl relative overflow-hidden group">
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
            <div className="text-[#22c55e] font-display text-[10px] tracking-[0.3em] uppercase">Operational Control</div>
            <h2 className="text-white font-display text-xl tracking-wider uppercase">Training Session Control</h2>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-500 font-black text-[10px] tracking-widest uppercase mb-1">CURRENT OPS DATE</div>
          <div className="text-white font-display text-lg tracking-widest">{format(new Date(), "MMMM dd, yyyy").toUpperCase()}</div>
        </div>
      </div>

      <div className="space-y-4 mb-10 relative z-10 min-h-[350px]">
        {loading && sessions.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#22c55e]" size={32} />
            <div className="text-gray-500 text-[10px] font-black tracking-widest uppercase">Syncing Schedule...</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="space-y-4">
            <div className="p-2.5 px-4 bg-[#1a1a1a] border border-white/5 rounded-xl text-[#00ff88] text-[10px] font-mono tracking-wider flex items-center gap-2">
               <AlertCircle size={12} className="text-[#00ff88] flex-shrink-0" />
               <span>Tip: Showing standby training protocols. Click "ACTIVATE SESSION" or "CREATE NEW SESSION" to schedule custom ops.</span>
            </div>
            
            {[
              {
                id: "mock-1",
                title: "NEUROMUSCULAR STRENGTH PROTOCOL",
                session_type: "STRENGTH",
                status: "STANDBY",
                start_time: "09:00:00",
                location: "PERFORMANCE GYM",
                duration_minutes: 90
              },
              {
                id: "mock-2",
                title: "AEROBIC CONDITIONING SYSTEM",
                session_type: "CONDITIONING",
                status: "STANDBY",
                start_time: "14:30:00",
                location: "HQ FIELD B",
                duration_minutes: 45
              }
            ].map((session) => (
              <div 
                key={session.id}
                className={`flex items-center gap-6 p-6 rounded-3xl border-l-[6px] border border-white/5 transition-all group/item hover:bg-white/[0.03] ${getTypeStyle(session.session_type)}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-white/10 text-white/60 border border-white/10">
                      {session.status}
                    </span>
                    <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={10} /> {session.start_time.slice(0, 5)}
                    </span>
                  </div>
                  <h4 className="text-white font-display text-lg tracking-wider uppercase mb-1 truncate">{session.title}</h4>
                  <div className="flex items-center gap-3 text-gray-400 text-[10px] font-black tracking-widest uppercase">
                     <div className="flex items-center gap-1.5"><MapPin size={12} /> {session.location}</div>
                     <div className="flex items-center gap-1.5"><Activity size={12} /> {session.duration_minutes} MIN</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={onCreate}
                    className="h-10 px-4 bg-[#22c55e] text-black rounded-xl font-display text-[9px] tracking-widest uppercase hover:bg-white transition-all shadow-lg flex items-center gap-2"
                  >
                    <Play size={10} fill="currentColor" /> ACTIVATE
                  </button>
                </div>
              </div>
            ))}
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
                  <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={10} /> {session.start_time.slice(0, 5)}
                  </span>
                </div>
                <h4 className="text-white font-display text-lg tracking-wider uppercase mb-1 truncate">{session.title}</h4>
                <div className="flex items-center gap-3 text-gray-400 text-[10px] font-black tracking-widest uppercase">
                   <div className="flex items-center gap-1.5"><MapPin size={12} /> {session.location || 'HQ FIELD'}</div>
                   <div className="flex items-center gap-1.5"><Activity size={12} /> {session.duration_minutes} MIN</div>
                </div>
              </div>

              <div className="flex items-center gap-3 opacity-0 group-hover/item:opacity-100 transition-opacity">
                {session.status === 'SCHEDULED' && (
                  <button 
                    onClick={() => updateSessionStatus(session.id, 'IN_PROGRESS')}
                    className="h-12 px-6 bg-[#22c55e] text-black rounded-xl font-display text-[10px] tracking-widest uppercase hover:bg-white transition-all shadow-lg flex items-center gap-2"
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
            className="bg-transparent border-2 border-white/10 text-white/40 py-4 rounded-2xl font-display text-xs tracking-[0.2em] hover:bg-white/5 hover:text-white hover:border-white transition-all uppercase flex items-center justify-center gap-3"
          >
            ADJUST TRAINING LOAD <ArrowRight size={16} />
          </button>
          <button 
            onClick={onCreate}
            className="bg-[#22c55e] text-black py-4 rounded-2xl font-display text-xs tracking-[0.2em] hover:bg-white transition-all uppercase flex items-center justify-center gap-3 shadow-xl"
          >
            CREATE NEW SESSION <ArrowRight size={16} />
          </button>
        </div>
      )}
      {!isSuperAdmin && (
        <div className="relative z-10 pt-4 border-t border-white/5">
           <p className="text-gray-500 text-[9px] font-black uppercase tracking-[3px] text-center italic">
              Administrative Control Locked // Superadmin Clearance Required for Session Modification
           </p>
        </div>
      )}
    </div>
  );
}
