"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clipboard, ArrowRight, Loader2, Zap } from "lucide-react";


interface TrainingPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

export default function TrainingPlanModal({ isOpen, onClose, athleteId, athleteName }: TrainingPlanModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    phase: "Strength",
    notes: "",
    effectiveDate: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#22c55e]/20 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.1)]"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#22c55e]/10 to-transparent">
            <div>
              <div className="text-[#22c55e] text-[10px] font-black tracking-[4px] uppercase mb-1 flex items-center gap-2">
                <Zap size={12} fill="currentColor" /> COMMAND PROTOCOL
              </div>
              <h2 className={`font-display text-2xl text-white tracking-wider uppercase`}>
                INITIATE PLAN UPDATE
              </h2>
            </div>
            <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            <div className="mb-8 p-4 bg-white/5 border border-white/5 rounded-2xl">
              <div className="text-gray-500 text-[9px] font-black tracking-widest uppercase mb-1">TARGET SUBJECT</div>
              <div className="text-white font-bold tracking-wide uppercase">{athleteName}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Plan Title</label>
                <input
                  required
                  placeholder="EX: POWER & SPEED MATRIX"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-bold placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Phase</label>
                  <select
                    value={formData.phase}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-bold focus:outline-none focus:border-[#22c55e] transition-all appearance-none cursor-pointer"
                  >
                    <option value="Strength">STRENGTH</option>
                    <option value="Tactical">TACTICAL</option>
                    <option value="Recovery">RECOVERY</option>
                    <option value="Conditioning">CONDITIONING</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-bold focus:outline-none focus:border-[#22c55e] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#22c55e] tracking-widest uppercase ml-1">Protocol Instructions</label>
                <textarea
                  rows={4}
                  placeholder="DETAIL THE SESSIONS AND TARGET OUTPUTS..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-medium placeholder:text-white/5 focus:outline-none focus:border-[#22c55e] transition-all resize-none"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                  ERROR: {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#22c55e] text-black font-black uppercase tracking-[2px] py-5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "COMMIT PROTOCOL UPDATE"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
