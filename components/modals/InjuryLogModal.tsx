"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, ArrowRight, Loader2, Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/client";


interface InjuryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
  onSuccess?: () => void;
}

export default function InjuryLogModal({ isOpen, onClose, athleteId, athleteName, onSuccess }: InjuryLogModalProps) {
  const [resolvedAthleteName, setResolvedAthleteName] = useState(athleteName);
  const [formData, setFormData] = useState({
    injuryType: "Muscle Strain",
    severity: "Low",
    bodyPart: "",
    notes: "",
    status: "Active Injury" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAthleteName = async () => {
      const cleanName = (athleteName || "").trim().toLowerCase();
      const isUndefined = !cleanName || cleanName === "undefined" || cleanName === "undefined undefined" || cleanName === "undefined ";
      
      if (isUndefined && athleteId) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", athleteId)
            .single();
          
          if (!error && data) {
            setResolvedAthleteName(`${data.first_name || ""} ${data.last_name || ""}`.trim());
          } else {
            setResolvedAthleteName("Athlete Profile");
          }
        } catch (err) {
          console.error("Failed to fetch athlete name in modal:", err);
          setResolvedAthleteName("Athlete Profile");
        }
      } else {
        setResolvedAthleteName(athleteName);
      }
    };

    if (isOpen) {
      fetchAthleteName();
    }
  }, [isOpen, athleteId, athleteName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/athlete/${athleteId}/injury-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData) });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log injury/recovery.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full md:max-w-md bg-[#111] border border-gray-800 rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50"
        >
          {/* Drag handle — mobile only */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-700" />
          </div>

          {/* Modal Header */}
          <div className="flex items-start justify-between p-5 md:p-6 border-b border-gray-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#22c55e] text-xs">⚡</span>
                <span className="font-mono text-[10px] text-gray-500 tracking-[0.3em] uppercase">
                  COMMAND PROTOCOL
                </span>
              </div>
              <h2 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                INJURY LOG
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-white transition-all touch-manipulation flex-shrink-0"
            >
              ✕
            </button>
          </div>

          <div className="p-5 md:p-6 space-y-5">
            {/* Target Subject (read-only) */}
            <div>
              <label className="font-mono text-[10px] text-gray-500 tracking-[0.3em] uppercase block mb-2">
                TARGET SUBJECT
              </label>
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3 font-display text-sm font-bold text-white tracking-wider uppercase">
                {resolvedAthleteName}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-gray-500 tracking-[0.3em] uppercase block mb-2 ml-1">Injury Type</label>
                  <div className="relative">
                    <select
                      value={formData.injuryType}
                      onChange={(e) => setFormData({ ...formData, injuryType: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 focus:border-[#22c55e] focus:outline-none rounded-xl px-4 py-3 font-display text-sm font-bold text-white tracking-wider uppercase appearance-none cursor-pointer transition-all"
                    >
                      <option value="Muscle Strain">MUSCLE STRAIN</option>
                      <option value="Joint">JOINT</option>
                      <option value="Fatigue">FATIGUE</option>
                      <option value="Illness">ILLNESS</option>
                      <option value="Other">OTHER</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▾</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-gray-500 tracking-[0.3em] uppercase block mb-2 ml-1">Severity</label>
                  <div className="relative">
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 focus:border-[#22c55e] focus:outline-none rounded-xl px-4 py-3 font-display text-sm font-bold text-white tracking-wider uppercase appearance-none cursor-pointer transition-all"
                    >
                      <option value="Low">LOW RISK</option>
                      <option value="Medium">MEDIUM RISK</option>
                      <option value="High">HIGH RISK</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▾</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-gray-500 tracking-[0.3em] uppercase block mb-2 ml-1">Body Part</label>
                  <input
                    required
                    placeholder="EX: LEFT HAMSTRING"
                    value={formData.bodyPart}
                    onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 focus:border-[#22c55e] focus:outline-none focus:ring-0 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder:text-gray-600 placeholder:tracking-wider placeholder:uppercase transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-gray-500 tracking-[0.3em] uppercase block mb-2 ml-1">Status</label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 focus:border-[#22c55e] focus:outline-none rounded-xl px-4 py-3 font-display text-sm font-bold text-white tracking-wider uppercase appearance-none cursor-pointer transition-all"
                    >
                      <option value="Active Injury">ACTIVE INJURY</option>
                      <option value="In Recovery">IN RECOVERY</option>
                      <option value="Cleared">CLEARED</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▾</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] text-gray-500 tracking-[0.3em] uppercase block mb-2 ml-1">Clinical Notes</label>
                <textarea
                  rows={4}
                  placeholder="DETAIL THE FINDINGS AND REHAB PROTOCOL..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 focus:border-[#22c55e] focus:outline-none rounded-xl px-4 py-3 font-mono text-sm text-white placeholder:text-gray-600 placeholder:tracking-wider placeholder:uppercase resize-none transition-all min-h-[120px]"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                  ERROR: {error}
                </div>
              )}

              <div className="sticky bottom-0 pt-4 bg-[#111] border-t border-gray-800 mt-6 -mx-6 px-6 pb-6">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#22c55e] hover:bg-[#4ade80] disabled:bg-[#22c55e]/50 disabled:cursor-not-allowed text-black font-display font-bold text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            PROCESSING...
                        </>
                    ) : (
                        <>COMMIT MEDICAL LOG →</>
                    )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
