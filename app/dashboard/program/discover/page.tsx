"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Clock, 
  DollarSign, 
  Users, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function DiscoverPrograms() {
  const { user, profile } = useAuth();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/admin/programs");
      const data = await res.json();
      if (!data.error) setPrograms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (programId: string) => {
    setRequestLoading(true);
    try {
      const res = await fetch("/api/athlete/program-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          programId,
          payment_reference: `TRF_${Math.random().toString(36).substring(7).toUpperCase()}`
        })
      });

      if (res.ok) {
        setIsRequested(true);
        setTimeout(() => {
          router.push("/dashboard/program");
        }, 3000);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="text-accent-green animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="text-accent-green" size={16} />
          <span className="text-[10px] font-black text-accent-green uppercase tracking-[4px]">Architecture Discovery</span>
        </div>
        <h1 className={`font-display text-5xl md:text-7xl text-text-primary uppercase tracking-wider`}>Select Matrix</h1>
        <p className="text-text-secondary text-xs font-black uppercase tracking-[2px] mt-4 max-w-xl leading-relaxed">
          Initialize your evolution. Browse the tactical training blueprints and request authority enrollment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((p, i) => (
          <motion.div 
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-bg-card border border-border-primary/50 rounded-3xl p-8 hover:border-accent-green/30 transition-all cursor-pointer shadow-lg shadow-accent/5"
            onClick={() => setSelectedProgram(p)}
          >
            <div className="flex justify-between items-start mb-6">
              <span className="px-2 py-0.5 bg-accent-green/10 border border-accent-green/20 text-accent-green text-[8px] font-black uppercase tracking-widest rounded">{p.category}</span>
              <div className="text-text-muted/40 group-hover:text-accent-green transition-colors">
                <ChevronRight size={20} />
              </div>
            </div>

            <h3 className="text-xl font-bold text-text-primary uppercase tracking-wider mb-2">{p.title}</h3>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest line-clamp-2 mb-8">{p.description}</p>

            <div className="grid grid-cols-2 gap-4 border-t border-border-primary/50 pt-6">
              <div className="flex items-center gap-2">
                <Clock className="text-accent-green" size={14} />
                <span className="text-[10px] font-bold text-text-secondary uppercase">{p.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="text-accent-green" size={14} />
                <span className="text-[10px] font-bold text-text-secondary uppercase">${p.price}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Request Modal */}
      <AnimatePresence>
        {selectedProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              style={{ backgroundColor: 'var(--backdrop-overlay)' }}
              onClick={() => !requestLoading && setSelectedProgram(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-bg-card border border-border-primary/50 rounded-[32px] p-10 overflow-hidden shadow-2xl shadow-accent/10"
            >
              <div className="absolute top-0 right-0 p-10 pointer-events-none text-text-primary/5">
                <Zap size={140} />
              </div>

              {!isRequested ? (
                <>
                  <div className="relative z-10">
                    <h3 className="text-[11px] font-black text-accent-green uppercase tracking-[3px] mb-2">Protocol Request</h3>
                    <h2 className="text-3xl font-bold text-text-primary uppercase tracking-tight mb-8">{selectedProgram.title}</h2>
                    
                    <div className="space-y-6 mb-10">
                      <div className="bg-bg-primary/40 border border-border-primary/50 rounded-2xl p-6">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[2px] mb-2">Bank Transfer Details</p>
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-text-primary uppercase tracking-widest flex justify-between">
                            <span>Account</span> <span>0098 7721 2291</span>
                          </p>
                          <p className="text-xs font-bold text-text-primary uppercase tracking-widest flex justify-between">
                            <span>Bank</span> <span>Elite Performance Int.</span>
                          </p>
                          <p className="text-xs font-bold text-text-primary uppercase tracking-widest flex justify-between">
                            <span>Amount</span> <span className="text-accent-green">${selectedProgram.price}.00</span>
                          </p>
                        </div>
                      </div>

                      <p className="text-[9px] text-text-muted uppercase tracking-[2px] leading-relaxed">
                        By initializing this request, you agree to complete the bank transfer. Access will be granted once our authority confirms the transaction.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setSelectedProgram(null)}
                        className="flex-1 py-4 bg-bg-primary/50 border border-border-primary rounded-xl text-[10px] font-black text-text-primary uppercase tracking-[2px] transition-all hover:bg-bg-card-hover"
                      >
                        Abort
                      </button>
                      <button 
                        disabled={requestLoading}
                        onClick={() => handleRequest(selectedProgram.id)}
                        className="flex-1 py-4 bg-accent-green text-text-on-green text-[10px] font-black uppercase tracking-[2px] rounded-xl transition-all hover:bg-text-primary hover:text-bg-primary flex items-center justify-center gap-2"
                      >
                        {requestLoading ? <Loader2 className="animate-spin" size={14} /> : "Initialize"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative z-10 py-10 text-center">
                  <div className="w-16 h-16 bg-accent-green/10 border border-accent-green/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="text-accent-green" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary uppercase tracking-tight mb-2">Request Transmitted</h3>
                  <p className="text-[10px] text-text-muted uppercase tracking-[2px]">Redirecting to command center...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
