"use client";

import { ShieldAlert, ArrowRight, Clock, CheckCircle2, FlaskConical, Activity, Thermometer, Moon } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { useAuth } from "@/components/providers/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface AlertsFlagsWidgetProps {
  onReviewAll: () => void;
}

export default function AlertsFlagsWidget({ onReviewAll }: AlertsFlagsWidgetProps) {
  const { user } = useAuth();
  const { alerts, loading, resolveAlert } = useAlerts();

  const getAlertIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'FATIGUE': return <Activity className="text-amber-500" size={18} />;
      case 'HYDRATION': return <Thermometer className="text-blue-500" size={18} />;
      case 'INJURY_RISK': return <FlaskConical className="text-red-500" size={18} />;
      case 'SLEEP': return <Moon className="text-purple-500" size={18} />;
      case 'OVERLOAD': return <ShieldAlert className="text-red-600" size={18} />;
      case 'MEDICAL_CLEARANCE_REQUEST': return <CheckCircle2 className="text-[#22c55e]" size={18} />;
      default: return <ShieldAlert size={18} />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return "bg-red-500/20 text-red-500 border-red-500/50";
      case 'HIGH': return "bg-orange-500/20 text-orange-500 border-orange-500/50";
      case 'MEDIUM': return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      default: return "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/50";
    }
  };

  const handleResolve = async (alert: any) => {
    if (alert.alert_type === 'MEDICAL_CLEARANCE_REQUEST') {
      try {
        const res = await fetch(`/api/admin/athlete/${alert.athlete_id}/injury/clearance-approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId: alert.id })
        });
        if (res.ok) {
          await resolveAlert(alert.id, user?.id);
        } else {
          const err = await res.json();
          alert(`Clearance Error: ${err.error}`);
        }
      } catch (e) {
        console.error("Clearance approval failed:", e);
      }
    } else {
      const result = await resolveAlert(alert.id, user?.id);
      if (!result.success) alert(`Sync Warning: ${result.error}`);
    }
  };

  return (
    <div className="bg-red-500/[0.03] border border-red-500/15 rounded-[32px] p-8 shadow-2xl h-fit relative overflow-hidden group">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <ShieldAlert size={120} className="text-red-500" />
      </div>

      <div className="flex justify-between items-center mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="text-red-500 font-display text-[10px] tracking-[0.3em] uppercase">System Alerts</div>
            <h2 className="text-white font-display text-xl tracking-wider uppercase">Alerts</h2>
          </div>
        </div>
        <div className="px-4 py-1.5 bg-red-500 text-white text-[10px] font-black rounded-full shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
          {alerts.length} ANOMALIES
        </div>
      </div>

      <div className="space-y-4 mb-10 relative z-10 min-h-[300px]">
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="text-white/5 font-display text-5xl mb-4">CLEAR</div>
              <div className="text-gray-700 uppercase font-black text-[10px] tracking-[0.4em]">
                NO CRITICAL SYSTEM FLAGS DETECTED
              </div>
            </motion.div>
          ) : (
            alerts.map((alert) => {
              const isClearance = alert.alert_type === 'MEDICAL_CLEARANCE_REQUEST';
              return (
                <motion.div 
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center gap-5 bg-black/40 border p-5 rounded-3xl transition-all group/item ${
                    isClearance ? 'border-[#22c55e]/30 hover:border-[#22c55e]' : 'border-white/5 hover:border-red-500/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl shrink-0 group-hover/item:bg-white/10 transition-colors`}>
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black border uppercase tracking-widest ${getSeverityStyle(alert.severity)}`}>
                        {isClearance ? 'CLEARANCE REQ' : alert.severity}
                      </span>
                      <span className="text-gray-500 text-[8px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock size={8} /> {formatDistanceToNow(new Date(alert.triggered_at))} ago
                      </span>
                    </div>
                    <div className="text-white font-bold text-sm uppercase tracking-wide truncate">{alert.athlete?.first_name} {alert.athlete?.last_name}</div>
                    <div className="text-white/40 text-[10px] leading-tight mt-1 line-clamp-1 italic">"{alert.message}"</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleResolve(alert)}
                      className={`p-3 rounded-xl transition-all group-hover/item:scale-105 shadow-lg ${
                        isClearance ? 'bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e] hover:text-black' : 'bg-white/5 text-gray-500 hover:bg-red-500 hover:text-white'
                      }`}
                      title={isClearance ? "Approve Clearance" : "Resolve Flag"}
                    >
                      {isClearance ? <CheckCircle2 size={18} /> : <CheckCircle2 size={18} />}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <button 
        onClick={onReviewAll}
        className="relative z-10 w-full bg-transparent border-2 border-red-500/20 text-red-500 py-4 rounded-2xl font-display text-xs tracking-[0.2em] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all uppercase flex items-center justify-center gap-3 group/btn"
      >
        INITIALIZE FULL RISK AUDIT 
        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
