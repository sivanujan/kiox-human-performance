"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, ArrowRight, Loader2, Zap } from "lucide-react";
import { Anton } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"] });

interface InjuryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

export default function InjuryLogModal({ isOpen, onClose, athleteId, athleteName }: InjuryLogModalProps) {
  const [formData, setFormData] = useState({
    injuryType: "Muscle Strain",
    severity: "Low",
    bodyPart: "",
    notes: "",
    status: "Active Injury",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/athlete/${athleteId}/injury-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

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
          className="relative w-full max-w-lg bg-[#0a0a0a] border border-red-500/20 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.1)]"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-red-500/10 to-transparent">
            <div>
              <div className="text-red-500 text-[10px] font-black tracking-[4px] uppercase mb-1 flex items-center gap-2">
                <ShieldAlert size={12} fill="currentColor" /> MEDICAL PROTOCOL
              </div>
              <h2 className={`${anton.className} text-2xl text-white tracking-wider uppercase`}>
                LOG INJURY / RECOVERY
              </h2>
            </div>
            <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            <div className="mb-8 p-4 bg-white/5 border border-white/5 rounded-2xl">
              <div className="text-white/20 text-[9px] font-black tracking-widest uppercase mb-1">TARGET SUBJECT</div>
              <div className="text-white font-bold tracking-wide uppercase">{athleteName}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-red-500 tracking-widest uppercase ml-1">Injury Type</label>
                  <select
                    value={formData.injuryType}
                    onChange={(e) => setFormData({ ...formData, injuryType: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-bold focus:outline-none focus:border-red-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Muscle Strain">MUSCLE STRAIN</option>
                    <option value="Joint">JOINT</option>
                    <option value="Fatigue">FATIGUE</option>
                    <option value="Illness">ILLNESS</option>
                    <option value="Other">OTHER</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-red-500 tracking-widest uppercase ml-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-bold focus:outline-none focus:border-red-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Low">LOW RISK</option>
                    <option value="Medium">MEDIUM RISK</option>
                    <option value="High">HIGH RISK</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-red-500 tracking-widest uppercase ml-1">Body Part</label>
                  <input
                    required
                    placeholder="EX: LEFT HAMSTRING"
                    value={formData.bodyPart}
                    onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-bold placeholder:text-white/5 focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-red-500 tracking-widest uppercase ml-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-bold focus:outline-none focus:border-red-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Active Injury">ACTIVE INJURY</option>
                    <option value="In Recovery">IN RECOVERY</option>
                    <option value="Cleared">CLEARED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-red-500 tracking-widest uppercase ml-1">Clinical Notes</label>
                <textarea
                  rows={4}
                  placeholder="DETAIL THE FINDINGS AND REHAB PROTOCOL..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-medium placeholder:text-white/5 focus:outline-none focus:border-red-500 transition-all resize-none"
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
                className="w-full bg-red-500 text-white font-black uppercase tracking-[2px] py-5 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-[0_10px_30px_rgba(239,68,68,0.3)] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "COMMIT MEDICAL LOG"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
