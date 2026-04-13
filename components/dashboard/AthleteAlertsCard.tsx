"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Info, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface AthleteAlertsCardProps {
  athleteId: string;
}

export default function AthleteAlertsCard({ athleteId }: AthleteAlertsCardProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (athleteId) fetchMyAlerts();

    const channel = supabase
      .channel(`my_alerts_${athleteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "athlete_alerts", filter: `athlete_id=eq.${athleteId}` },
        () => fetchMyAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [athleteId]);

  const fetchMyAlerts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("athlete_alerts")
      .select("*")
      .eq("athlete_id", athleteId)
      .eq("is_resolved", false)
      .order("triggered_at", { ascending: false });
    
    setAlerts(data || []);
    setLoading(false);
  };

  if (alerts.length === 0) return null;

  return (
    <div className="bg-red-500/[0.03] border border-red-500/20 rounded-3xl p-6 relative overflow-hidden group">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
          <ShieldAlert size={20} />
        </div>
        <div>
          <div className="text-red-500 text-[10px] font-black tracking-[3px] uppercase">Recovery Advisory</div>
          <h3 className="text-white font-['Anton'] text-lg tracking-wider uppercase">Active Performance Flags</h3>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {alerts.map((alert) => (
          <div key={alert.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex gap-4 items-start">
             <div className="mt-1 text-lg">
                {alert.alert_type === 'FATIGUE' || alert.alert_type === 'OVERLOAD' ? '⚠️' : 
                 alert.alert_type === 'HYDRATION' ? '💧' : 
                 alert.alert_type === 'SLEEP' ? '😴' : '🩺'}
             </div>
             <div>
                <div className="text-white font-bold text-xs uppercase tracking-wide">{alert.alert_type} FLAG</div>
                <div className="text-white/40 text-[10px] leading-relaxed mt-0.5">{alert.message}</div>
                <div className="text-white/20 text-[8px] font-black uppercase mt-2 flex items-center gap-1">
                   <Clock size={10} /> {formatDistanceToNow(new Date(alert.triggered_at))} ago
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
         <Info size={16} className="text-red-500" />
         <p className="text-[10px] text-white/60 leading-tight font-medium uppercase tracking-wider">
            Coach has flagged <span className="text-red-500 font-bold">RECOVERY FOCUS</span> for you. Please check in with the medical staff if needed.
         </p>
      </div>

      <div className="absolute -bottom-2 -right-2 opacity-[0.02] font-['Anton'] text-6xl pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        FLAG
      </div>
    </div>
  );
}
