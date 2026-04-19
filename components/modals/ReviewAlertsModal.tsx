"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, CheckCircle2, Search, Filter, Clock, User, ClipboardList, Trash2, History, Loader2 } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { format } from "date-fns";
import { createPortal } from "react-dom";


interface ReviewAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewAlertsModal({ isOpen, onClose }: ReviewAlertsModalProps) {
  const { alerts, resolveAlert, getResolvedHistory, loading: globalLoading } = useAlerts();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "RESOLVED">("ACTIVE");
  const [history, setHistory] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeTab === "RESOLVED" && isOpen) {
      loadHistory();
    }
  }, [activeTab, isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getResolvedHistory();
    setHistory(data);
    setLoading(false);
  };

  const handleAction = async (alert: any) => {
    setResolvingId(alert.id);
    try {
      if (alert.alert_type === 'MEDICAL_CLEARANCE_REQUEST') {
        const res = await fetch(`/api/admin/athlete/${alert.athlete_id}/injury/clearance-approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId: alert.id })
        });
        if (res.ok) {
          await resolveAlert(alert.id);
        }
      } else {
        await resolveAlert(alert.id);
      }
      
      if (activeTab === "RESOLVED") {
        loadHistory();
      }
    } catch (e) {
      console.error("Resolution failed:", e);
    } finally {
      setResolvingId(null);
    }
  };

  const filteredData = (activeTab === "ACTIVE" ? alerts : history).filter(a => {
    const nameMatch = `${a.athlete?.first_name} ${a.athlete?.last_name}`.toLowerCase().includes(search.toLowerCase());
    const typeMatch = filterType === "ALL" || a.alert_type === filterType;
    return nameMatch && typeMatch;
  });

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl bg-[#0a0a0a] border border-red-500/10 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.1)]"
        >
          {/* Header */}
          <div className="p-12 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-red-500/[0.05] to-transparent">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                <ShieldAlert size={32} />
              </div>
              <div>
                <div className="text-red-500 text-[10px] font-black tracking-[5px] uppercase mb-1">CENTRAL RISK MANAGEMENT</div>
                <h2 className={`font-display text-4xl text-white tracking-widest uppercase`}>System Anomalies</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-5 rounded-full bg-white/5 text-gray-400 hover:text-white transition-all">
              <X size={28} />
            </button>
          </div>

          <div className="p-12">
            {/* Tabs & Filters */}
            <div className="flex flex-col xl:flex-row gap-8 justify-between items-start xl:items-center mb-12">
              <div className="flex p-1.5 bg-white/5 rounded-2xl">
                {["ACTIVE", "RESOLVED"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-8 py-3 rounded-xl text-[10px] font-display tracking-[0.2em] transition-all ${
                      activeTab === tab ? "bg-red-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                <div className="relative flex-1 xl:w-64">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                   <input 
                     placeholder="FILTER SUBJECT..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-white focus:border-red-500 transition-all outline-none"
                   />
                </div>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl py-3 px-6 text-[10px] font-black text-white/60 uppercase tracking-widest focus:border-red-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="ALL">ALL TYPES</option>
                  <option value="FATIGUE">FATIGUE</option>
                  <option value="OVERLOAD">OVERLOAD</option>
                  <option value="INJURY_RISK">INJURY</option>
                  <option value="SLEEP">SLEEP</option>
                  <option value="HYDRATION">HYDRATION</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide">
              {filteredData.length === 0 ? (
                <div className="py-32 text-center">
                   <div className="text-white/5 font-display text-8xl mb-6">ZERO</div>
                   <div className="text-gray-500 text-xs font-black uppercase tracking-[0.5em]">No log matches in this sector</div>
                </div>
              ) : (
                filteredData.map((alert) => (
                  <div key={alert.id} className="group flex flex-col md:flex-row items-center gap-8 bg-white/[0.02] border border-white/5 p-8 rounded-[32px] hover:bg-white/[0.04] transition-all">
                    <div className="w-16 h-16 rounded-[20px] bg-black/40 flex items-center justify-center text-3xl shrink-0">
                       {getEmoji(alert.alert_type)}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                       <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-display tracking-widest border ${getSeverityColor(alert.severity)}`}>
                             {alert.severity}
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                             <Clock size={12} /> {format(new Date(alert.triggered_at), "MMM d, HH:mm")}
                          </span>
                       </div>
                       <h3 className="text-white font-display text-2xl tracking-wider uppercase mb-1">
                          {alert.athlete?.first_name} {alert.athlete?.last_name}
                       </h3>
                       <p className="text-white/40 text-sm font-medium italic italic">"{alert.message}"</p>
                    </div>

                    {activeTab === "RESOLVED" ? (
                      <div className="text-right shrink-0">
                        <div className="text-[#22c55e] flex items-center gap-2 justify-end mb-1">
                          <CheckCircle2 size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">RESOLVED</span>
                        </div>
                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                          BY {alert.resolver?.first_name} // {format(new Date(alert.resolved_at), "HH:mm")}
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleAction(alert)}
                        disabled={resolvingId !== null}
                        className="bg-red-500 text-white min-w-[140px] px-8 py-4 rounded-2xl font-display text-sm tracking-widest hover:bg-white hover:text-red-500 transition-all uppercase shadow-xl flex items-center justify-center gap-2"
                      >
                        {resolvingId === alert.id ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          "RESOLVE"
                        )}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

function getEmoji(type: string) {
  switch (type) {
    case 'FATIGUE': return '🔋';
    case 'HYDRATION': return '💧';
    case 'INJURY_RISK': return '🩺';
    case 'SLEEP': return '😴';
    case 'OVERLOAD': return '🔥';
    case 'MEDICAL_CLEARANCE_REQUEST': return '✅';
    default: return '🚩';
  }
}

function getSeverityColor(sev: string) {
  switch (sev) {
    case 'CRITICAL': return "border-red-500 text-red-500 bg-red-500/10";
    case 'HIGH': return "border-orange-500 text-orange-500 bg-orange-500/10";
    case 'MEDIUM': return "border-yellow-500 text-yellow-500 bg-yellow-500/10";
    default: return "border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10";
  }
}
