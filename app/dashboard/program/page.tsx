"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Clipboard, 
  Clock, 
  BarChart3, 
  CheckCircle2, 
  Lock,
  Zap,
  Loader2,
  Trophy,
  Activity,
  ChevronRight,
  X
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTimezone } from "@/hooks/useTimezone";


export default function MyProgramPage() {
  const { user, loading: authLoading } = useAuth();
  const { formatTimeOnly } = useTimezone();
  const [program, setProgram] = useState<any>(null);
  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [isRequested, setIsRequested] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProgram();
    }
  }, [user, authLoading]);

  const fetchProgram = async () => {
    try {
      const res = await fetch(`/api/admin/enrollments?userId=${user?.id}`);
      const data = await res.json();
      if (!data.error && data.length > 0) {
        const activeOrPending = data[0];
        setProgram(activeOrPending);
        if (activeOrPending.status === 'active') {
          fetchSchedule(activeOrPending.program_id);
        }
      } else {
        // No enrollment, fetch all available programs
        const progRes = await fetch("/api/admin/programs");
        const progData = await progRes.json();
        if (!progData.error) setAllPrograms(progData);
      }
    } catch (err) {
      console.error("Failed to fetch program:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (programId: string) => {
    try {
      const res = await fetch(`/api/coach/program-schedule?programId=${programId}`);
      const data = await res.json();
      if (!data.error) setSchedule(data);
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
    }
  };

  const handleEnrollmentRequest = async (programId: string) => {
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
          setIsRequested(false);
          setSelectedProgram(null);
          fetchProgram();
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

  const availableProgramsUI = (
    <div className={program ? "mt-24 pt-20 border-t border-border-primary/50" : "p-10 max-w-6xl"}>
      <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-accent-green" size={16} />
            <span className="text-[10px] font-black text-accent-green uppercase tracking-[4px]">Available Protocols</span>
          </div>
          <h1 className={`font-display text-5xl md:text-7xl text-text-primary uppercase tracking-wider`}>Elite Programs</h1>
          <p className="text-text-secondary text-xs font-black uppercase tracking-[2px] mt-4 max-w-xl leading-relaxed">
            Initialize your evolution. Browse the tactical training blueprints and request authority enrollment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPrograms.filter((p: any) => p.id !== program?.program_id).map((p: any, i: number) => (
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
                  <Activity size={20} />
                </div>
              </div>

              <h3 className="text-xl font-bold text-text-primary uppercase tracking-wider mb-2">{p.title}</h3>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest line-clamp-2 mb-8">{p.description}</p>

              <div className="grid grid-cols-2 gap-4 border-t border-border-primary/50 pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="text-accent-green" size={14} />
                  <span className="text-[10px] font-bold text-text-secondary uppercase">
                    {p.session_time ? formatTimeOnly(p.session_time, 'UTC') : p.duration}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="text-accent-green" size={14} />
                  <span className="text-[10px] font-bold text-text-secondary uppercase">{p.level}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enrollment Request Modal */}
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
                      <h2 className="text-3xl font-bold text-text-primary uppercase tracking-tight mb-4">{selectedProgram.title}</h2>
                      
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-bg-primary/50 p-3 rounded-2xl border border-border-primary/50">
                          <p className="text-[7px] font-black text-text-muted uppercase tracking-widest mb-1">Category</p>
                          <p className="text-[9px] font-black text-accent-green uppercase truncate">{selectedProgram.category}</p>
                        </div>
                        <div className="bg-bg-primary/50 p-3 rounded-2xl border border-border-primary/50">
                          <p className="text-[7px] font-black text-text-muted uppercase tracking-widest mb-1">Time</p>
                          <p className="text-[9px] font-black text-text-primary uppercase truncate">
                            {selectedProgram.session_time ? formatTimeOnly(selectedProgram.session_time, 'UTC') : selectedProgram.duration}
                          </p>
                        </div>
                        <div className="bg-bg-primary/50 p-3 rounded-2xl border border-border-primary/50">
                          <p className="text-[7px] font-black text-text-muted uppercase tracking-widest mb-1">Expertise</p>
                          <p className="text-[9px] font-black text-text-primary uppercase truncate">{selectedProgram.level}</p>
                        </div>
                      </div>

                      <p className="text-[10px] text-text-secondary leading-relaxed font-sans italic mb-8 px-1">
                        "{selectedProgram.description}"
                      </p>
                      
                      <div className="space-y-6 mb-10">
                        <div className="bg-bg-primary/40 border border-border-primary/50 rounded-2xl p-6">
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-[2px] mb-2">Registration Fee</p>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold text-text-primary tracking-tighter">${selectedProgram.price}</span>
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Initialization Cost</span>
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
                          onClick={() => handleEnrollmentRequest(selectedProgram.id)}
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
                    <p className="text-[10px] text-text-muted uppercase tracking-[2px]">Awaiting authority confirmation...</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );

  if (!program) {
    return availableProgramsUI;
  }
  if (program.payment_status === 'pending') {
    return (
      <div className="p-10 max-w-4xl text-center">
        <div className="w-20 h-20 bg-accent-green/10 border border-accent-green/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Clock className="text-accent-green animate-pulse" size={32} />
        </div>
        <h2 className={`font-display text-3xl text-text-primary uppercase tracking-wider mb-4`}>Transfer Verification</h2>
        <p className="text-text-secondary text-[10px] font-black max-w-sm mx-auto uppercase tracking-[3px] leading-relaxed mb-8">
          Your request for <span className="text-text-primary">"{program.program.title}"</span> is being processed. 
          Once our authority confirms your bank transfer, your architecture will be initialized.
        </p>
        <div className="bg-bg-card border border-border-primary/50 rounded-2xl p-6 text-left max-w-sm mx-auto shadow-2xl shadow-accent/5">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-[2px] mb-4">Official Payment Portal</p>
          <p className="text-[11px] font-bold text-text-primary uppercase tracking-widest leading-loose">
            Account: 0098 7721 2291<br />
            Bank: Elite Performance Int.<br />
            Ref: {program.payment_reference || "PENDING_AUTH"}
          </p>
        </div>
      </div>
    );
  }

  const p = program.program;
  const coach = p.coach;
  const coachName = coach ? `${coach.first_name} ${coach.last_name}` : "H. Performance Team";
  
  // Dynamic Insights from Program Settings
  const weeklyCommitment = p.weekly_commitment || 4;
  const recoveryBlocks = p.recovery_blocks || 3;
  // Dynamic Syllabus from DB
  const syllabus = (p.syllabus && p.syllabus.length > 0) ? p.syllabus.map((s: any) => ({
    title: s.title,
    status: s.status,
    duration: s.duration,
    icon: s.status === 'completed' ? <CheckCircle2 size={16} /> : 
          s.status === 'active' ? <Zap size={16} /> : <Lock size={16} />
  })) : [
    { title: `${p.category} Initialization`, status: 'completed', icon: <CheckCircle2 size={16} /> },
    { title: `Active ${p.category} Phase`, status: 'active', icon: <Zap size={16} /> },
    { title: 'Advanced Integration', status: 'locked', icon: <Lock size={16} /> },
    { title: 'Elite Resilience Protocol', status: 'locked', icon: <Lock size={16} /> },
  ];

  const completedPhases = syllabus.filter((s: any) => s.status === 'completed').length;
  const totalPhases = syllabus.length;
  const completionPercentage = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
  const activePhase = syllabus.find((s: any) => s.status === 'active')?.title || 'Evaluation';

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-green/10 border border-accent-green/30 rounded-full mb-4">
            <Zap className="text-accent-green" size={10} />
            <span className="text-[10px] font-black text-accent-green uppercase tracking-[2px]">{p.category} Protocol</span>
          </div>
          <h2 className={`font-display text-5xl text-text-primary uppercase tracking-wider leading-none`}>{p.title}</h2>
          <p className="text-text-secondary text-[10px] font-black uppercase tracking-[3px] mt-4">Initialized on {new Date(program.enrolled_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-bg-card border border-border-primary/50 rounded-2xl flex flex-col items-center shadow shadow-accent/5">
            <span className="text-[8px] font-black text-text-muted uppercase tracking-[2px] mb-1">Estimated Intensity</span>
            <span className="text-sm font-bold text-accent-green uppercase">{p.level}</span>
          </div>
          <div className="px-6 py-3 bg-bg-card border border-border-primary/50 rounded-2xl flex flex-col items-center shadow shadow-accent/5">
            <span className="text-[8px] font-black text-text-muted uppercase tracking-[2px] mb-1">Cycle Duration</span>
            <span className="text-sm font-bold text-text-primary uppercase">{p.duration}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Protocol Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Overview */}
          <section className="bg-gradient-to-br from-bg-card to-bg-secondary border border-border-primary/50 rounded-3xl p-8 shadow-2xl overflow-hidden relative group shadow-accent/5">
            <div className="absolute top-0 right-0 p-8 pointer-events-none text-text-primary/5 group-hover:text-text-primary/10 transition-colors">
              <Activity size={120} />
            </div>
            <h3 className="text-[11px] font-black text-accent-green uppercase tracking-[3px] mb-8">Evolution Track</h3>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-text-primary uppercase tracking-[2px]">Protocol Completion</span>
              <span className="text-lg font-black text-accent-green">{completionPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-bg-primary/40 rounded-full overflow-hidden mb-8">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                className="h-full bg-accent-green rounded-full shadow-[0_0_20px_var(--accent-green)]" 
              />
            </div>
            
            <p className="text-sm text-text-secondary leading-relaxed uppercase tracking-wider font-medium">
              You are currently in the **{activePhase}** phase for <span className="text-accent-green">{p.title}</span>. Your coach is monitoring your performance markers for threshold consistency.
            </p>
          </section>

          {/* Curriculum Modules */}
          <section className="space-y-4">
             <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[3px] mb-6 px-2">Syllabus Breakdown</h3>
             {syllabus.map((m: any, i: number) => (
               <div 
                 key={i}
                 className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${
                   m.status === 'completed' ? 'bg-accent-green/5 border-accent-green/20 opacity-60' :
                   m.status === 'active' ? 'bg-bg-card border-accent-green shadow-[0_0_30px_var(--shadow-accent)]' :
                   'bg-bg-card border-border-primary/50 opacity-40'
                 }`}
               >
                 <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                     m.status === 'completed' ? 'bg-accent-green/20 text-accent-green' :
                     m.status === 'active' ? 'bg-accent-green text-text-on-green' : 'bg-bg-primary text-text-muted'
                   }`}>
                     {m.icon}
                   </div>
                   <div>
                     <p className={`text-sm font-bold uppercase tracking-widest ${m.status === 'locked' ? 'text-text-muted' : 'text-text-primary'}`}>{m.title}</p>
                     <p className="text-[8px] font-black uppercase tracking-[2px] text-text-muted mt-1">
                       {m.status} {m.duration ? `// ${m.duration}` : ''}
                     </p>
                   </div>
                 </div>
                 {m.status === 'active' && <span className="text-[10px] font-black text-accent-green animate-pulse uppercase tracking-[2px]">Live Now</span>}
               </div>
             ))}
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-primary/50 rounded-3xl p-8 shadow-2xl shadow-accent/5">
            <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[3px] mb-8">Performance Lead</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-accent-green/30 flex items-center justify-center bg-bg-primary">
                {coach?.avatar_url ? (
                  <img src={coach.avatar_url} alt={coachName} className="w-full h-full object-cover" />
                ) : (
                  <Trophy className="text-accent-green" size={20} />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary uppercase tracking-wider">{coachName}</p>
                <p className="text-[9px] font-black text-accent-green uppercase tracking-[2px]">Lead Supervisor</p>
              </div>
            </div>
            <button className="w-full py-4 bg-bg-primary/50 border border-border-primary rounded-xl text-[10px] font-black text-text-primary uppercase tracking-[2px] transition-all hover:bg-accent-green hover:text-text-on-green">
              Message Coaching Staff
            </button>
          </div>

          <div className="bg-bg-card border border-border-primary/50 rounded-3xl p-8 overflow-hidden relative shadow-2xl shadow-accent/5">
            <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[3px] mb-6">Cycle Insights</h3>
            <div className="space-y-4">
               {[
                 { label: 'Weekly Commitment', value: `${weeklyCommitment} Sessions` },
                 { label: 'Recovery Blocks', value: `${recoveryBlocks} Units` },
                 { label: 'Protocol Type', value: p.category },
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center py-3 border-b border-border-primary/50 last:border-0">
                   <span className="text-[9px] font-black text-text-muted uppercase tracking-[2px]">{item.label}</span>
                   <span className="text-xs font-bold text-text-primary tracking-widest">{item.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Show Available Programs below active program */}
      {availableProgramsUI}
    </div>
  );
}
