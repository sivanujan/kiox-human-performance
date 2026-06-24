"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
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
  Camera,
  Send,
  Check
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { SkeletonStatCard } from "@/components/ui/Skeleton";

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
import ProgramAssignModal from "@/components/modals/ProgramAssignModal";

// Admin UI Components
import TrainingLoadWidget from "@/components/admin/TrainingLoadWidget";
import AlertsFlagsWidget from "@/components/admin/AlertsFlagsWidget";
import LiveTrainingMonitor from "@/components/admin/LiveTrainingMonitor";
import TrainingSessionControl from "@/components/admin/TrainingSessionControl";
import AthleteRoster from "@/components/admin/AthleteRoster";
import AdminBookingsPanel from "@/components/admin/AdminBookingsPanel";

// Operational Modals
import CreateSessionModal from "@/components/modals/CreateSessionModal";
import SessionDetailsModal from "@/components/modals/SessionDetailsModal";
import AdjustLoadModal from "@/components/modals/AdjustLoadModal";



export default function AdminDashboard() {
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
  const [newNote, setNewNote] = useState("");
  const [noteFilter, setNoteFilter] = useState<'ALL' | 'GENERAL' | 'ALERT' | 'INFO'>('ALL');
  const [noteType, setNoteType] = useState<string>('GENERAL');

  const parseNote = (rawNote: any) => {
    let type = "GENERAL PROTOCOL";
    let content = typeof rawNote === 'string' ? rawNote : "";
    if (content.startsWith("[ALERT]")) {
      type = "ALERT";
      content = content.substring("[ALERT]".length).trim();
    } else if (content.startsWith("[INFO]")) {
      type = "INFO";
      content = content.substring("[INFO]".length).trim();
    } else if (content.startsWith("[GENERAL PROTOCOL]")) {
      type = "GENERAL PROTOCOL";
      content = content.substring("[GENERAL PROTOCOL]".length).trim();
    } else if (content.startsWith("[GENERAL]")) {
      type = "GENERAL PROTOCOL";
      content = content.substring("[GENERAL]".length).trim();
    }
    return { type, content };
  };

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
  const [isAssignProgramModalOpen, setIsAssignProgramModalOpen] = useState(false);
  
  // Operational State
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAdjustLoadOpen, setIsAdjustLoadOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);

  const router = useRouter();
  const pathname = usePathname();

  const fetchingRef = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
    
    // Reset fetch guard on every mount/navigation so data always loads fresh
    fetchingRef.current = false;

    if (!authLoading) {
      if (!user) {
        router.push("/signin");
      } else if (profile?.role !== 'superadmin' && profile?.role !== 'staff') {
        router.push("/dashboard");
      } else {
        fetchAdminData();
      }
    }
  // pathname ensures this re-runs when navigating back to this page
  }, [user?.id, profile?.role, authLoading, pathname]);

  // Also re-fetch when tab becomes visible again (e.g. switching browser tabs)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user && !authLoading) {
        fetchAdminData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user?.id, authLoading]);

  const fetchAdminData = async () => {
    // Only show full loader if we have no athletes yet
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
          .order('start_time', { ascending: true })
      ]);

      const getJsonSafe = async (res: Response) => {
        try {
          if (!res.ok) {
            console.error(`Fetch failed for ${res.url} with status ${res.status}`);
            return { error: `HTTP ${res.status}` };
          }
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await res.json();
          }
          console.error(`Fetch returned non-JSON for ${res.url}`);
          return { error: "Non-JSON response" };
        } catch (e) {
          console.error(`Error parsing JSON for ${res.url}:`, e);
          return { error: "JSON parse error" };
        }
      };

      const [athData, alrtData, noteData, wellData] = await Promise.all([
        getJsonSafe(athRes),
        getJsonSafe(alrtRes),
        getJsonSafe(noteRes),
        getJsonSafe(wellRes)
      ]);

      if (athData && !athData.error) setAthletes(athData);
      if (alrtData && !alrtData.error) setAlerts(alrtData);
      if (noteData && !noteData.error) setStaffNotes(noteData);

      if (!wellData.error) {
        const logsExist = wellData.completion_count > 0;
        const sleepWeight = wellData.avg_sleep || 0;
        const sorenessWeight = 10 - (wellData.avg_soreness || 0);
        const readyPercent = logsExist ? Math.round(((sleepWeight + sorenessWeight) / 20) * 100) : 0;
        
        setWellnessStats({
          readyPercent: readyPercent || 0,
          completionCount: wellData.completion_count || 0,
          sleepAnomalies: wellData.low_sleep_count || 0,
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
    } catch (error) {
      console.error("Admin Matrix Sync Error:", error);
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
      const typePrefix = noteType === 'GENERAL' ? '[GENERAL PROTOCOL]' : `[${noteType}]`;
      const prefixedNote = `${typePrefix} ${newNote.trim()}`;
      
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedAthlete || null, 
          note: prefixedNote 
        })
      });
      if (res.ok) {
        setNewNote("");
        setSearchQuery(""); // Clear search to see result
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

  if (!isHydrated || authLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-[#22c55e]/10 animate-ping absolute inset-0" />
          <div className="w-20 h-20 rounded-full border-t-2 border-[#22c55e] animate-spin" />
        </div>
        <div className="font-label text-[#22c55e] animate-pulse">
          Syncing Operational Matrix...
        </div>
      </div>
    );
  }

  // Data is loading but auth is done — render skeleton layout so the page doesn't blank
  if (loading && athletes.length === 0) {
    return (
      <div className="pt-6 md:pt-10 pb-20 px-4 md:px-10 max-w-7xl mx-auto space-y-6 md:space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <SkeletonStatCard key={i} />)}
        </div>
      </div>
    );
  }

  const teamStats = {
    total: athletes.length,
    pending: athletes.filter(a => a.status === 'pending').length,
    active: athletes.filter(a => a.status === 'active' || a.status === 'approved').length,
    trainingToday: todaySessions.length };

  return (
    <div className="pt-6 md:pt-10 pb-20 px-4 md:px-10 max-w-7xl mx-auto space-y-6 md:space-y-10 relative">
      {/* Animated Top Progress Bar */}
      <motion.div
        initial={{ width: "0%", opacity: 1 }}
        animate={{ width: "100%", opacity: [1, 1, 1, 0] }}
        transition={{ 
          width: { duration: 1.2, ease: "easeOut" },
          opacity: { duration: 1.8, times: [0, 0.6, 0.8, 1], ease: "linear" }
        }}
        className="fixed top-0 left-0 h-1 bg-[#00ff88] z-[9999] shadow-[0_0_12px_#00ff88] pointer-events-none"
      />

      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      
      {/* ========================
          ADMIN HEADER
          ======================== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[var(--accent-green)]/10 border-2 border-[var(--accent-green)] shadow-[0_0_20px_var(--shadow-accent)] flex items-center justify-center text-xl md:text-2xl font-display text-[var(--accent-green)]">
            {profile?.first_name ? profile.first_name[0].toUpperCase() : 'A'}
          </div>
          <div>
            <div className="text-[var(--accent-green)] font-label font-bold mb-0.5 md:mb-1 text-[10px] md:text-xs">
              Operations Control // Admin Oversight
            </div>
            <div className="text-[var(--text-primary)] font-display text-2xl md:text-4xl font-black tracking-tight leading-none uppercase">
              {profile?.role === 'superadmin' ? 'SYSTEM ADMIN' : 'CHIEF'} {profile?.last_name?.toUpperCase() || 'OFFICER'}
            </div>
            <div className="text-[var(--text-muted)] font-label mt-1 text-[9px] md:text-xs">
              KIO-X COMMAND CORE
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input
            placeholder="Search athletes or logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl py-3 md:py-4 pl-12 pr-4 text-[var(--text-primary)] text-xs md:text-sm font-label focus:outline-none focus:border-[var(--accent-green)] transition-all placeholder:text-[var(--text-muted)] shadow-2xl"
          />
        </div>
      </div>

      {/* ========================
          DASHBOARD MAIN STACK
          ======================== */}
      <div className="flex flex-col gap-10">
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
        <div className="space-y-6">
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative z-10">
            {[
              { label: 'My Athletes', value: teamStats.total, icon: <UsersIcon className="w-5 h-5 text-[var(--accent-green)]" /> },
              { label: 'PENDING CLEARANCE', value: teamStats.pending, icon: <ShieldAlert className="w-5 h-5 text-[var(--text-primary)]" /> },
              { label: 'Active Athletes', value: teamStats.active, icon: <Activity className="w-5 h-5 text-[var(--accent-green)]" /> },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[24px] p-6 flex items-center justify-between group cursor-default transition-all relative overflow-hidden h-[120px] hover:border-b-2 hover:border-b-[var(--accent-green)]"
              >
                <div>
                  <span className="text-[var(--text-secondary)] font-mono text-[10px] tracking-[0.2em] uppercase font-bold block mb-1">
                    {card.label}
                  </span>
                  <span className="text-4xl font-display font-black text-[var(--accent-green)] tracking-tight">
                    {card.value}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] flex items-center justify-center border border-[var(--border-primary)] group-hover:bg-[var(--accent-green)]/10 transition-colors">
                  {card.icon}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 3. ATHLETE LIST */}
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



        {/* 4, 5, 6. OPERATIONS GRID */}
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
            <LiveTrainingMonitor />
          </div>
        </div>

        <TrainingLoadWidget onExpand={() => setIsLoadModalOpen(true)} />

        {/* Global Registry Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 pt-4">
          <Link 
            href="/admin/users"
            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[20px] md:rounded-[28px] p-6 md:p-8 flex items-center justify-between hover:border-[var(--accent-green)]/40 hover:bg-[var(--bg-card-hover)] transition-all group shadow-xl active-scale"
          >
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 flex items-center justify-center text-[var(--accent-green)] group-hover:scale-110 transition-transform flex-shrink-0">
                <UsersIcon className="w-6 h-6 md:w-7 md:h-7" />
              </div>
               <div>
                 <div className="text-[var(--accent-green)] font-label font-bold mb-0.5 md:mb-1 text-[10px]">Squad Database</div>
                 <div className="font-display text-lg md:text-2xl text-[var(--text-primary)] font-black tracking-wide uppercase">Registry</div>
                 <div className="text-[var(--text-secondary)] font-label mt-0.5 text-[9px] hidden xs:block">Invite Staff // Verify Athletes</div>
               </div>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[var(--accent-green)] group-hover:text-[var(--text-on-green)] transition-all flex-shrink-0">
              <ArrowRight size={18} />
            </div>
          </Link>

          <Link 
            href="/gallery"
            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[20px] md:rounded-[28px] p-6 md:p-8 flex items-center justify-between hover:border-[var(--accent-green)]/40 hover:bg-[var(--bg-card-hover)] transition-all group shadow-xl active-scale"
          >
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 flex items-center justify-center text-[var(--accent-green)] group-hover:scale-110 transition-transform flex-shrink-0">
                <Camera className="w-6 h-6 md:w-7 md:h-7" />
              </div>
               <div>
                 <div className="text-[var(--accent-green)] font-label font-bold mb-0.5 md:mb-1 text-[10px]">Asset Control</div>
                 <div className="font-display text-lg md:text-2xl text-[var(--text-primary)] font-black tracking-wide uppercase">Media Archive</div>
                 <div className="text-[var(--text-secondary)] font-label mt-0.5 text-[9px] hidden xs:block">Manage Tactical Videos // Gallery</div>
               </div>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[var(--accent-green)] group-hover:text-[var(--text-on-green)] transition-all flex-shrink-0">
              <ArrowRight size={18} />
            </div>
          </Link>
        </div>

        {/* STAFF PROTOCOL LOGS */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[24px] p-5 md:p-8 shadow-xl flex flex-col relative z-10">
          <div className="text-[var(--accent-green)] font-display text-sm flex items-center gap-3 mb-6 md:mb-8">
             <MessageSquare size={18} /> Notes / Activity Log
          </div>

          {/* Note Type & Input row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
             <select
               value={noteType}
               onChange={(e) => setNoteType(e.target.value)}
               className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl py-3 px-4 text-[var(--text-primary)] text-xs font-mono focus:outline-none focus:border-[var(--accent-green)] cursor-pointer"
             >
               <option value="GENERAL">GENERAL</option>
               <option value="ALERT">ALERT</option>
               <option value="INFO">INFO</option>
             </select>

             <input 
               placeholder="ADD STAFF PROTOCOL NOTE..."
               value={newNote}
               onChange={(e) => setNewNote(e.target.value)}
               className="flex-1 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl py-3 px-5 text-[var(--text-primary)] text-xs font-sans placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-green)]"
             />
             <button 
               onClick={handleAddNote}
               disabled={isSavingNote}
               className="bg-[var(--accent-green)] text-[var(--text-on-green)] font-button text-xs px-6 py-3 rounded-xl hover:bg-[var(--accent-green-dim)] transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-wait min-w-[120px] flex items-center justify-center gap-2 active-scale"
             >
               {isSavingNote ? (
                 <Loader2 className="animate-spin" size={16} />
               ) : (
                 <>
                   <span>COMMIT</span>
                   <Send size={12} className="text-[var(--text-on-green)]" />
                 </>
               )}
             </button>
          </div>

          {/* Note Filters */}
          <div className="flex items-center gap-2 mb-6 border-b border-[var(--border-primary)]/50 pb-4">
            {(['ALL', 'GENERAL', 'ALERT', 'INFO'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setNoteFilter(cat)}
                className={`px-4 py-1.5 rounded-full border font-mono text-[9px] tracking-widest uppercase transition-all ${
                  noteFilter === cat
                    ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-[var(--text-on-green)] font-black shadow-[0_0_15px_var(--shadow-accent)]"
                    : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Notes List */}
          <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
             {staffNotes.filter(n => {
               const parsed = parseNote(n.note);
               if (noteFilter !== 'ALL') {
                 if (noteFilter === 'GENERAL' && parsed.type !== 'GENERAL PROTOCOL') return false;
                 if (noteFilter === 'ALERT' && parsed.type !== 'ALERT') return false;
                 if (noteFilter === 'INFO' && parsed.type !== 'INFO') return false;
               }
               
               const athlete = athletes.find(a => a.id === n.user_id);
               const athleteSearch = athlete ? `${athlete.first_name} ${athlete.last_name}`.toLowerCase() : "";
               const noteSearch = n.note.toLowerCase();
               const authorSearch = `${n.added_by?.first_name} ${n.added_by?.last_name}`.toLowerCase();
               const query = searchQuery.toLowerCase();
               return athleteSearch.includes(query) || noteSearch.includes(query) || authorSearch.includes(query);
             }).length === 0 ? (
               <div className="py-12 text-center text-gray-700 uppercase font-black text-[10px] tracking-widest">
                 {searchQuery ? "NO SEARCH RESULTS FOUND" : "PROTOCOL LOG CLEAR // NO RECENT NOTES"}
               </div>
             ) : (
               staffNotes.filter(n => {
                 const parsed = parseNote(n.note);
                 if (noteFilter !== 'ALL') {
                   if (noteFilter === 'GENERAL' && parsed.type !== 'GENERAL PROTOCOL') return false;
                   if (noteFilter === 'ALERT' && parsed.type !== 'ALERT') return false;
                   if (noteFilter === 'INFO' && parsed.type !== 'INFO') return false;
                 }

                 const athlete = athletes.find(a => a.id === n.user_id);
                 const athleteSearch = athlete ? `${athlete.first_name} ${athlete.last_name}`.toLowerCase() : "";
                 const noteSearch = n.note.toLowerCase();
                 const authorSearch = `${n.added_by?.first_name} ${n.added_by?.last_name}`.toLowerCase();
                 const query = searchQuery.toLowerCase();
                 return athleteSearch.includes(query) || noteSearch.includes(query) || authorSearch.includes(query);
               }).map((note, i) => {
                 const parsed = parseNote(note.note);
                 const noteTypeLabel = parsed.type;
                 const noteContent = parsed.content;
                 const noteDate = note.created_at ? new Date(note.created_at).toLocaleDateString() : new Date().toLocaleDateString();

                 const getCategoryConfig = (type: string) => {
                    switch (type) {
                      case 'ALERT': return { borderClass: 'border-l-[#ef4444]', textClass: 'text-red-400' };
                      case 'INFO': return { borderClass: 'border-l-[#3b82f6]', textClass: 'text-blue-400' };
                      default: return { borderClass: 'border-l-[#00ff88]', textClass: 'text-[#00ff88]' };
                    }
                 };

                 const config = getCategoryConfig(noteTypeLabel);

                 return (
                   <div key={i} className={`p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] border-l-4 ${config.borderClass} rounded-xl relative group flex gap-4 items-start`}>
                     {/* Small Author Initial Badge */}
                     <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center text-[10px] font-bold text-[var(--accent-green)] uppercase flex-shrink-0">
                       {((note.added_by?.first_name?.[0] || '') + (note.added_by?.last_name?.[0] || '')).toUpperCase() || 'U'}
                     </div>

                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1.5">
                         <div className={`font-mono text-[9px] tracking-widest uppercase font-black ${config.textClass}`}>
                           {noteTypeLabel}
                         </div>
                         <span className="text-[var(--text-muted)] font-mono text-[9px]">{noteDate}</span>
                       </div>
                       
                       <p className="text-[var(--text-primary)] text-xs leading-relaxed italic font-sans font-medium">"{noteContent}"</p>
                       
                       <div className="flex justify-between items-center mt-3">
                          <span className="text-[var(--accent-green)] font-label font-bold text-[10px]">
                            BY: {note.added_by?.first_name} {note.added_by?.last_name}
                          </span>
                          {note.user_id && (
                            <span className="text-[var(--text-muted)] font-label text-[10px]">
                              Subj: {athletes.find(a => a.id === note.user_id)?.last_name || "Agent"}
                            </span>
                          )}
                       </div>
                     </div>
                   </div>
                 );
               })
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
                   {logsExist ? `${wellnessStats.readyPercent}% OPS READY` : 'NO DATA RECEIVED'}
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
                       {logsExist ? `${issue.count} SUBJECTS` : '---'}
                     </div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TrainingPlanModal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} athleteId={selectedAthlete} athleteName={(() => {
        const a = athletes.find(x => x.id === selectedAthlete);
        return a ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : "";
      })()} />
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
      <InjuryLogModal isOpen={isInjuryModalOpen} onClose={() => setIsInjuryModalOpen(false)} athleteId={selectedAthlete} athleteName={(() => {
        const a = athletes.find(x => x.id === selectedAthlete);
        return a ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : "";
      })()} onSuccess={fetchAdminData} />
      <SurveyAssignModal isOpen={isSurveyModalOpen} onClose={() => setIsSurveyModalOpen(false)} athleteId={selectedAthlete} athleteName={(() => {
        const a = athletes.find(x => x.id === selectedAthlete);
        return a ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : "";
      })()} />
      <VideoFeedbackModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} athleteId={selectedAthlete} athleteName={(() => {
        const a = athletes.find(x => x.id === selectedAthlete);
        return a ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : "";
      })()} />
      <TrainingLoadExpandedModal isOpen={isLoadModalOpen} onClose={() => setIsLoadModalOpen(false)} athletes={athletes} />
      <ReviewAlertsModal isOpen={isAlertsModalOpen} onClose={() => setIsAlertsModalOpen(false)} />
      <CreateSessionModal 
        isOpen={isCreateSessionOpen} 
        onClose={() => setIsCreateSessionOpen(false)} 
        onSuccess={() => {
          setIsCreateSessionOpen(false);
          fetchAdminData();
        }}
        athletes={athletes} 
      />
      <SessionDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} session={activeSession} />
      <AdjustLoadModal isOpen={isAdjustLoadOpen} onClose={() => setIsAdjustLoadOpen(false)} sessions={[]} athletes={athletes} />
      <AthleteAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        athleteId={selectedAthlete}
        athleteName={(() => {
          const a = athletes.find(x => x.id === selectedAthlete);
          return a ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : "";
        })()}
      />
    </div>
  );
}
