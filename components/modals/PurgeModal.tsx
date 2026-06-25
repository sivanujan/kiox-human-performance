"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";

interface PurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PurgeModal({ isOpen, onClose }: PurgeModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePurge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationText !== "PURGE SYSTEM") return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/system/reset", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to purge system");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.reload(); // Hard reload to clear all cached client state
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          onClick={() => !loading && !success && onClose()}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-bg-card border border-red-500/30 rounded-[32px] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-red-500/20 bg-red-500/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className="text-xl font-display font-black text-red-500 uppercase tracking-widest">
                  System Purge
                </h2>
                <p className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                  Critical Destructive Action
                </p>
              </div>
            </div>
            {!loading && !success && (
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-8">
            {success ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-display font-black text-text-primary uppercase tracking-widest">
                  Purge Complete
                </h3>
                <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">
                  System rebooting...
                </p>
              </div>
            ) : (
              <form onSubmit={handlePurge} className="space-y-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                  <p className="text-sm text-red-400/90 leading-relaxed font-bold tracking-wide">
                    WARNING: This action will permanently delete all training schedules, athlete logs, alerts, programs, and bookings. Athlete profiles will be preserved, but all biometric data will be reset to zero. This cannot be undone.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                    Type "PURGE SYSTEM" to confirm
                  </label>
                  <input
                    type="text"
                    required
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="PURGE SYSTEM"
                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                  />
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-500 text-center uppercase tracking-wider">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={confirmationText !== "PURGE SYSTEM" || loading}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-red-500/20 disabled:text-red-500/40 text-white rounded-2xl font-display font-black uppercase tracking-[4px] transition-all flex justify-center items-center gap-3"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "Execute Purge"
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
