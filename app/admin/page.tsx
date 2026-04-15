"use client";

import { useEffect, useState } from "react";
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
  Target
} from "lucide-react";
import { Anton, Orbitron } from "next/font/google";
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

// Admin UI Components
import TrainingLoadWidget from "@/components/admin/TrainingLoadWidget";
import AlertsFlagsWidget from "@/components/admin/AlertsFlagsWidget";
import LiveTrainingMonitor from "@/components/admin/LiveTrainingMonitor";
import TrainingSessionControl from "@/components/admin/TrainingSessionControl";
import AthleteRoster from "@/components/admin/AthleteRoster";

// Operational Modals
import CreateSessionModal from "@/components/modals/CreateSessionModal";
import SessionDetailsModal from "@/components/modals/SessionDetailsModal";
import AdjustLoadModal from "@/components/modals/AdjustLoadModal";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

const orbitron = Orbitron({ subsets: ["latin"] });

export default function AdminDashboard() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [staffNotes, setStaffNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Management Modal States
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isInjuryModalOpen, setIsInjuryModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  
  // Operational State
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAdjustLoadOpen, setIsAdjustLoadOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
    if (!authLoading && user) {
      if (profile?.role === 'superadmin' || profile?.role === 'staff') {
        fetchAdminData();
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, profile, authLoading]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [athRes, alrtRes, noteRes] = await Promise.all([
        fetch('/api/admin/athletes'),
        fetch('/api/admin/alerts'),
        fetch('/api/admin/notes')
      ]);

      const [athData, alrtData, noteData] = await Promise.all([
        athRes.json(),
        alrtRes.json(),
        noteRes.json()
      ]);

      if (!athData.error) setAthletes(athData);
      if (!alrtData.error) setAlerts(alrtData);
      if (!noteData.error) setStaffNotes(noteData);

      // Dummy sessions for design
      setTodaySessions([
        { name: 'Elite Tactical Phase', time: '09:00', type: 'training' },
        { name: 'Recovery Matrix Alpha', time: '14:30', type: 'recovery' },
        { name: 'Strength Evolution', time: '17:00', type: 'gym' }
      ]);
    } catch (error) {
      console.error("Admin Matrix Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote || !selectedAthlete) return;
    
    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedAthlete, note: newNote })
      });
      if (res.ok) {
        setNewNote("");
        fetchAdminData();
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  if (!isHydrated || loading || authLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-[#22c55e]/10 animate-ping absolute inset-0" />
          <div className="w-20 h-20 rounded-full border-t-2 border-[#22c55e] animate-spin" />
        </div>
        <div className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.5em] animate-pulse">
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      
      {/* ========================
          ADMIN HEADER
          ======================== */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Trainer profile */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#22c55e]/30 to-[#22c55e]/10 border-2 border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.2)] flex items-center justify-center text-2xl font-['Anton'] text-[#22c55e]">
            {profile?.first_name ? profile.first_name[0].toUpperCase() : 'C'}
          </div>
          <div>
            <div className="text-[#22c55e] text-[10px] tracking-[0.3em] font-['Anton'] uppercase">
              {profile?.role === 'superadmin' ? 'Performance Admin' : 'Performance Staff'} // Roster Oversight
            </div>
            <div className="text-white font-['Anton'] text-2xl tracking-wider">
              COACH {profile?.last_name?.toUpperCase() || 'OFFICER'}
            </div>
            <div className="text-white/20 text-[11px] uppercase tracking-widest font-bold">
              KIO-X ELITE DIVISION
            </div>
          </div>
        </div>

        {/* Search athletes */}
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input
            placeholder="ACCESS ATHLETE LOGS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] border border-[#22c55e]/20 rounded-xl py-4 pl-12 pr-4 text-white text-xs font-['Anton'] tracking-widest focus:outline-none focus:border-[#22c55e] transition-all placeholder:text-white/10"
          />
        </div>
      </div>

      {/* ========================
          INDIVIDUAL MANAGEMENT SECTION
          ======================== */}
      <div className="bg-[#111] border border-[#22c55e]/10 rounded-[24px] p-10 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-10 opacity-5 font-['Anton'] text-9xl pointer-events-none group-hover:opacity-10 transition-opacity">COMMAND</div>
         
         <div className="relative z-10 max-w-2xl">
            <div className="text-[#22c55e] font-['Anton'] text-sm tracking-[0.2em] uppercase mb-6 flex items-center gap-3">
               <Target size={18} /> INDIVIDUAL ATHLETE MANAGEMENT
            </div>

            <div className="space-y-8">
              {/* Athlete Selector */}
              <div className="space-y-3">
                 <label className="text-white/40 text-[11px] font-black uppercase tracking-[4px] ml-1">TARGET ATHLETE SELECTION</label>
                 <select
                  value={selectedAthlete}
                  onChange={(e) => setSelectedAthlete(e.target.value)}
                  className="w-full bg-black/60 border-2 border-white/10 group-hover:border-[#22c55e]/40 rounded-2xl py-5 px-8 text-white text-base font-['Anton'] uppercase tracking-[3px] focus:outline-none focus:border-[#22c55e] transition-all cursor-pointer appearance-none shadow-xl"
                 >
                  <option value="">SELECT SUBJECT...</option>
                  {athletes.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#111]">{a.first_name} {a.last_name}</option>
                  ))}
                 </select>
              </div>

              {/* Action grid */}
              <AnimatePresence>
                {selectedAthlete && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6"
                  >
                    {[
                      { label: 'PLAN_UPDATE', icon: <Clipboard size={22} />, action: () => setIsPlanModalOpen(true) },
                      { label: 'LOG_INJURY', icon: <ShieldAlert size={22} />, action: () => setIsInjuryModalOpen(true) },
                      { label: 'SURVEY_SEND', icon: <Activity size={22} />, action: () => setIsSurveyModalOpen(true) },
                      { label: 'CLIP_UPLOAD', icon: <Plus size={22} />, action: () => setIsVideoModalOpen(true) },
                    ].map((btn, i) => (
                      <button 
                        key={i} 
                        onClick={btn.action}
                        className="flex flex-col items-center gap-4 bg-white/[0.03] border border-white/10 p-6 rounded-[24px] hover:bg-[#22c55e]/15 hover:border-[#22c55e]/50 hover:shadow-[0_10px_30px_rgba(34,197,94,0.15)] transition-all text-[#22c55e] group/btn shadow-lg"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover/btn:bg-[#22c55e]/20 flex items-center justify-center transition-colors">{btn.icon}</div>
                        <span className="text-[11px] font-['Anton'] tracking-[3px] text-white/70 group-hover/btn:text-white transition-colors">{btn.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
         </div>
      </div>

      <TrainingLoadWidget onExpand={() => setIsLoadModalOpen(true)} />

      {/* ========================
          TACTICAL HEADQUARTERS SHORTCUTS
          ======================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <Link 
          href="/admin/users"
          className="bg-[#111] border border-[#22c55e]/10 rounded-[28px] p-8 flex items-center justify-between hover:border-[#22c55e]/40 hover:bg-[#22c55e]/5 transition-all group shadow-xl"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] group-hover:scale-110 transition-transform">
              <UsersIcon size={28} />
            </div>
            <div>
              <div className="text-[#22c55e] text-[9px] font-black uppercase tracking-[4px] mb-1">Squad Database</div>
              <div className={`${anton.className} text-xl text-white uppercase tracking-widest`}>Global Registry Management</div>
              <div className="text-white/20 text-[10px] uppercase font-bold tracking-[2px] mt-1">Invite Staff // Verify Athletes</div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#22c55e] group-hover:text-black transition-all">
            <ArrowRight size={20} />
          </div>
        </Link>

        <div className="bg-[#111] border border-white/5 rounded-[28px] p-8 flex items-center justify-between opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/10">
              <Plus size={28} />
            </div>
            <div>
              <div className="text-white/20 text-[9px] font-black uppercase tracking-[4px] mb-1">Asset Control</div>
              <div className={`${anton.className} text-xl text-white/40 uppercase tracking-widest`}>Equipment Inventory</div>
              <div className="text-white/10 text-[10px] uppercase font-bold tracking-[2px] mt-1">Coming Soon // Tactical Gear</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================
          TEAM OVERVIEW CARDS
          ======================== */}
      <SwipeableCards cards={[
        { label: 'REGISTERED ROSTER', value: teamStats.total, icon: '👥', color: '#22c55e' },
        { label: 'PENDING CLEARANCE', value: teamStats.pending, icon: '🔐', color: '#f59e0b' },
        { label: 'ACTIVE UNIT', value: teamStats.active, icon: '✅', color: '#22c55e' },
      ]} />

      {/* HIGHER-FIDELITY ATHLETE ROSTER */}
      <AthleteRoster 
        onSelectAthlete={(id) => { setSelectedAthlete(id); setIsPlanModalOpen(true); }}
        onLogSession={(id) => { setSelectedAthlete(id); setIsLoadModalOpen(true); }}
        onLogInjury={(id) => { setSelectedAthlete(id); setIsInjuryModalOpen(true); }}
        onViewAnalytics={(id) => { setSelectedAthlete(id); setIsVideoModalOpen(true); }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* OPERATIONAL SESSIONS CONTROL */}
        <TrainingSessionControl 
          onViewDetails={(session) => { setActiveSession(session); setIsDetailsOpen(true); }}
          onAdjustLoad={() => setIsAdjustLoadOpen(true)}
          onCreate={() => setIsCreateSessionOpen(true)}
        />

        <div className="space-y-8">
          <LiveTrainingMonitor />
          <AlertsFlagsWidget onReviewAll={() => setIsAlertsModalOpen(true)} />
        </div>
      </div>

      {/* FOOTER SECTION: WELLNESS + STAFF NOTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        
        {/* WELLNESS AGGREGATION */}
        <div className="bg-[#22c55e]/[0.02] border border-[#22c55e]/10 rounded-[24px] p-8 shadow-xl">
           <div className="flex justify-between items-center mb-8">
              <div className="text-[#22c55e] font-['Anton'] text-sm tracking-[0.2em] uppercase flex items-center gap-3">
                 <Activity size={18} /> SQUAD WELLNESS STATUS
              </div>
              <div className="text-[#22c55e] font-['Anton'] text-xl tracking-widest">79% OPS READY</div>
           </div>

           <ProgressBar value={79} height={8} />
           
           <div className="mt-8 space-y-4">
              {[
                { label: 'SLEEP ANOMALIES', count: 3, icon: '😴', color: '#f59e0b' },
                { label: 'EXTREME SORENESS', count: 2, icon: '🩹', color: '#ef4444' },
                { label: 'NEUTRAL MOOD', count: 1, icon: '😐', color: '#8b5cf6' },
              ].map((issue, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 group">
                  <div className="flex items-center gap-3 text-white/30 text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                    <span className="text-lg">{issue.icon}</span> {issue.label}
                  </div>
                  <div className="px-3 py-1 bg-black/40 text-[11px] font-['Anton'] tracking-widest rounded-full" style={{ color: issue.color }}>
                    {issue.count} SUBJECTS
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* STAFF COMMUNICATION LOG */}
        <div className="bg-[#111] border border-[#22c55e]/10 rounded-[24px] p-8 shadow-xl flex flex-col">
           <div className="text-[#22c55e] font-['Anton'] text-sm tracking-[0.2em] uppercase mb-8 flex items-center gap-3">
              <MessageSquare size={18} /> STAFF PROTOCOL LOGS
           </div>

           <div className="flex-1 space-y-4 mb-8 max-h-[250px] overflow-y-auto pr-2 scrollbar-hide">
              {staffNotes.length === 0 ? (
                <div className="py-12 text-center text-white/10 uppercase font-black text-[10px] tracking-widest">
                  PROTOCOL LOG CLEAR // NO RECENT NOTES
                </div>
              ) : (
                staffNotes.map((note, i) => (
                  <div key={i} className="p-4 bg-white/5 border-l-4 border-l-[#22c55e] rounded-xl relative group">
                    <p className="text-white/60 text-xs leading-relaxed italic">"{note.note}"</p>
                    <div className="flex justify-between items-center mt-3">
                       <span className="text-[#22c55e] text-[10px] font-['Anton'] tracking-wider uppercase opacity-50">{note.added_by?.first_name} {note.added_by?.last_name}</span>
                       <span className="text-white/10 text-[8px] font-black uppercase tracking-widest">{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
           </div>

           <div className="flex gap-2">
              <input 
                placeholder="ADD STAFF PROTOCOL NOTE..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 bg-black/40 border border-[#22c55e]/20 rounded-xl py-3 px-5 text-white text-xs font-bold uppercase placeholder:text-white/10 focus:outline-none focus:border-[#22c55e]"
              />
              <button 
                onClick={handleAddNote}
                className="bg-[#22c55e] text-black font-['Anton'] text-xs px-6 py-3 rounded-xl hover:bg-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                COMMIT
              </button>
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

      {/* TRAINING SESSION OPS MODALS */}
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
        sessions={[]} // Hook handles this internally or pass if needed
        athletes={athletes}
      />
    </div>
  );
}
