"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clipboard, ArrowRight, Loader2, Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/client";


interface TrainingPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

export default function TrainingPlanModal({ isOpen, onClose, athleteId, athleteName }: TrainingPlanModalProps) {
  const [resolvedAthleteName, setResolvedAthleteName] = useState(athleteName);
  const [formData, setFormData] = useState({
    title: "",
    phase: "Strength",
    notes: "",
    effectiveDate: new Date().toISOString().split('T')[0] });
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
      const res = await fetch(`/api/admin/athlete/${athleteId}/training-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData) });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to commit training plan.");
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
                <span className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                  COMMAND PROTOCOL
                </span>
              </div>
              <h2 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                TRAINING PLAN
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
              <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                TARGET SUBJECT
              </label>
              <div className="w-full bg-bg-primary/50 border border-border-primary/50 rounded-xl px-4 py-3 text-sm text-text-primary font-medium">
                {resolvedAthleteName}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Plan Title</label>
                <input
                  required
                  placeholder="EX: POWER & SPEED MATRIX"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Phase</label>
                  <div className="relative">
                    <select
                      value={formData.phase}
                      onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                      className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium appearance-none cursor-pointer"
                    >
                      <option value="Strength">STRENGTH</option>
                      <option value="Tactical">TACTICAL</option>
                      <option value="Recovery">RECOVERY</option>
                      <option value="Conditioning">CONDITIONING</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▾</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Protocol Instructions</label>
                <textarea
                  rows={4}
                  placeholder="DETAIL THE SESSIONS..."
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
                        <>COMMIT PROTOCOL UPDATE →</>
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
