"use client";

import { createClient } from '@/utils/supabase/client';
import { format } from "date-fns";
import { TrainingSession } from "@/hooks/useSessions";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Zap, 
  Target, 
  ShieldCheck, 
  Clock, 
  Star,
  Bell,
  Calendar as CalendarIcon,
  Play,
  TrendingUp,
  Loader2,
  MapPin,
  ArrowRight,
  Video,
  MessageSquare,
  Camera
} from "lucide-react";
import Link from "next/link";

// Dashboard Components
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import MetricCard from "@/components/dashboard/MetricCard";
import SwipeableCards from "@/components/dashboard/SwipeableCards";
import StatusBadge from "@/components/dashboard/StatusBadge";
import GoalProgressBar from "@/components/dashboard/GoalProgressBar";
import WellnessCard from "@/components/dashboard/WellnessCard";
import ProgressBar from "@/components/dashboard/ProgressBar";
import AthleteLoadCard from "@/components/dashboard/AthleteLoadCard";
import AthleteAlertsCard from "@/components/dashboard/AthleteAlertsCard";
import AthleteProfileModal from "@/components/modals/AthleteProfileModal";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import Avatar from "@/components/ui/Avatar";
import SessionDetailsModal from "@/components/modals/SessionDetailsModal";
import WeeklySchedule from "@/components/dashboard/WeeklySchedule";
import WellnessCheckinModal from "@/components/modals/WellnessCheckinModal";
import CoachingTeamSection from "@/app/components/CoachingTeamSection";
import TimeDisplay from "@/components/ui/TimeDisplay";
import { useTimezone } from "@/hooks/useTimezone";



export default function DashboardOverview() {
  const { user, profile, loading: authLoading } = useAuth();
  const { formatTimeOnly, userTimezone } = useTimezone();
  const supabase = createClient();
  const athleteId = (profile?.role === 'parent' && profile.parent_of) ? profile.parent_of : user?.id;

  const [metrics, setMetrics] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<TrainingSession[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [childProfile, setChildProfile] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>({
    activePlan: null,
    activeInjuries: [],
    pendingSurveys: [],
    videoFeedback: [],
    trainerNotes: [],
    clearanceRequest: null
  });
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [lastSession, setLastSession] = useState<TrainingSession | null>(null);
  const [clearanceLoading, setClearanceLoading] = useState(false);
  const [clearanceMessage, setClearanceMessage] = useState<string | null>(null);
  const [declarationChecked, setDeclarationChecked] = useState(false);

  // Fetch child profile if logged in as parent
  useEffect(() => {
    if (profile?.role === 'parent' && profile.parent_of) {
      const fetchChildProfile = async () => {
        try {
          const res = await fetch(`/api/user/profile-lookup?id=${profile.parent_of}`);
          const data = await res.json();
          if (data && !data.error) {
            setChildProfile(data);
          }
        } catch (err) {
          console.error("Dashboard child profile lookup error:", err);
        }
      };
      fetchChildProfile();
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && athleteId) {
      fetchDashboardData();
      fetchAthleteSessions();

      // Listen for admin resolving the clearance request in real-time
      const channel = supabase
        .channel(`clearance_watch_${athleteId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'athlete_alerts',
            filter: `athlete_id=eq.${athleteId}`
          },
          (payload: any) => {
            // When any alert for this athlete is updated (e.g., resolved by admin), re-fetch
            if (payload.new?.is_resolved === true) {
              fetchDashboardData();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [athleteId, authLoading]);

  // Sync clearance button state with server — reset when admin resolves the request
  useEffect(() => {
    if (performanceData.clearanceRequest) {
      setClearanceMessage('Request Pending');
    } else if (performanceData.clearanceRequest === null && !performanceData.activeInjuries?.length) {
      // No pending request AND no injuries — fully reset the button
      setClearanceMessage(null);
    } else if (performanceData.clearanceRequest === null) {
      // Admin resolved the request (injuries still active, but request cleared)
      setClearanceMessage(null);
    }
  }, [performanceData.clearanceRequest]);

  const fetchAthleteSessions = async () => {
    if (!supabase || !athleteId) return;
    const today = format(new Date(), "yyyy-MM-dd");
    
    // 1. Fetch sessions directly assigned to the athlete
    const { data: assignedData } = await supabase
      .from("training_sessions")
      .select("*")
      .gte("scheduled_date", today)
      .contains("assigned_athletes", [athleteId]);

    // 2. Fetch sessions the athlete has explicitly booked
    const { data: bookedData } = await supabase
      .from("session_bookings")
      .select("session_id, status, training_sessions(*)")
      .eq("athlete_id", athleteId)
      .in("status", ["CONFIRMED", "PENDING"]);

    // Extract valid future sessions from bookings
    const bookedSessions = (bookedData || [])
      .map((b: any) => b.training_sessions)
      .filter((s: any) => s && s.scheduled_date >= today);

    // Merge and Deduplicate by session ID
    const sessionMap = new Map();
    if (assignedData) {
      assignedData.forEach((s: any) => sessionMap.set(s.id, s));
    }
    bookedSessions.forEach((s: any) => sessionMap.set(s.id, s));

    const mergedSessions = Array.from(sessionMap.values());
    
    // Sort chronologically
    mergedSessions.sort((a, b) => {
      if (a.scheduled_date === b.scheduled_date) {
        return a.start_time.localeCompare(b.start_time);
      }
      return a.scheduled_date.localeCompare(b.scheduled_date);
    });

    // Fetch the most recent past session (strictly before today)
    const { data: pastData } = await supabase
      .from("training_sessions")
      .select("*")
      .lt("scheduled_date", today)
      .contains("assigned_athletes", [athleteId])
      .order("scheduled_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(1);

    if (pastData && pastData.length > 0) {
      setLastSession(pastData[0] as TrainingSession);
    }

    setTodaySessions(mergedSessions as TrainingSession[]);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metRes, schRes, notRes, perfRes] = await Promise.all([
        fetch(`/api/athlete/metrics?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/athlete/schedule?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/athlete/notifications?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/athlete/performance-hub?t=${Date.now()}`, { cache: 'no-store' })
      ]);
      
      const [metData, schData, notData, perfData] = await Promise.all([
        metRes.json(), 
        schRes.json(), 
        notRes.json(),
        perfRes.json()
      ]);

      if (!metData.error) setMetrics(metData);
      if (!schData.error) setSchedule(schData);
      if (!notData.error) setNotifications(notData);
      if (!perfData.error) setPerformanceData(perfData);
    } catch (err) {
      console.error("Failed to sync dashboard matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-accent-green animate-spin" size={48} />
          <p className="font-label text-accent-green text-[10px] tracking-[4px] uppercase animate-pulse">Synchronizing Matrix...</p>
        </div>
      </div>
    );
  }

  const athleteName = profile?.role === 'parent'
    ? (childProfile ? `${childProfile.first_name} ${childProfile.last_name || ''}` : 'Child Athlete')
    : (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Athlete');
  
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const now = new Date();
  const currentTimeStr = format(now, "HH:mm:ss");

  const todaySessionsFiltered = todaySessions.filter(s => s.scheduled_date === todayStr);
  const futureSessions = todaySessions.filter(s => s.scheduled_date > todayStr);

  const upcomingToday = todaySessionsFiltered.filter(s => s.start_time > currentTimeStr)[0];
  const passedToday = [...todaySessionsFiltered].filter(s => s.start_time <= currentTimeStr).sort((a, b) => b.start_time.localeCompare(a.start_time))[0];
  const nextFuture = futureSessions[0];

  const sessionToDisplay = upcomingToday || nextFuture;

  const effectiveLastSession = passedToday || lastSession;

  const nextSession = sessionToDisplay
    ? { 
        session: sessionToDisplay.title, 
        time: formatTimeOnly(sessionToDisplay.start_time, (sessionToDisplay as any).coach_timezone || 'UTC'),
        isToday: sessionToDisplay.scheduled_date === todayStr,
        date: sessionToDisplay.scheduled_date === todayStr ? "TODAY" : format(new Date(sessionToDisplay.scheduled_date + 'T00:00:00'), "MMM d")
      }
    : effectiveLastSession 
      ? {
          session: effectiveLastSession.title,
          time: formatTimeOnly(effectiveLastSession.start_time, (effectiveLastSession as any).coach_timezone || 'UTC'),
          isToday: false,
          date: `LAST: ${format(new Date(effectiveLastSession.scheduled_date + 'T00:00:00'), "MMM d")}`
        }
      : (schedule.find(s => s.type !== 'rest') || { session: 'No Session Scheduled', time: '--:--' });

  // --- LOGIC: READINESS & SAFETY ---
  const readinessScore = Math.round(((metrics?.sleep_score || 0) + (10 - (metrics?.soreness || 0))) / 20 * 100);
  
  // Safety First: Active injury overrides readiness to "NOT READY"
  const hasActiveInjury = Boolean(
    (performanceData.activeInjuries && performanceData.activeInjuries.length > 0) || 
    performanceData.profileStatus?.toUpperCase() === 'INJURED' ||
    metrics?.training_status?.toUpperCase() === 'INJURED' ||
    metrics?.injury_risk?.toUpperCase() === 'HIGH'
  );
  const isReady = readinessScore > 70 && !hasActiveInjury;
  
  // Status Labels
  const statusLabel = hasActiveInjury ? 'INJURED' : isReady ? 'READY' : 'FATIGUE';
  const statusColor = hasActiveInjury ? 'text-red-500' : isReady ? 'text-[#22c55e]' : 'text-amber-500';

  const handleRequestClearance = async () => {
    setClearanceLoading(true);
    try {
      const res = await fetch('/api/athlete/injury/clearance-request', { method: 'POST' });
      const data = await res.json();
      setClearanceMessage(data.message || 'Request Sent');
    } catch (err) {
      setClearanceMessage('Connection Failed');
    } finally {
      setClearanceLoading(false);
    }
  };

  if (hasActiveInjury) {
    return (
      <div className="pt-10 pb-20 px-6 md:px-10 max-w-7xl mx-auto space-y-8 relative">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* 1. Header (glowing profile, restricted indicator) */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsProfileModalOpen(true)}
          className="relative group overflow-hidden bg-gradient-to-br from-red-500/[0.08] to-transparent border border-red-500/20 rounded-[24px] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-12 z-10 cursor-pointer transition-all hover:bg-red-500/[0.12]"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto text-center sm:text-left">
            <div className="relative shrink-0 group/avatar mx-auto sm:mx-0">
              <Avatar 
                  src={profile?.avatar_url}
                  name={athleteName}
                  role="athlete"
                  size="xl"
              />
              <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all backdrop-blur-[2px] border-2 border-red-500">
                 <Camera size={24} className="text-red-500 mb-1" />
                 <span className="text-[8px] font-black text-white uppercase tracking-widest">MODIFY</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-red-500 shadow-[0_4px_10px_rgba(239,68,68,0.3)] border-2 border-[#0a0a0a] flex items-center justify-center text-black">
                 <ShieldCheck size={12} strokeWidth={3} />
              </div>
            </div>

            <div>
              <div className="text-red-500 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
                Medical Restricted Access // Tactical Lock
              </div>
              <h2 className={`font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wider mb-2 leading-none`}>
                {athleteName.toUpperCase()}
              </h2>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
                <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-lg border border-white/5">
                   <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Training:</span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                     RESTRICTED
                   </span>
                </div>
                <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-lg border border-white/5">
                   <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Prognosis:</span>
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">
                     Rehabilitating
                   </span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto bg-black/40 border border-white/5 rounded-2xl p-6 text-center sm:text-right relative min-w-[200px]">
             <div className="text-red-500/30 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
               LOCK STATUS
             </div>
              <div className="text-white font-display font-black text-lg tracking-wider mb-2 uppercase">
                SYSTEM RESTRICTED
              </div>
              <div className="text-red-500 font-display font-black text-3xl drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]">
               SECURE LOCK
             </div>
          </div>
        </motion.div>

        {/* 2. Main Block Card: Clinical Deviation & Clearance Portal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 z-10 relative">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* The Active Injury & Declaration Form */}
            <div className="bg-[#111] border border-red-500/20 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 font-display font-black text-8xl pointer-events-none text-red-500">REHAB</div>
              
              <div className="relative z-10 space-y-8 text-left">
                <div>
                  <div className="text-red-500 font-display font-black text-sm tracking-widest uppercase flex items-center gap-2 mb-2">
                    <ShieldCheck size={18} /> Active Injury Logged
                  </div>
                  <h3 className="text-white font-display font-black text-2xl uppercase tracking-wide">
                    {performanceData.activeInjuries[0]?.injury_type || 'Clinical Record'}
                  </h3>
                  <p className="text-white/40 text-[10px] md:text-xs font-mono uppercase tracking-wider mt-1">
                    Prognosis Area: {performanceData.activeInjuries[0]?.body_part || 'Systemic'} // Severity: {performanceData.activeInjuries[0]?.severity || 'High'}
                  </p>
                </div>

                <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="text-white/20 text-[9px] font-black tracking-[3px] uppercase mb-2">CLINICAL OBSERVATIONS</div>
                  <p className="text-white/70 text-xs leading-relaxed italic">
                    "{performanceData.activeInjuries[0]?.notes || 'No notes provided by staff.'}"
                  </p>
                </div>

                {/* The Checkbox Declaration Form */}
                <div className="pt-6 border-t border-white/5 space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-red-500/[0.03] border border-red-500/10 rounded-2xl hover:bg-red-500/[0.05] transition-all cursor-pointer select-none" onClick={() => setDeclarationChecked(!declarationChecked)}>
                    <div className="flex items-center justify-center shrink-0 w-6.5 h-6.5 rounded-lg border-2 border-red-500/30 transition-all bg-black/40 mt-0.5 relative">
                      {declarationChecked && (
                        <div className="absolute inset-1 bg-red-500 rounded-md" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-xs uppercase tracking-wide mb-1">Recovery & Fitness Declaration</h4>
                      <p className="text-white/50 text-[10.5px] leading-relaxed">
                        {profile?.role === 'parent'
                          ? `I hereby formally declare that my child (${athleteName}) has recovered from their injury, is currently pain-free, and I am requesting administrative clearance for them to return to active tactical and training protocols.`
                          : "I hereby formally declare that I have recovered from my injury, am currently pain-free, and am requesting administrative clearance to return to active tactical and training protocols."
                        }
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={handleRequestClearance}
                    disabled={clearanceLoading || clearanceMessage !== null || !declarationChecked}
                    className="w-full py-5 bg-red-500 hover:bg-white hover:text-black text-white disabled:bg-red-500/20 disabled:text-red-500/40 disabled:cursor-not-allowed font-black text-xs rounded-2xl uppercase tracking-widest transition-all shadow-[0_15px_40px_rgba(239,68,68,0.2)] active-scale flex items-center justify-center gap-3"
                  >
                    {clearanceLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        TRANSMITTING REQUEST...
                      </>
                    ) : clearanceMessage ? (
                      <>
                        <Clock size={16} className="animate-pulse" />
                        {clearanceMessage.toUpperCase()}
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        {profile?.role === 'parent' ? "Request Child's Clearance" : "Submit Clearance Request"}
                      </>
                    )}
                  </button>

                  {/* Feedback Message */}
                  {(clearanceMessage || performanceData.clearanceRequest) && (
                    <div className="p-4 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl text-[#22c55e] text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                      {profile?.role === 'parent'
                        ? "Clearance Request Pending Command Staff Approval for Child"
                        : "Clearance Request Pending Command Staff Approval"
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* General Recovery Protocol Tips for engagement */}
            <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 text-left space-y-6">
              <div className="text-[#22c55e] font-display font-black text-sm tracking-[0.2em] uppercase flex items-center gap-3">
                <Activity size={18} /> Active Recovery Guidelines
              </div>
              <p className="text-white/40 text-[11px] leading-relaxed">
                While under a medical restricted training block, you must prioritize low-intensity mobility and systemic preservation. Follow these recommended baselines:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                  <div className="text-[10px] text-white/30 font-black tracking-widest uppercase mb-1">1. Hydration Target</div>
                  <div className="text-lg font-display font-black text-[#22c55e]">3.8 LITERS / DAY</div>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                  <div className="text-[10px] text-white/30 font-black tracking-widest uppercase mb-1">2. Core Sleep Baseline</div>
                  <div className="text-lg font-display font-black text-[#22c55e]">8.5 HOURS / NIGHT</div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  '🤸 Light passive stretching & mobility (20 mins daily)',
                  '🥩 High protein preservation intake (+1.8g per kg body weight)',
                  '🧘 Mental visualization of operational tactics to sustain sharpness',
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-white/60 text-[10px] uppercase tracking-wider bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Coaching team to let them see who can approve them */}
          <div className="space-y-6 text-left">
            <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 space-y-8">
              <div className="text-white/30 font-display font-black text-xs tracking-[0.3em] uppercase">
                COMMAND CLEARANCE STAFF
              </div>
              <p className="text-white/40 text-[10.5px] leading-relaxed">
                Only verified superadmins and coaching staff can approve recovery status and restore dashboard access.
              </p>
              <CoachingTeamSection gridClass="grid-cols-1" />
            </div>

            <AthleteAlertsCard athleteId={user?.id || ''} />
          </div>
        </div>

        {/* Standard Modals */}
        <AthleteProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onChangePassword={() => {
            setIsProfileModalOpen(false);
            setIsPassModalOpen(true);
          }}
        />
        <ChangePasswordModal
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
        />
        <WellnessCheckinModal 
          isOpen={isCheckinModalOpen}
          onClose={() => setIsCheckinModalOpen(false)}
          athleteId={user?.id || ""}
          onSuccess={() => {
            fetchDashboardData();
            fetchAthleteSessions();
          }}
        />
      </div>
    );
  }

  return (
    <div className="pt-10 pb-20 px-6 md:px-10 max-w-7xl mx-auto space-y-8 relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* ========================
          SECTION 1: HEADER
          ======================== */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ x: 5, backgroundColor: "rgba(34, 197, 94, 0.05)" }}
        onClick={() => setIsProfileModalOpen(true)}
        className="relative group overflow-hidden bg-gradient-to-br from-[#22c55e]/[0.08] to-transparent border border-[#22c55e]/15 rounded-[24px] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-12 z-10 cursor-pointer transition-all"
      >
        {/* Left: Profile */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto text-center sm:text-left">
          {/* Avatar Container */}
          <div className="relative shrink-0 group/avatar mx-auto sm:mx-0">
            <Avatar 
                src={profile?.avatar_url}
                name={athleteName}
                role="athlete"
                size="xl"
            />
            <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all backdrop-blur-[2px] border-2 border-[#22c55e]">
               <Camera size={24} className="text-[#22c55e] mb-1" />
               <span className="text-[8px] font-black text-white uppercase tracking-widest">MODIFY</span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg ${hasActiveInjury ? 'bg-red-500 shadow-[0_4px_10px_rgba(239,68,68,0.3)]' : 'bg-[#22c55e] shadow-[0_4px_10px_rgba(34,197,94,0.3)]'} border-2 border-[#0a0a0a] flex items-center justify-center text-black`}>
               {hasActiveInjury ? <ShieldCheck size={12} strokeWidth={3} /> : <Activity size={12} strokeWidth={3} />}
            </div>
          </div>

          <div>
            <div className="text-[#22c55e] text-[10px] font-black tracking-[0.3em] uppercase mb-1">
              {profile?.role === 'parent' ? 'Child Monitoring Portal // Active Tracker' : 'Athlete Portal // Baseline Active'}
            </div>
            <h2 className={`font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wider mb-4 leading-none`}>
              {athleteName.toUpperCase()}
            </h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4">
              <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-lg border border-white/5">
                 <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Training:</span>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                   {statusLabel}
                 </span>
              </div>
              <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-lg border border-white/5">
                 <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Recovery:</span>
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">
                   {hasActiveInjury ? 0 : readinessScore}%
                 </span>
              </div>
              {profile?.role !== 'parent' && (
                <button
                   onClick={(e) => { e.stopPropagation(); setIsCheckinModalOpen(true); }}
                   className="flex items-center gap-3 bg-[#22c55e] px-6 py-2 rounded-xl text-black font-black uppercase text-[9px] tracking-widest hover:bg-white transition-all transform hover:scale-105 active-scale"
                >
                   <Activity size={12} /> Daily Check-in
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Next Session */}
        <motion.button 
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={(e) => {
             e.stopPropagation();
             if (upcomingToday) {
               setSelectedSession(upcomingToday);
               setIsSessionModalOpen(true);
             }
           }}
           className="w-full sm:w-auto bg-black/40 border border-white/10 rounded-2xl p-6 text-center sm:text-right relative min-w-[200px] cursor-pointer group/next"
        >
           <div className="text-white/20 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
             NEXT OPS SESSION
           </div>
           <div className="text-white font-display font-black text-lg tracking-wider mb-2 uppercase group-hover/next:text-[#22c55e] transition-colors">
              {nextSession.session}
            </div>
            <div className="text-[#22c55e] font-display font-black text-3xl drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]">
             {nextSession.date && <span className="text-white/50 text-xs tracking-widest mr-3 font-black uppercase">{nextSession.date} //</span>}
             {nextSession.time}
           </div>
           <div className="absolute bottom-2 right-4 text-[40px] opacity-5 font-display pointer-events-none">
             SYSTEM_01
           </div>
        </motion.button>
      </motion.div>

      {/* ========================
          SECTION 2: WEEKLY SUMMARY
          ======================== */}
      <SwipeableCards cards={[
        { 
          label: 'WEEKLY SCORE',
          value: `${metrics?.weekly_score || 0}/100`,
          stars: Math.round((metrics?.weekly_score || 0) / 20),
          icon: '⭐',
          color: '#22c55e',
        },
        { 
          label: 'TRAINING LOAD',
          value: `${metrics?.weekly_load || 0} AU`,
          icon: '🏋️',
          color: '#22c55e',
        },
        { 
          label: 'INJURY RISK',
          value: (metrics?.injury_risk || 'LOW').toUpperCase(),
          icon: '🩺',
          color: metrics?.injury_risk === 'high' ? '#ef4444' : metrics?.injury_risk === 'medium' ? '#f59e0b' : '#22c55e',
        },
        { 
          label: 'RECOVERY INDEX',
          value: `${hasActiveInjury ? 0 : (metrics?.recovery_index || 0)}%`,
          icon: '💪',
          color: '#22c55e',
        },
      ]} />

      {/* ========================
          SECTION 3: QUICK METRICS
          ======================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 z-10 relative">
        {[
          { label: 'TOP SPEED', value: metrics?.top_speed || 0, unit: 'km/h', icon: '⚡', trend: '↑' },
          { label: 'DISTANCE', value: metrics?.distance || 0, unit: 'km', icon: '📍', trend: '↑' },
          { label: 'SPRINTS', value: metrics?.sprints || 0, icon: '🏃', trend: '→' },
          { label: 'HRV', value: metrics?.hrv || 0, unit: 'ms', icon: '💓', trend: '↑' },
        ].map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 z-10 relative">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          {/* PHYSICAL PERFORMANCE */}
          <CollapsibleSection title="⚡ PHYSICAL PERFORMANCE">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'VO₂ MAX', value: metrics?.vo2_max || 0, trend: '↑' },
                { label: 'RESTING HR', value: `${metrics?.resting_hr || 0} BPM`, trend: '↓' },
                { label: 'POWER OUTPUT', value: `${metrics?.power_output || 0} W`, trend: '↑' },
                { label: 'HIGH INTENSITY', value: metrics?.high_intensity_efforts || 0, unit: 'efforts' },
              ].map((m, i) => (
                <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center group">
                  <div>
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{m.label}</div>
                    <div className="text-xl font-display font-black text-white mt-1 group-hover:text-[#22c55e] transition-colors">{m.value}</div>
                  </div>
                  <div className="text-[#22c55e] font-black">{m.trend}</div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* MATCH METRICS */}
          <CollapsibleSection title="⚽ MATCH METRICS" defaultOpen={false}>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'GOALS', value: metrics?.goals || 0 },
                { label: 'ASSISTS', value: metrics?.assists || 0 },
                { label: 'xG', value: metrics?.xg || 0 },
                { label: 'PASS ACC.', value: `${metrics?.pass_accuracy || 0}%` },
                { label: 'DUELS WON', value: `${metrics?.duels_won || 0}%` },
                { label: 'PRESSURES', value: metrics?.pressures || 0 },
              ].map((m, i) => (
                <div key={i} className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-display font-black text-[#22c55e]">{m.value}</div>
                  <div className="text-[8px] font-black text-white/20 tracking-[1.5px] uppercase mt-2">{m.label}</div>
                </div>
              ))}
            </div>
            
            {/* Heatmap Placeholder */}
            <div className="bg-[#00ff41]/5 border border-[#00ff41]/20 rounded-xl p-5 flex items-center justify-between cursor-pointer group hover:bg-[#00ff41]/10 transition-all">
              <div>
                <div className="text-[#22c55e] font-display font-black text-sm tracking-wider uppercase">Tactical Heatmap</div>
                <div className="text-white/30 text-[10px] uppercase font-bold mt-1">Access Spatial Density Matrix →</div>
              </div>
              <div className="text-4xl filter grayscale group-hover:grayscale-0 transition-all">🗺️</div>
            </div>
          </CollapsibleSection>

          {/* COGNITIVE & MENTAL */}
          <CollapsibleSection title="🧠 COGNITIVE & MENTAL">
            <div className="space-y-6">
              {[
                { label: 'REACTION TIME', value: `${metrics?.reaction_time || 0} ms`, trend: '↑', good: 'lower is better' },
                { label: 'DECISION SCORE', value: `${metrics?.decision_score || 0}/10`, progress: (metrics?.decision_score || 0) * 10 },
                { label: 'FOCUS SCORE', value: `${metrics?.focus_score || 0}%`, progress: metrics?.focus_score || 0 },
              ].map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{m.label}</div>
                    <div className="text-sm font-display font-black text-[#22c55e]">{m.value}</div>
                  </div>
                  {m.progress !== undefined && <ProgressBar value={m.progress} color="#22c55e" height={4} />}
                </div>
              ))}
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                 <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">STRESS LEVEL</span>
                 <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                   metrics?.stress_level === 'low' ? 'bg-[#22c55e]/10 text-[#22c55e]' : metrics?.stress_level === 'moderate' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                 }`}>
                   {metrics?.stress_level?.toUpperCase() || 'LOW'}
                 </span>
              </div>
            </div>
          </CollapsibleSection>

          {/* MY ELITE PROGRAM */}
          <CollapsibleSection title="🔥 MY ELITE PROGRAM" defaultOpen={true}>
            {performanceData.activePlan ? (
              <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 p-6 rounded-3xl relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <div className="text-[#22c55e] text-[10px] font-black tracking-[4px] uppercase mb-1">CURRENT PHASE</div>
                       <h3 className="text-white font-display font-black text-2xl tracking-wider uppercase">{performanceData.activePlan.title}</h3>
                    </div>
                    <div className="bg-[#22c55e] text-black font-display font-black text-[10px] px-4 py-1 rounded-full tracking-widest">
                       {performanceData.activePlan.phase.toUpperCase()}
                    </div>
                 </div>
                 
                 <div className="p-4 bg-black/40 border border-white/5 rounded-2xl mb-6">
                    <div className="text-white/20 text-[9px] font-black tracking-[3px] uppercase mb-2">COACH INSTRUCTIONS</div>
                    <p className="text-white/70 text-xs leading-relaxed italic">"{performanceData.activePlan.notes}"</p>
                 </div>

                 <div className="flex justify-between items-center text-[9px] font-black text-white/20 uppercase tracking-[2px]">
                    <div>EFFECTIVE: {format(new Date(performanceData.activePlan.effective_date), "MMM d, yyyy")}</div>
                    <div className="text-[#22c55e]">AUTO-SYNCHRONIZED</div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 text-7xl opacity-[0.03] font-display font-black pointer-events-none group-hover:opacity-[0.06] transition-opacity">PLAN</div>
              </div>
            ) : (
              <div className="py-12 text-center bg-white/[0.02] border border-white/5 rounded-3xl text-white/10 uppercase font-bold text-[10px] tracking-widest italic">
                NO ACTIVE PROGRAM ASSIGNED
              </div>
            )}
          </CollapsibleSection>

          {/* PROVISIONAL RECOVERY HUB */}
          <CollapsibleSection title="🩺 RECOVERY HUB" defaultOpen={performanceData.activeInjuries.length > 0}>
             <div className="space-y-4">
                <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest mb-1">ACTIVE CLINICAL LOGS</div>
                {performanceData.activeInjuries.length === 0 ? (
                  <div className="py-6 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-white/10 uppercase font-bold text-[9px] tracking-widest italic">
                    NO ACTIVE INJURIES // OPTIMAL STATUS
                  </div>
                ) : (
                  performanceData.activeInjuries.map((injury: any, i: number) => (
                    <div key={i} className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl relative group overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10 font-display font-black text-4xl pointer-events-none group-hover:opacity-20 transition-opacity">MED</div>
                       <div className="relative z-10">
                          <div className="flex justify-between items-center mb-2">
                             <div className="text-red-500 font-display font-black text-[11px] tracking-widest uppercase flex items-center gap-2">
                                <ShieldCheck size={14} /> {injury.injury_type}
                             </div>
                             <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                injury.severity === 'High' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-500'
                             }`}>
                               {injury.severity} SEVERITY
                             </div>
                          </div>
                          <div className="text-white font-bold text-sm uppercase tracking-wide mb-1">{injury.body_part}</div>
                          <div className="text-white/40 text-[10px] font-medium leading-relaxed mb-3">"{injury.notes}"</div>
                          <div className="flex justify-between items-center pt-3 border-t border-red-500/10">
                             <div className="text-red-500/60 text-[9px] font-black uppercase tracking-widest">STATUS: {injury.status.toUpperCase()}</div>
                             <div className="text-white/10 text-[8px] font-black uppercase">{format(new Date(injury.logged_at), "MMM d")}</div>
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </CollapsibleSection>

          {/* RECOVERY & WELLNESS */}
          <CollapsibleSection title="💤 RECOVERY & WELLNESS">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'SLEEP', value: `${metrics?.sleep_score || 0}/10`, icon: '😴', progress: (metrics?.sleep_score || 0) * 10 },
                { label: 'SORENESS', value: `${metrics?.soreness || 0}/10`, icon: '🩹', progress: (metrics?.soreness || 0) * 10, invert: true },
                { label: 'HYDRATION', value: (metrics?.hydration || 'Optimal').toUpperCase(), icon: '💧', color: metrics?.hydration === 'Low' ? '#f59e0b' : '#22c55e' },
                { label: 'MOOD', value: (metrics?.mood || 'Good').toUpperCase(), icon: '😊', color: '#22c55e' },
              ].map((m, i) => (
                <WellnessCard key={i} {...m} />
              ))}
            </div>

            {/* Recommendations */}
            <div className="bg-[#22c55e]/[0.02] border border-[#22c55e]/10 rounded-2xl p-6">
              <div className="text-[#22c55e] font-display font-black text-[11px] tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                <Target size={14} /> Recovery Protocol
              </div>
              <div className="space-y-3">
                {[
                  '🤸 Light mobility session (20m)',
                  '❄️ Cold plunge protocol (8 min)',
                  '🥩 Optimize protein intake (+20g)',
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/40 text-[11px] uppercase tracking-wider bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="w-1 h-1 rounded-full bg-[#22c55e]" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* GOALS & PROGRESS */}
          <CollapsibleSection title="🎯 GOALS & PROGRESS">
             <GoalProgressBar 
                label="SPRINT SPEED" 
                current={metrics?.sprint_speed_current || 0} 
                target={metrics?.sprint_speed_target || 35} 
                unit="km/h" 
                change="+3.2%" 
             />
             <GoalProgressBar 
                label="PASS ACCURACY" 
                current={metrics?.pass_accuracy || 0} 
                target={metrics?.pass_accuracy_target || 90} 
                unit="%" 
             />
             <GoalProgressBar 
                label="FATIGUE DIPS" 
                current={metrics?.fatigue_dips_per_week || 0} 
                target={1} 
                unit="/wk" 
                invert={true}
             />
          </CollapsibleSection>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* COACH'S PROTOCOL FEEDBACK - NEW */}
          <div className="bg-[#111] border border-[#22c55e]/20 rounded-3xl p-8 relative overflow-hidden h-fit">
            <div className="flex justify-between items-center mb-8">
               <div className="text-[#22c55e] font-display font-black text-sm tracking-[0.2em] uppercase flex items-center gap-3">
                  <MessageSquare size={18} /> COACH'S PROTOCOL FEEDBACK
               </div>
            </div>

            <div className="space-y-4">
              {!metrics?.protocol_directives || metrics.protocol_directives.includes('PROTOCOL NEUTRAL') ? (
                <div className="py-10 text-center text-white/10 uppercase font-bold text-[10px] tracking-widest italic border border-dashed border-white/5 rounded-2xl">
                  Subject Protocol Neutral // No Directives Found
                </div>
              ) : (
                <div className="p-5 bg-[#22c55e]/5 border-l-4 border-l-[#22c55e] rounded-xl relative group">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[#22c55e] text-[9px] font-display font-black tracking-wider uppercase">COACHING STAFF // TACTICAL DIRECTIVE</span>
                     <span className="text-white/10 text-[8px] font-black uppercase tracking-widest">LATEST UPDATE</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed italic whitespace-pre-wrap">"{metrics.protocol_directives}"</p>
                </div>
              )}
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5 font-display font-black text-8xl pointer-events-none uppercase">LOG</div>
          </div>

          {/* TODAY'S SCHEDULE - NEW HIGH-FIDELITY TRACKING */}
          <div className="bg-[#111] border border-[#22c55e]/20 rounded-3xl p-10 relative overflow-hidden h-fit">
            <div className="flex justify-between items-center mb-10">
               <div className="text-[#22c55e] font-display font-black text-sm tracking-[0.2em] uppercase flex items-center gap-3">
                  <CalendarIcon size={18} /> Today's Operational Status
               </div>
               <div className="flex items-center gap-2 px-4 py-1.5 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                  <span className="text-[9px] font-black text-[#22c55e] lg:tracking-widest">LIVE OPS</span>
               </div>
            </div>

            <div className="space-y-4 mb-2">
              {todaySessionsFiltered.length === 0 ? (
                <div className="py-12 text-center text-white/10 uppercase font-bold text-[10px] tracking-widest italic border border-white/5 rounded-2xl bg-white/[0.01]">
                  Field Operations Clear // No Sessions Detected
                </div>
              ) : (
                todaySessionsFiltered.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setSelectedSession(s);
                      setIsSessionModalOpen(true);
                    }}
                    className={`w-full text-left flex items-center gap-6 p-6 rounded-2xl border-l-[6px] border border-white/5 transition-all group hover:scale-[1.02] hover:bg-white/[0.05] ${
                    s.session_type === 'STRENGTH' ? 'border-l-amber-500 bg-amber-500/5' :
                    s.session_type === 'TACTICAL' ? 'border-l-blue-500 bg-blue-500/5' :
                    s.session_type === 'CONDITIONING' ? 'border-l-[#22c55e] bg-[#22c55e]/5' :
                    'border-l-purple-500 bg-purple-500/5'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                           s.status === 'IN_PROGRESS' ? 'bg-[#22c55e] text-black animate-pulse' : 'bg-white/5 text-white/40'
                         }`}>
                           {s.status}
                         </span>
                         <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={10} /> {formatTimeOnly(s.start_time, (s as any).coach_timezone || 'UTC')}
                         </span>
                      </div>
                      <h4 className="text-white font-display font-black text-lg tracking-wider uppercase truncate group-hover:text-[#22c55e] transition-colors">{s.title}</h4>
                      <div className="flex items-center gap-3 text-white/30 text-[9px] font-black tracking-widest uppercase mt-1">
                         <div className="flex items-center gap-1.5"><MapPin size={10} /> {s.location || 'HQ FIELD'}</div>
                         <div className="flex items-center gap-1.5"><Activity size={10} /> {s.duration_minutes}m</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            
            <div className="absolute top-0 right-0 p-8 opacity-5 font-display font-black text-8xl pointer-events-none">SQUAD</div>
          </div>

          {/* PERSONAL ALERTS */}
          <AthleteAlertsCard athleteId={user?.id || ''} />

          {/* PERSONAL TRAINING LOAD */}
          <AthleteLoadCard athleteId={user?.id || ''} currentAu={metrics?.weekly_load || 0} />

          {/* COACHING TEAM AVAILABILITY */}
          <CoachingTeamSection />

          {/* VIDEO & TACTICAL FEEDBACK */}
          <CollapsibleSection title="🎬 TACTICAL REVIEW" defaultOpen={true}>
             <div className="space-y-4 mb-6">
                <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest mb-1">COACH FEEDBACK TRANSMISSIONS</div>
                {performanceData.videoFeedback.length === 0 ? (
                  <div className="py-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-white/10 uppercase font-bold text-[9px] tracking-widest italic">
                    NO TACTICAL CLIPS ASSIGNED
                  </div>
                ) : (
                  performanceData.videoFeedback.map((clip: any, i: number) => {
                    
                    // --- SMART VIDEO PARSER ---
                    let embedUrl = clip.video_url;
                    let isDirectVideo = false;
                    
                    if (clip.video_url.includes('youtube.com/watch?v=')) {
                      embedUrl = clip.video_url.replace('watch?v=', 'embed/');
                    } else if (clip.video_url.includes('youtu.be/')) {
                      embedUrl = clip.video_url.replace('youtu.be/', 'youtube.com/embed/');
                    } else if (clip.video_url.includes('vimeo.com/')) {
                      // Extract the ID from the end of the URL
                      const vimeoId = clip.video_url.split('/').pop().split('?')[0];
                      embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
                    } else if (clip.video_url.endsWith('.mp4') || clip.video_url.endsWith('.mov') || clip.video_url.includes('supabase.co/storage')) {
                      // Supabase storage links or direct file links can be played natively
                      isDirectVideo = true;
                    }

                    return (
                    <div key={i} className="flex flex-col gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Play size={14} className="text-blue-500" />
                          <span className="text-xs text-white font-bold tracking-wide uppercase">{clip.title}</span>
                        </div>
                        <div className="bg-blue-500/10 text-blue-500 text-[9px] font-display font-black px-3 py-1 rounded-full uppercase tracking-widest">
                          {clip.category}
                        </div>
                      </div>
                      
                      <div className="relative rounded-lg overflow-hidden aspect-video bg-black/40 border border-white/5">
                         {isDirectVideo ? (
                           <video 
                             className="w-full h-full object-cover" 
                             controls 
                             preload="metadata"
                             src={clip.video_url}
                           >
                             Your browser does not support the video tag.
                           </video>
                         ) : (
                           <iframe 
                             className="absolute inset-0 w-full h-full"
                             src={embedUrl}
                             title={clip.title}
                             frameBorder="0"
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                             allowFullScreen
                           />
                         )}
                      </div>

                      {clip.notes && <p className="text-[10px] text-white/30 italic leading-relaxed px-1 mt-1">"{clip.notes}"</p>}
                    </div>
                  )})
                )}
             </div>
          </CollapsibleSection>
        </div>
      </div>

      {/* DASHBOARD BOTTOM SECTION - NOTIFICATIONS & SCHEDULE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 z-10 relative">
        
        {/* WEEKLY PLAN */}
        <div className="bg-[#111] border border-[#22c55e]/20 rounded-3xl p-8 relative overflow-hidden h-fit lg:col-span-2">
           <div className="flex justify-between items-center mb-8">
              <div className="text-white/30 font-display font-black text-sm tracking-[0.2em] uppercase flex items-center gap-3">
                 <CalendarIcon size={18} /> Weekly Plan Overview
              </div>
              <Link href="/dashboard/booking" className="bg-[#22c55e] hover:bg-white text-black font-display font-black text-[10px] px-6 py-2 rounded-lg transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                BOOK OPS +
              </Link>
           </div>

           <div className="relative z-10">
              <WeeklySchedule />
           </div>
           <div className="absolute top-0 right-0 p-8 opacity-5 font-display font-black text-8xl pointer-events-none">PLAN</div>
        </div>
      </div>

      {/* MODALS */}
      <AthleteProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onChangePassword={() => {
          setIsProfileModalOpen(false);
          setIsPassModalOpen(true);
        }}
      />
      <ChangePasswordModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
      />
      <SessionDetailsModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        session={selectedSession}
      />
      <WellnessCheckinModal 
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        athleteId={user?.id || ""}
        onSuccess={() => {
          fetchDashboardData();
          fetchAthleteSessions();
        }}
      />
    </div>
  );
}
