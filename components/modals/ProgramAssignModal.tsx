"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, ArrowRight, Loader2, Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

interface ProgramAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
  onSuccess?: () => void;
}

export default function ProgramAssignModal({ 
  isOpen, 
  onClose, 
  athleteId, 
  athleteName,
  onSuccess 
}: ProgramAssignModalProps) {
  const { user, profile } = useAuth();
  const [resolvedAthleteName, setResolvedAthleteName] = useState(athleteName);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [notes, setNotes] = useState("");
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

    const fetchPrograms = async () => {
      try {
        const res = await fetch("/api/admin/programs");
        const data = await res.json();
        if (!data.error) {
          if (profile?.role === 'superadmin') {
            setPrograms(data);
          } else {
            // Only show programs assigned/led by this coach
            setPrograms(data.filter((p: any) => p.coach_id === user?.id));
          }
        }
      } catch (err) {
        console.error("Failed to fetch programs:", err);
      }
    };

    if (isOpen) {
      fetchAthleteName();
      fetchPrograms();
      setSelectedProgramId("");
      setNotes("");
      setError("");
    }
  }, [isOpen, athleteId, athleteName, user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) {
      setError("Please select a program protocol.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: athleteId,
          programId: selectedProgramId,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize protocol enrollment.");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to assign program.");
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
          className="relative w-full md:max-w-md bg-[#111] border border-gray-800 rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50 text-left"
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
                ASSIGN PROGRAM
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
              {/* Select Program */}
              <div className="space-y-2">
                <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                  Training Program
                </label>
                <div className="relative">
                  <select
                    required
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium appearance-none cursor-pointer"
                  >
                    <option value="">Select program...</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.duration})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▾</div>
                </div>
                {programs.length === 0 && (
                  <p className="text-[10px] text-amber-500 font-medium ml-1">
                    No active programs assigned to your supervisor identity.
                  </p>
                )}
              </div>

              {/* Notes / Instructions */}
              <div className="space-y-2">
                <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                  Special Notes / Instructions
                </label>
                <textarea
                  rows={4}
                  placeholder="EX: FOCUS ON FORM AND REST BLOCKS..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  disabled={loading || !selectedProgramId}
                  className="w-full py-3.5 bg-[#22c55e] hover:bg-[#4ade80] disabled:bg-[#22c55e]/30 disabled:cursor-not-allowed text-black font-display font-bold text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      INITIALIZING...
                    </>
                  ) : (
                    <>ASSIGN PROTOCOL →</>
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
