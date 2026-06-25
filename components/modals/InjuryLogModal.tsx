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
          className="absolute inset-0 backdrop-blur-md"
          style={{ backgroundColor: "var(--backdrop-overlay)" }}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full md:max-w-md bg-bg-card border border-border-primary rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50"
        >
          {/* Drag handle — mobile only */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border-primary/50" />
          </div>

          {/* Modal Header */}
          <div className="flex items-start justify-between p-5 md:p-6 border-b border-border-primary/50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-accent-green text-xs">⚡</span>
                <span className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                  COMMAND PROTOCOL
                </span>
              </div>
              <h2 className="font-display text-xl font-bold text-text-primary tracking-wide uppercase">
                INJURY LOG
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-bg-secondary hover:bg-bg-card-hover border border-border-primary flex items-center justify-center text-text-secondary hover:text-text-primary transition-all touch-manipulation flex-shrink-0"
            >
              ✕
            </button>
          </div>

          <div className="p-5 md:p-6 space-y-5">
            {/* Target Subject (read-only) */}
            <div>
              <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                TARGET SUBJECT
              </label>
              <div className="w-full bg-bg-primary/50 border border-border-primary/50 rounded-xl px-4 py-3 text-sm text-text-primary font-medium">
                {resolvedAthleteName}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Injury Type</label>
                  <div className="relative">
                    <select
                      value={formData.injuryType}
                      onChange={(e) => setFormData({ ...formData, injuryType: e.target.value })}
                      className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium appearance-none cursor-pointer"
                    >
                      <option value="Muscle Strain">MUSCLE STRAIN</option>
                      <option value="Joint">JOINT</option>
                      <option value="Fatigue">FATIGUE</option>
                      <option value="Illness">ILLNESS</option>
                      <option value="Other">OTHER</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">▾</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Severity</label>
                  <div className="relative">
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium appearance-none cursor-pointer"
                    >
                      <option value="Low">LOW RISK</option>
                      <option value="Medium">MEDIUM RISK</option>
                      <option value="High">HIGH RISK</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">▾</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Body Part</label>
                  <input
                    required
                    placeholder="EX: LEFT HAMSTRING"
                    value={formData.bodyPart}
                    onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Status</label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium appearance-none cursor-pointer"
                    >
                      <option value="Active Injury">ACTIVE INJURY</option>
                      <option value="In Recovery">IN RECOVERY</option>
                      <option value="Cleared">CLEARED</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">▾</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Clinical Notes</label>
                <textarea
                  rows={4}
                  placeholder="DETAIL THE FINDINGS AND REHAB PROTOCOL..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                />
              </div>

              {error && (
                <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                  ERROR: {error}
                </div>
              )}

              <div className="sticky bottom-0 pt-4 bg-bg-card border-t border-border-primary/50 mt-6 -mx-6 px-6 pb-6">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-bg-button-primary hover:bg-accent-green-dim disabled:bg-bg-button-primary/50 disabled:cursor-not-allowed text-text-on-green font-display font-bold text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-text-on-green/30 border-t-text-on-green rounded-full animate-spin" />
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
