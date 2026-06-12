"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Plus, 
  AlertCircle,
  Loader2,
  Trophy,
  History,
  Timer
} from "lucide-react";
import Link from "next/link";


export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchSchedule();
    }
  }, [user, authLoading]);

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`/api/admin/assessments?userId=${user?.id}`);
      const data = await res.json();
      if (!data.error) {
        setAssessments(data);
      }
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="text-accent-green animate-spin" size={40} />
      </div>
    );
  }

  const upcoming = assessments.filter(a => a.status === 'scheduled' || a.status === 'pending');
  const past = assessments.filter(a => a.status === 'completed' || a.status === 'missed');

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h2 className={`font-display text-5xl text-text-primary uppercase tracking-wider leading-none`}>Performance Timeline</h2>
          <p className="text-text-secondary text-[10px] font-black uppercase tracking-[3px] mt-4">Your elite evaluation schedule and milestone history</p>
        </div>
        <Link 
          href="/dashboard/booking"
          className="px-8 py-4 bg-accent-green text-text-on-green text-[11px] font-black uppercase tracking-[2px] rounded-xl flex items-center gap-2 hover:bg-text-primary hover:text-bg-primary transition-all shadow-[0_10px_30px_var(--shadow-accent-glow)] hover:scale-105"
        >
          <Plus size={18} /> Schedule Assessment
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Schedule Column */}
        <div className="lg:col-span-2 space-y-12">
          {/* Upcoming Section */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Timer className="text-accent-green" size={20} />
              <h3 className="text-[12px] font-black text-text-primary uppercase tracking-[3px]">Upcoming Milestones</h3>
            </div>

            {upcoming.length === 0 ? (
              <div className="p-10 bg-bg-primary/40 border border-border-primary/50 rounded-3xl text-center">
                <p className="text-text-muted text-[10px] font-black uppercase tracking-[3px]">No assessments currently scheduled</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-px before:bg-border-primary/50">
                {upcoming.map((a, i) => (
                  <motion.div 
                    key={a.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative pl-16 group"
                  >
                    <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-accent-green border-4 border-bg-primary z-10 shadow-[0_0_10px_var(--accent-green)]" />
                    <div className="bg-bg-card border border-border-primary/50 p-6 rounded-2xl group-hover:border-accent-green/30 transition-all shadow shadow-accent/5">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <p className="text-[9px] font-black text-accent-green uppercase tracking-[3px] mb-2">{a.assessment_type}</p>
                          <h4 className="text-lg font-bold text-text-primary uppercase tracking-wider">{new Date(a.assessment_date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</h4>
                          <div className="flex items-center gap-4 mt-2">
                             <div className="flex items-center gap-2 text-text-secondary text-[10px] font-black uppercase">
                               <Clock size={12} />
                               {new Date(a.assessment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <div className="flex items-center gap-2 text-text-secondary text-[10px] font-black uppercase">
                               <Plus size={12} className="text-accent-green" />
                               Elite Supervision
                             </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center">
                           <div className="px-3 py-1 bg-accent-green/10 border border-accent-green/30 rounded-full">
                             <span className="text-[8px] font-black text-accent-green uppercase tracking-[2px]">{a.status}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Past/History Section */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <History className="text-text-muted" size={20} />
              <h3 className="text-[12px] font-black text-text-muted uppercase tracking-[3px]">Protocol History</h3>
            </div>

            {past.length === 0 ? (
              <p className="text-text-muted text-[10px] uppercase font-bold text-center italic py-4">No historical records available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {past.map(a => (
                  <div key={a.id} className="p-6 bg-bg-primary/40 border border-border-primary/50 rounded-2xl opacity-65">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[8px] font-black text-text-secondary uppercase tracking-[2px]">{a.assessment_type}</span>
                      {a.status === 'completed' ? <CheckCircle2 className="text-accent-green" size={14} /> : <AlertCircle className="text-red-500" size={14} />}
                    </div>
                    <p className="text-xs font-bold text-text-primary uppercase tracking-widest">{new Date(a.assessment_date).toLocaleDateString()}</p>
                    <p className="text-[9px] text-text-muted uppercase mt-2 font-black">{a.status}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-8">
          <div className="bg-bg-card border border-border-primary/50 rounded-3xl p-8 relative overflow-hidden group shadow-2xl shadow-accent/5">
            <div className="absolute top-0 right-0 p-6 pointer-events-none text-text-primary/5 group-hover:text-text-primary/10 transition-colors">
              <Trophy size={80} />
            </div>
            <h3 className="text-[11px] font-black text-accent-green uppercase tracking-[3px] mb-8">Assessment Notice</h3>
            <p className="text-xs text-text-secondary leading-relaxed uppercase tracking-wider font-semibold">
              Please arrive 15 minutes prior to your scheduled evaluation. Hydration markers will be tested as part of the metabolic baseline.
            </p>
            <div className="mt-8 pt-6 border-t border-border-primary/50">
               <div className="flex items-center gap-3 text-text-muted">
                 <AlertCircle size={14} />
                 <span className="text-[9px] font-black uppercase tracking-[2px]">Cancellations require 24H notice</span>
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-bg-card to-bg-secondary border border-border-primary/50 rounded-3xl p-8 shadow-2xl shadow-accent/5">
            <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[3px] mb-8">Scheduling Frequency</h3>
            <div className="space-y-4">
              {[
                { label: 'Core Vitals', freq: 'Monthly' },
                { label: 'Biometrics', freq: 'Quarterly' },
                { label: 'Metabolic', freq: 'As Assigned' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-border-primary/50 last:border-0 grow">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-[2px]">{item.label}</span>
                  <span className="text-[10px] font-black text-text-primary uppercase tracking-[2px]">{item.freq}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

