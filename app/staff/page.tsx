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
  BarChart3
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



export default function StaffPortal() {
  const { user, profile, loading: authLoading, signOut, supabase } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [staffNotes, setStaffNotes] = useState<any[]>([]);
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
        } else if (profile?.role !== 'staff' && profile?.role !== 'superadmin') {
            router.push("/dashboard");
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
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6">
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

  const teamStats = {
    total: athletes.length,
    pending: athletes.filter(a => a.status === 'pending').length,
    active: athletes.filter(a => a.status === 'active' || a.status === 'approved').length,
    trainingToday: todaySessions.length,
    highFatigue: athletes.filter(a => a.training_status === 'monitor').length,
    injuryAlerts: alerts.length
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              placeholder="SEARCH SQUAD DATA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-[#22c55e]/20 rounded-xl py-3 md:py-4 pl-12 pr-4 text-white text-xs md:text-sm font-label focus:outline-none focus:border-[#22c55e] transition-all placeholder:text-gray-600 shadow-2xl"
            />
          </div>
        </div>

        {/* ========================
            INDIVIDUAL MANAGEMENT SECTION
            ======================== */}
        {/* 1. TEAM OVERVIEW CARDS */}
        <SwipeableCards cards={[
          { label: 'ASSIGNED SQUAD', value: teamStats.total, icon: '👥', color: '#22c55e' },
          { label: 'PENDING TASKS', value: teamStats.pending, icon: '🔐', color: '#f59e0b' },
          { label: 'ACTIVE UNIT', value: teamStats.active, icon: '✅', color: '#22c55e' },
        ]} />

        {/* 2. STAFF PROTOCOL LOGS (MOVED FOR VISIBILITY) */}
        <div className="bg-[#111] border border-[#22c55e]/10 rounded-[24px] p-5 md:p-8 shadow-xl flex flex-col relative z-10">
           <div className="text-[#22c55e] font-display text-sm flex items-center gap-3 mb-6 md:mb-8 uppercase">
              <MessageSquare size={18} /> Protocol Logs
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-8">
              <input 
                placeholder="ADD PROTOCOL NOTE..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 bg-black/40 border border-[#22c55e]/20 rounded-xl py-3 px-5 text-white text-xs font-sans placeholder:text-gray-600 focus:outline-none focus:border-[#22c55e]"
              />
              <button 
                onClick={handleAddNote}
                disabled={isSavingNote}
                className="bg-[#22c55e] text-black font-button text-xs px-6 py-3 rounded-xl hover:bg-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-wait min-w-[100px] flex items-center justify-center active-scale"
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
                <div className="py-12 text-center text-gray-500 font-label italic border border-dashed border-white/5 rounded-2xl">
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
                  <div key={i} className="p-4 bg-white/5 border-l-4 border-l-[#22c55e] rounded-xl relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-label text-[#22c55e]">
                        {note.user_id ? "Athlete Record" : "General Protocol"}
                      </div>
                      <span className="text-gray-500 font-label">{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-200 text-xs leading-relaxed italic font-sans">"{note.note}"</p>
                    <div className="flex justify-between items-center mt-3">
                       <span className="text-[#22c55e] font-label opacity-70">
                         {note.added_by?.first_name} {note.added_by?.last_name}
                       </span>
                       {note.user_id && (
                         <span className="text-gray-500 font-label">
                           Subj: {athletes.find(a => a.id === note.user_id)?.last_name || "Agent"}
                         </span>
                       )}
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* 3. ATHLETE LIST (HIGHER-FIDELITY ATHLETE ROSTER) */}
        <AthleteRoster 
          onSelectAthlete={(id) => { setSelectedAthlete(id); setIsPlanModalOpen(true); }}
          onLogSession={(id) => { setSelectedAthlete(id); setIsLoadModalOpen(true); }}
          onLogInjury={(id) => { setSelectedAthlete(id); setIsInjuryModalOpen(true); }}
          onViewAnalytics={(id) => { setSelectedAthlete(id); setIsVideoModalOpen(true); }}
          onAssess={(id) => { setSelectedAthlete(id); setIsAssessmentModalOpen(true); }}
          externalSearchQuery={searchQuery}
        />

        {/* 4, 5, 6. OPERATIONS GRID (TRAINING SESSION CONTROL, LIVE MONITOR, ALERTS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          <TrainingSessionControl 
            onViewDetails={(session) => { setActiveSession(session); setIsDetailsOpen(true); }}
            onAdjustLoad={() => setIsAdjustLoadOpen(true)}
            onCreate={() => setIsCreateSessionOpen(true)}
            isSuperAdmin={profile?.role === 'superadmin'}
          />

          <div className="space-y-8">
            <AdminBookingsPanel />
            <LiveTrainingMonitor />
            <AlertsFlagsWidget onReviewAll={() => setIsAlertsModalOpen(true)} />
          </div>
        </div>

        {/* 7. TRAINING LOAD MANAGEMENT */}
        <TrainingLoadWidget onExpand={() => setIsLoadModalOpen(true)} />

        {/* 8. INDIVIDUAL ATHLETE MANAGEMENT (SQUAD MANAGEMENT CORE) */}
        <div className="bg-[#111] border border-[#22c55e]/10 rounded-[16px] md:rounded-[24px] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-5 font-display text-9xl pointer-events-none group-hover:opacity-10 transition-opacity hidden md:block uppercase">COACH</div>
           
           <div className="relative z-10 max-w-2xl">
               <div className="text-[#22c55e] font-display text-xl md:text-2xl font-black mb-6 flex items-center gap-3 tracking-widest uppercase truncate">
                  <Target size={24} /> SQUAD MANAGEMENT
               </div>

              <div className="space-y-8">
                <div className="space-y-3">
                    <label className="text-gray-400 font-label ml-1">ATHLETE IDENTIFICATION</label>
                   <div className="relative">
                     <select
                      value={selectedAthlete}
                      onChange={(e) => setSelectedAthlete(e.target.value)}
                      className="w-full bg-black/60 border-2 border-white/10 group-hover:border-[#22c55e]/40 rounded-2xl py-5 px-8 text-white text-base font-display focus:outline-none focus:border-[#22c55e] transition-all cursor-pointer appearance-none shadow-xl"
                     >
                      <option value="">SELECT PLAYER...</option>
                      {athletes.filter(a => 
                        `${a.first_name} ${a.last_name} ${a.username}`.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(a => (
                        <option key={a.id} value={a.id} className="bg-[#111]">{a.first_name} {a.last_name} [{a.sport?.toUpperCase()}]</option>
                      ))}
                     </select>
                   </div>
                </div>
 
                 <AnimatePresence>
                   {selectedAthlete && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.98 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.98 }}
                       className="grid grid-cols-2 lg:grid-cols-5 gap-4 pt-6"
                     >

                      {[
                        { label: 'PLAN', icon: <Clipboard size={22} />, action: () => setIsPlanModalOpen(true) },
                        { label: 'INJURY', icon: <ShieldAlert size={22} />, action: () => setIsInjuryModalOpen(true) },
                        { label: 'SURVEY', icon: <Activity size={22} />, action: () => setIsSurveyModalOpen(true) },
                        { label: 'UPLOAD', icon: <Plus size={22} />, action: () => setIsVideoModalOpen(true) },
                        { label: 'ASSESS', icon: <BarChart3 size={22} />, action: () => setIsAssessmentModalOpen(true) },
                      ].map((btn, i) => (
                        <button 
                          key={i} 
                          onClick={btn.action}
                          className="flex flex-col items-center gap-3 bg-white/[0.03] border border-white/10 p-5 rounded-[20px] hover:bg-[#22c55e]/15 hover:border-[#22c55e]/50 hover:shadow-[0_10px_30px_rgba(34,197,94,0.15)] transition-all text-[#22c55e] group/btn shadow-lg active-scale"
                        >
                           <div className="w-10 h-10 rounded-xl bg-white/5 group-hover/btn:bg-[#22c55e]/20 flex items-center justify-center transition-colors">{btn.icon}</div>
                           <span className="font-label text-gray-400 text-[10px] font-bold group-hover/btn:text-white transition-colors uppercase tracking-widest">{btn.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
           </div>
        </div>

        {/* 9. BOOKING PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
           {/* Booking panels would go here if needed, adding specific responsive grid spacing */}
        </div>

        {/* FOOTER SECTION: WELLNESS */}
        <div className="pb-10 relative z-10 w-full lg:w-3/5">
          <div className="bg-[#22c55e]/[0.02] border border-[#22c55e]/10 rounded-[24px] p-5 md:p-8 shadow-xl">
             <div className="flex justify-between items-center mb-8">
                <div className="text-[#22c55e] font-display text-sm flex items-center gap-3">
                   <Activity size={18} /> SQUAD WELLNESS STATUS
                </div>
                 <div className="text-[#22c55e] font-stat text-xl">
                   {logsExist ? `${wellnessStats.readyPercent}% OPS READY` : <span className="font-display text-white/40 font-black tracking-[0.2em] italic">NO DATA RECEIVED</span>}
                 </div>
             </div>
             <ProgressBar value={wellnessStats.readyPercent} height={8} />
             <div className="mt-8 space-y-4">
                {[
                  { label: 'SLEEP ANOMALIES', count: wellnessStats.sleepAnomalies, icon: '😴', color: '#f59e0b' },
                  { label: 'EXTREME SORENESS', count: wellnessStats.extremeSoreness, icon: '🩹', color: '#ef4444' },
                  { label: 'HYDRATION ISSUES', count: wellnessStats.hydrationFlags, icon: '💧', color: '#8b5cf6' },
                ].map((issue, i) => (
                   <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 group">
                     <div className="flex items-center gap-3 text-gray-400 font-label font-bold group-hover:text-white transition-colors">
                       <span className="text-lg">{issue.icon}</span> {issue.label}
                     </div>
                     <div className="px-3 py-1 bg-black/40 font-stat rounded-full" style={{ color: issue.color }}>
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
        athleteName={athletes.find(a => a.id === selectedAthlete)?.first_name + " " + (athletes.find(a => a.id === selectedAthlete)?.last_name || "")}
      />
      <InjuryLogModal 
        isOpen={isInjuryModalOpen} 
        onClose={() => setIsInjuryModalOpen(false)} 
        athleteId={selectedAthlete} 
        athleteName={athletes.find(a => a.id === selectedAthlete)?.first_name + " " + (athletes.find(a => a.id === selectedAthlete)?.last_name || "")}
        onSuccess={fetchAdminData}
      />
      <SurveyAssignModal 
        isOpen={isSurveyModalOpen} 
        onClose={() => setIsSurveyModalOpen(false)} 
        athleteId={selectedAthlete} 
        athleteName={athletes.find(a => a.id === selectedAthlete)?.first_name + " " + (athletes.find(a => a.id === selectedAthlete)?.last_name || "")}
      />
      <VideoFeedbackModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
        athleteId={selectedAthlete} 
        athleteName={athletes.find(a => a.id === selectedAthlete)?.first_name + " " + (athletes.find(a => a.id === selectedAthlete)?.last_name || "")}
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
        athleteName={athletes.find(a => a.id === selectedAthlete)?.first_name + " " + (athletes.find(a => a.id === selectedAthlete)?.last_name || "")}
      />

      <CreateSessionModal 
        isOpen={isCreateSessionOpen}
        onClose={() => setIsCreateSessionOpen(false)}
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
