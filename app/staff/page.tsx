"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users as UsersIcon, 
  Activity, 
  Search,
  Plus,
  ArrowRight, 
  Loader2,
  Zap,
  Calendar as CalendarIcon,
  AlertTriangle,
  Clipboard,
  MessageSquare,
  ShieldAlert,
  Target,
  LogOut,
  Settings,
  BarChart3,
  Layers
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

// Dashboard Components
import SwipeableCards from "@/components/dashboard/SwipeableCards";
import ProgressBar from "@/components/dashboard/ProgressBar";

// Management Modals
import TrainingPlanModal from "@/components/modals/TrainingPlanModal";
import InjuryLogModal from "@/components/modals/InjuryLogModal";
import SurveyAssignModal from "@/components/modals/SurveyAssignModal";
import VideoFeedbackModal from "@/components/modals/VideoFeedbackModal";
import TrainingLoadExpandedModal from "@/components/modals/TrainingLoadExpandedModal";
import ReviewAlertsModal from "@/components/modals/ReviewAlertsModal";
import AthleteAssessmentModal from "@/components/modals/AthleteAssessmentModal";
import ManageScheduleModal from "@/components/modals/ManageScheduleModal";
import ProgramAssignModal from "@/components/modals/ProgramAssignModal";

// Admin UI Components
import AlertsFlagsWidget from "@/components/admin/AlertsFlagsWidget";
import TrainingSessionControl from "@/components/admin/TrainingSessionControl";
import AthleteRoster from "@/components/admin/AthleteRoster";
import AdminBookingsPanel from "@/components/admin/AdminBookingsPanel";
import CoachScheduleWidget from "@/app/components/CoachScheduleWidget";

// Operational Modals
import CreateSessionModal from "@/components/modals/CreateSessionModal";
import SessionDetailsModal from "@/components/modals/SessionDetailsModal";
import AdjustLoadModal from "@/components/modals/AdjustLoadModal";



export default function StaffPortal() {
  const { user, profile, loading: authLoading, signOut, supabase } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("kiox_onboarding_dismissed");
    if (!dismissed) {
      setShowOnboarding(true);
    }
  }, []);

  const handleDismissOnboarding = () => {
    localStorage.setItem("kiox_onboarding_dismissed", "true");
    setShowOnboarding(false);
  };
  const [athletes, setAthletes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [staffNotes, setStaffNotes] = useState<any[]>([]);
  const [enrolledAthletes, setEnrolledAthletes] = useState<any[]>([]);
  const [myPrograms, setMyPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [wellnessStats, setWellnessStats] = useState({
    readyPercent: 0,
    completionCount: 0,
    sleepAnomalies: 0,
    extremeSoreness: 0,
    hydrationFlags: 0
  });

  // Management Modal States
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isInjuryModalOpen, setIsInjuryModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAssignProgramModalOpen, setIsAssignProgramModalOpen] = useState(false);
  
  // Operational State
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAdjustLoadOpen, setIsAdjustLoadOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);

  const router = useRouter();

  const fetchingRef = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
    if (!authLoading && !fetchingRef.current) {
        if (!user) {
            router.push("/signin");
        } else if (profile?.role !== 'staff' && profile?.role !== 'superadmin' && profile?.role !== 'medical') {
            router.push("/dashboard");
        } else if (profile?.role === 'medical') {
            router.push("/staff/chat");
        } else {
            fetchAdminData();
        }
    }
  }, [user?.id, profile?.role, authLoading]);

  const fetchAdminData = async () => {
    if (athletes.length === 0) setLoading(true);
    fetchingRef.current = true;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [athRes, alrtRes, noteRes, wellRes, sessionRes] = await Promise.all([
        fetch('/api/admin/athletes'),
        fetch('/api/admin/alerts'),
        fetch('/api/admin/notes'),
        fetch('/api/admin/team/wellness-summary'),
        supabase
          .from('training_sessions')
          .select('*')
          .eq('scheduled_date', today)
          .order('scheduled_time', { ascending: true })
      ]);

      const [athData, alrtData, noteData, wellData] = await Promise.all([
        athRes.json(),
        alrtRes.json(),
        noteRes.json(),
        wellRes.json()
      ]);

      if (!athData.error) setAthletes(athData);
      if (!alrtData.error) setAlerts(alrtData);
      if (!noteData.error) setStaffNotes(noteData);

      if (!wellData.error) {
        // Calculate ready percent: (Sleep Avg + (10 - Soreness Avg)) / 20 * 100
        const sleepWeight = wellData.avg_sleep || 0;
        const sorenessWeight = 10 - (wellData.avg_soreness || 0);
        const readyPercent = logsExist ? Math.round(((sleepWeight + sorenessWeight) / 20) * 100) : 0;
        
        setWellnessStats({
          readyPercent: readyPercent || 0,
          completionCount: wellData.completion_count || 0,
          sleepAnomalies: wellData.low_sleep_count || 0, // Assuming 0 for now as API might not provide it yet
          extremeSoreness: wellData.high_soreness_count || 0,
          hydrationFlags: wellData.hydration_flag ? 1 : 0
        });
      }

      if (!sessionRes.error && sessionRes.data) {
        const mappedSessions = sessionRes.data.map(s => ({
          name: s.title,
          time: s.start_time.slice(0, 5),
          type: s.session_type.toLowerCase()
        }));
        setTodaySessions(mappedSessions);
      }

      // Fetch Enrolled Athletes for this Coach
      const enrollRes = await fetch("/api/admin/enrollments");
      const enrollData = await enrollRes.json();
      if (!enrollData.error) {
        // Filter for active enrollments where this staff is the coach
        // We need to fetch the program details to check coach_id
        const myEnrollments = enrollData.filter((e: any) => 
          e.status === 'active' && e.program?.coach_id === user?.id
        );
        setEnrolledAthletes(myEnrollments);
      }

      // Fetch Programs assigned to this coach
      const progRes = await fetch("/api/admin/programs");
      const progData = await progRes.json();
      if (!progData.error) {
        setMyPrograms(progData.filter((p: any) => p.coach_id === user?.id));
      }
    } catch (error) {
      console.error("Staff Matrix Sync Error:", error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const logsExist = wellnessStats.completionCount > 0;

  const handleAddNote = async () => {
    if (!newNote || newNote.trim().length === 0) return;
    
    setIsSavingNote(true);
    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedAthlete || null, 
          note: newNote 
        })
      });
      if (res.ok) {
        setNewNote("");
        setSearchQuery(""); // Clear search so the new note is visible
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(`Failed to save note: ${err.error || 'Unauthorized'}`);
      }
    } catch (err) {
      console.error("Failed to add note:", err);
      alert("System Error: Failed to reach the notes API.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSignOut = async () => {
     await signOut();
  };

  if (!isHydrated || loading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-[var(--accent-green)]/10 animate-ping absolute inset-0" />
          <div className="w-20 h-20 rounded-full border-t-2 border-[var(--accent-green)] animate-spin" />
        </div>
        <div className="font-label text-[var(--accent-green)] animate-pulse">
          Syncing Operational Matrix...
        </div>
      </div>
    );
  }

  const teamStats = {
    total: athletes.length,
    pending: athletes.filter(a => a.status === 'pending').length,
    active: athletes.filter(a => a.status === 'active' || a.status === 'approved').length,
    trainingToday: todaySessions.length,
    highFatigue: athletes.filter(a => a.training_status === 'monitor').length,
    injuryAlerts: alerts.length
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden">
      {/* ========================
          NAVIGATION HEADER
          ======================== */}
      {/* Main Staff Portal Container */}
      <div className="pt-6 md:pt-10 pb-20 px-4 md:px-10 max-w-7xl mx-auto space-y-6 md:space-y-10 relative">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* ========================
            PAGE CONTENT HEADER
            ======================== */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input
              placeholder="Search athletes or logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl py-3 md:py-4 pl-12 pr-4 text-[var(--text-primary)] text-xs md:text-sm font-label focus:outline-none focus:border-[var(--accent-green)] transition-all placeholder:text-[var(--text-muted)] shadow-2xl"
            />
          </div>
        </div>

        {/* Onboarding Banner */}
        {showOnboarding && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[24px] p-6 md:p-8 shadow-2xl relative overflow-hidden group/onboard z-10">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover/onboard:opacity-[0.04] transition-opacity">
              <Zap size={140} className="text-[var(--accent-green)]" />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
              <div>
                <div className="text-[var(--accent-green)] font-display text-[10px] tracking-[0.3em] uppercase mb-1">Onboarding Guide</div>
                <h2 className="text-[var(--text-primary)] font-display text-lg md:text-xl font-black uppercase tracking-wider">Getting Started</h2>
                <p className="text-[var(--text-secondary)] text-xs mt-1 font-sans">Follow these steps to initialize your trainer dashboard and start tracking performance.</p>
              </div>
              <button 
                onClick={handleDismissOnboarding}
                className="px-4 py-2 border border-[var(--border-primary)] hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)] rounded-xl text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all uppercase font-label font-bold"
              >
                Dismiss
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 relative z-10">
              {[
                { step: "Step 1", title: "Add your athletes", desc: "Register active athletes to populate your roster and track recovery." },
                { step: "Step 2", title: "Create a training program", desc: "Design customized training protocols under Training Programs." },
                { step: "Step 3", title: "Schedule a session", desc: "Book live training sessions to gather active load metrics and recovery data." }
              ].map((item, index) => (
                <div key={index} className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
                  <span className="text-[9px] font-black text-[var(--accent-green)] uppercase tracking-widest">{item.step}</span>
                  <h4 className="text-[var(--text-primary)] font-bold uppercase tracking-wider text-xs mt-1 mb-2">{item.title}</h4>
                  <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed font-sans">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. TEAM OVERVIEW CARDS */}
        <SwipeableCards cards={[
          { label: 'My Athletes', value: teamStats.total, icon: '👥', color: '#22c55e' },
          { label: 'PENDING TASKS', value: teamStats.pending, icon: '🔐', color: '#f59e0b' },
          { label: 'Active Athletes', value: teamStats.active, icon: '✅', color: '#22c55e' },
        ]} />

        {/* ========================
            INDIVIDUAL MANAGEMENT SECTION
            ======================== */}
        {/* 3. ATHLETE LIST (HIGHER-FIDELITY ATHLETE ROSTER) */}
        <AthleteRoster 
          onSelectAthlete={(id) => { 
            setSelectedAthlete(id); 
            setIsPlanModalOpen(true);
          }}
          onLogSession={(id) => { setSelectedAthlete(id); setIsLoadModalOpen(true); }}
          onLogInjury={(id) => { setSelectedAthlete(id); setIsInjuryModalOpen(true); }}
          onViewAnalytics={(id) => { setSelectedAthlete(id); setIsVideoModalOpen(true); }}
          onAssess={(id) => { setSelectedAthlete(id); setIsAssessmentModalOpen(true); }}
          onAssignProgram={(id) => { setSelectedAthlete(id); setIsAssignProgramModalOpen(true); }}
          externalSearchQuery={searchQuery}
        />

        {/* NEW: ASSIGNED ARCHITECTURES SECTION */}
        <div id="assigned-architectures" className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[24px] p-8 shadow-xl relative overflow-hidden group/arch">
           <div className="absolute top-0 right-0 p-8 opacity-5 font-display text-7xl pointer-events-none group-hover/arch:opacity-10 transition-opacity">MATRIX</div>
           <div className="flex items-center justify-between mb-8">
              <div className="text-[var(--accent-green)] font-display text-sm flex items-center gap-3 uppercase">
                 <ShieldAlert className="animate-pulse" size={18} /> My Training Programs
              </div>
              <div className="px-3 py-1 bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 rounded-full text-[var(--accent-green)] text-[10px] font-black uppercase tracking-widest">
                 {myPrograms.length} TOTAL PROGRAMS
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPrograms.length === 0 ? (
                 <div className="col-span-full py-12 text-center text-[var(--text-secondary)] font-label italic border border-dashed border-[var(--border-primary)] rounded-2xl bg-[var(--bg-primary)]/20">
                    NO OPERATIONAL ARCHITECTURES ASSIGNED TO YOUR IDENTITY
                 </div>
              ) : (
                myPrograms.map((prog, i) => (
                  <motion.div 
                    key={prog.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 hover:border-[var(--accent-green)]/30 transition-all cursor-pointer group/card relative"
                    onClick={() => {
                      setSelectedProgram(prog);
                      setIsProgramModalOpen(true);
                    }}
                  >
                    <div className="flex flex-col h-full">
                       <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 rounded-lg bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 flex items-center justify-center">
                             <Target className="text-[var(--accent-green)]" size={18} />
                          </div>
                          <span className="text-[8px] font-black bg-[var(--accent-green)] text-[var(--text-on-green)] px-2 py-0.5 rounded uppercase tracking-tighter">Active</span>
                       </div>
                       
                       <h4 className="text-[var(--text-primary)] font-bold uppercase tracking-wider text-sm mb-2 group-hover:text-[var(--accent-green)] transition-colors">{prog.title}</h4>
                       <p className="text-[var(--text-secondary)] text-[10px] font-medium leading-relaxed line-clamp-2 mb-6">
                         {prog.description}
                       </p>

                       <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-primary)]/50">
                          <div className="space-y-1">
                             <p className="text-[7px] text-[var(--text-muted)] font-black uppercase tracking-widest">Category</p>
                             <p className="text-[9px] text-[var(--accent-green)] font-black uppercase">{prog.category}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[7px] text-[var(--text-muted)] font-black uppercase tracking-widest">Duration</p>
                             <p className="text-[9px] text-[var(--text-primary)] font-black uppercase">{prog.duration}</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProgram(prog);
                            setIsScheduleModalOpen(true);
                          }}
                          className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 rounded-xl text-[8px] font-black text-[var(--accent-green)] uppercase tracking-widest hover:bg-[var(--accent-green)] hover:text-[var(--text-on-green)] transition-all"
                        >
                           <Zap size={10} /> Configure Matrix
                        </button>
                     </div>
                  </motion.div>
                ))
              )}
           </div>
        </div>

        {/* NEW: PROTOCOL ASSIGNMENTS SECTION */}

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[24px] p-8 shadow-xl relative overflow-hidden group/proto">
           <div className="absolute top-0 right-0 p-8 opacity-5 font-display text-7xl pointer-events-none group-hover/proto:opacity-10 transition-opacity">PROTO</div>
           <div id="protocol-assignments" className="flex items-center justify-between mb-8">
              <div className="text-[var(--accent-green)] font-display text-sm flex items-center gap-3 uppercase">
                 <Layers className="animate-pulse" size={18} /> Assigned Athletes
              </div>
              <div className="px-3 py-1 bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 rounded-full text-[var(--accent-green)] text-[10px] font-black uppercase tracking-widest">
                 {enrolledAthletes.length} ACTIVE ATHLETES
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledAthletes.length === 0 ? (
                 <div className="col-span-full py-12 text-center text-[var(--text-secondary)] font-label italic border border-dashed border-[var(--border-primary)] rounded-2xl bg-[var(--bg-primary)]/20">
                    NO ATHLETES CURRENTLY ASSIGNED TO YOUR PROGRAMS
                 </div>
              ) : (
                enrolledAthletes.map((enroll, i) => (
                  <motion.div 
                    key={enroll.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 hover:border-[var(--accent-green)]/30 transition-all cursor-pointer group/card"
                    onClick={() => {
                      setSelectedAthlete(enroll.user_id);
                      document.getElementById('management-core')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 rounded-xl bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 flex items-center justify-center overflow-hidden">
                          <Zap className="text-[var(--accent-green)]" size={20} />
                       </div>
                       <div>
                          <h4 className="text-[var(--text-primary)] font-bold uppercase tracking-wider text-sm">{athletes.find(a => a.id === enroll.user_id)?.first_name} {athletes.find(a => a.id === enroll.user_id)?.last_name}</h4>
                          <p className="text-[var(--accent-green)] text-[9px] font-black uppercase tracking-[2px]">{enroll.program?.title}</p>
                       </div>
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest pt-4 border-t border-[var(--border-primary)]/50">
                       <span>Phase: {enroll.program?.level}</span>
                       <span className="text-[var(--accent-green)] group-hover/card:translate-x-1 transition-transform flex items-center gap-1">Manage <ArrowRight size={10} /></span>
                    </div>
                  </motion.div>
                ))
              )}
           </div>
        </div>


        {/* 4, 5, 6. OPERATIONS GRID (TRAINING SESSION CONTROL, LIVE MONITOR, ALERTS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 items-start">
          <div className="space-y-8 w-full">
            <TrainingSessionControl 
              onViewDetails={(session) => { setActiveSession(session); setIsDetailsOpen(true); }}
              onAdjustLoad={() => setIsAdjustLoadOpen(true)}
              onCreate={() => setIsCreateSessionOpen(true)}
              isSuperAdmin={profile?.role === 'superadmin'}
            />
            <AlertsFlagsWidget onReviewAll={() => setIsAlertsModalOpen(true)} />
          </div>

          <div className="space-y-8 w-full">
            <AdminBookingsPanel />
            <CoachScheduleWidget coach={profile} />
          </div>
        </div>

        {/* 7. TRAINING LOAD MANAGEMENT */}




        {/* 9. BOOKING PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
           {/* Booking panels would go here if needed, adding specific responsive grid spacing */}
        </div>
        {/* STAFF PROTOCOL LOGS */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[24px] p-5 md:p-8 shadow-xl flex flex-col relative z-10">
           <div className="text-[var(--accent-green)] font-display text-sm flex items-center gap-3 mb-6 md:mb-8 uppercase">
              <MessageSquare size={18} /> Notes / Activity Log
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-8">
              <input 
                placeholder="ADD PROTOCOL NOTE..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl py-3 px-5 text-[var(--text-primary)] text-xs font-sans placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-green)]"
              />
              <button 
                onClick={handleAddNote}
                disabled={isSavingNote}
                className="bg-[var(--accent-green)] text-[var(--text-on-green)] font-button text-xs px-6 py-3 rounded-xl hover:bg-[var(--accent-green-dim)] transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-wait min-w-[100px] flex items-center justify-center active-scale"
              >
                {isSavingNote ? <Loader2 className="animate-spin" size={16} /> : "COMMIT"}
              </button>
           </div>

           <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {staffNotes.filter(n => {
                const athlete = athletes.find(a => a.id === n.user_id);
                const athleteSearch = athlete ? `${athlete.first_name} ${athlete.last_name}`.toLowerCase() : "";
                const noteSearch = n.note.toLowerCase();
                const authorSearch = `${n.added_by?.first_name} ${n.added_by?.last_name}`.toLowerCase();
                const query = searchQuery.toLowerCase();
                return athleteSearch.includes(query) || noteSearch.includes(query) || authorSearch.includes(query);
              }).length === 0 ? (
                <div className="py-12 text-center text-[var(--text-secondary)] font-label italic border border-dashed border-[var(--border-primary)] rounded-2xl">
                  {searchQuery ? "NO SEARCH RESULTS FOUND" : "PROTOCOL LOG CLEAR // NO RECENT NOTES"}
                </div>
              ) : (
                staffNotes.filter(n => {
                  const athlete = athletes.find(a => a.id === n.user_id);
                  const athleteSearch = athlete ? `${athlete.first_name} ${athlete.last_name}`.toLowerCase() : "";
                  const noteSearch = n.note.toLowerCase();
                  const authorSearch = `${n.added_by?.first_name} ${n.added_by?.last_name}`.toLowerCase();
                  const query = searchQuery.toLowerCase();
                  return athleteSearch.includes(query) || noteSearch.includes(query) || authorSearch.includes(query);
                }).map((note, i) => (
                  <div key={i} className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] border-l-4 border-l-[var(--accent-green)] rounded-xl relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-label text-[var(--accent-green)]">
                        {note.user_id ? "Athlete Record" : "General Protocol"}
                      </div>
                      <span className="text-[var(--text-muted)] font-label">{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[var(--text-primary)] text-xs leading-relaxed italic font-sans">"{note.note}"</p>
                    <div className="flex justify-between items-center mt-3">
                       <span className="text-[var(--accent-green)] font-label opacity-70">
                         {note.added_by?.first_name} {note.added_by?.last_name}
                       </span>
                       {note.user_id && (
                         <span className="text-[var(--text-muted)] font-label">
                           Subj: {athletes.find(a => a.id === note.user_id)?.last_name || "Agent"}
                         </span>
                       )}
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* FOOTER SECTION: WELLNESS */}
        <div className="pb-10 relative z-10 w-full lg:w-3/5">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[24px] p-5 md:p-8 shadow-xl">
             <div className="flex justify-between items-center mb-8">
                <div className="text-[var(--accent-green)] font-display text-sm flex items-center gap-3">
                   <Activity size={18} /> ATHLETE WELLNESS
                </div>
                 <div className="text-[var(--accent-green)] font-stat text-xl">
                   {logsExist ? `${wellnessStats.readyPercent}% OPS READY` : <span className="font-display text-[var(--text-muted)] font-black tracking-[0.2em] italic">NO DATA RECEIVED</span>}
                 </div>
             </div>
             <ProgressBar value={wellnessStats.readyPercent} height={8} />
             {!logsExist && (
               <div className="mt-6 p-4 bg-[var(--accent-green)]/5 border border-[var(--accent-green)]/20 rounded-2xl text-[var(--accent-green)] text-xs font-sans tracking-wide">
                  Tip: Create a session to start tracking your athletes' performance.
               </div>
             )}
             <div className="mt-8 space-y-4">
                {[
                  { label: 'SLEEP ANOMALIES', count: wellnessStats.sleepAnomalies, icon: '😴', color: '#f59e0b' },
                  { label: 'EXTREME SORENESS', count: wellnessStats.extremeSoreness, icon: '🩹', color: '#ef4444' },
                  { label: 'HYDRATION ISSUES', count: wellnessStats.hydrationFlags, icon: '💧', color: '#8b5cf6' },
                ].map((issue, i) => (
                   <div key={i} className="flex justify-between items-center bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-primary)] group">
                     <div className="flex items-center gap-3 text-[var(--text-secondary)] font-label font-bold group-hover:text-[var(--text-primary)] transition-colors">
                       <span className="text-lg">{issue.icon}</span> {issue.label}
                     </div>
                     <div className="px-3 py-1 bg-[var(--bg-primary)] font-stat rounded-full" style={{ color: issue.color }}>
                       {logsExist ? `${issue.count} SUBJECTS` : <span className="text-[10px] opacity-40">---</span>}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Management Modals */}
      <TrainingPlanModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)} 
        athleteId={selectedAthlete} 
        athleteName={(() => {
          const a = athletes.find(x => x.id === selectedAthlete);
          return a ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : "";
        })()}
      />
      <ProgramAssignModal
        isOpen={isAssignProgramModalOpen}
        onClose={() => setIsAssignProgramModalOpen(false)}
        athleteId={selectedAthlete}
        athleteName={(() => {
          const a = athletes.find(x => x.id === selectedAthlete);
          return a ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : "";
        })()}
        onSuccess={fetchAdminData}
      />
      <InjuryLogModal 
        isOpen={isInjuryModalOpen} 
        onClose={() => setIsInjuryModalOpen(false)} 
        athleteId={selectedAthlete} 
        athleteName={(() => {
          const a = athletes.find(x => x.id === selectedAthlete);
          return a ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : "";
        })()}
        onSuccess={fetchAdminData}
      />
      <SurveyAssignModal 
        isOpen={isSurveyModalOpen} 
        onClose={() => setIsSurveyModalOpen(false)} 
        athleteId={selectedAthlete} 
        athleteName={(() => {
          const a = athletes.find(x => x.id === selectedAthlete);
          return a ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : "";
        })()}
      />
      <VideoFeedbackModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
        athleteId={selectedAthlete} 
        athleteName={(() => {
          const a = athletes.find(x => x.id === selectedAthlete);
          return a ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : "";
        })()}
      />
      <TrainingLoadExpandedModal 
        isOpen={isLoadModalOpen} 
        onClose={() => setIsLoadModalOpen(false)} 
        athletes={athletes} 
      />
      <ReviewAlertsModal 
        isOpen={isAlertsModalOpen} 
        onClose={() => setIsAlertsModalOpen(false)} 
      />
      <AthleteAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        athleteId={selectedAthlete}
        athleteName={(() => {
          const a = athletes.find(x => x.id === selectedAthlete);
          return a ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : "";
        })()}
      />

      <ManageScheduleModal 
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        program={selectedProgram}
      />

      {/* Program Detail Modal */}
      <AnimatePresence>
        {isProgramModalOpen && selectedProgram && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-24">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProgramModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none font-display text-9xl">OP</div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                       <Zap className="text-[var(--accent-green)]" size={14} />
                       <span className="text-[10px] font-black text-[var(--accent-green)] uppercase tracking-[3px]">Architecture Specification</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-display font-black text-[var(--text-primary)] uppercase tracking-tight">{selectedProgram.title}</h3>
                  </div>
                  <button 
                    onClick={() => setIsProgramModalOpen(false)}
                    className="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-active)] transition-all"
                  >
                    <ArrowRight className="rotate-45" size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <div className="space-y-4">
                         <h5 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Protocol Description</h5>
                         <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-sans italic">
                            "{selectedProgram.description}"
                         </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <h5 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Target Phase</h5>
                            <div className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[11px] font-bold text-[var(--text-primary)] uppercase">{selectedProgram.level}</div>
                         </div>
                         <div className="space-y-2">
                            <h5 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Operational Category</h5>
                            <div className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[11px] font-bold text-[var(--accent-green)] uppercase">{selectedProgram.category}</div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 space-y-6">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Timeline</span>
                            <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase">{selectedProgram.duration}</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Enrolment Cap</span>
                            <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase">{selectedProgram.max_athletes} Agents</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Valuation</span>
                            <span className="text-[10px] font-bold text-[var(--accent-green)] uppercase">${selectedProgram.price} USD</span>
                         </div>
                      </div>

                      <div className="pt-4">
                         <button 
                           onClick={() => {
                             setIsProgramModalOpen(false);
                             document.getElementById('protocol-assignments')?.scrollIntoView({ behavior: 'smooth' });
                           }}
                           className="w-full bg-[var(--accent-green)] text-[var(--text-on-green)] py-4 rounded-xl font-black text-[11px] uppercase tracking-[2px] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-all shadow-[0_0_20px_var(--shadow-accent-glow)] flex items-center justify-center gap-3"
                         >
                           Manage Assigned Units <ArrowRight size={14} />
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateSessionModal 
        isOpen={isCreateSessionOpen}
        onClose={() => setIsCreateSessionOpen(false)}
        onSuccess={() => {
          setIsCreateSessionOpen(false);
          fetchAdminData();
        }}
        athletes={athletes}
      />
      <SessionDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        session={activeSession}
      />
      <AdjustLoadModal 
        isOpen={isAdjustLoadOpen}
        onClose={() => setIsAdjustLoadOpen(false)}
        sessions={[]} 
        athletes={athletes}
      />
    </div>
  );
}
