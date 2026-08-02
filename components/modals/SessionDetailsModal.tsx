"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MapPin, Activity, Users, Save, Loader2, Play, CheckCircle2, Trash2, Edit2, Plus, FlaskConical } from "lucide-react";
import EditSessionModal from "@/components/modals/EditSessionModal";
import { useSessions, TrainingSession } from "@/hooks/useSessions";
import { useAuth } from "@/components/providers/AuthProvider";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";


interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TrainingSession | null;
}

export default function SessionDetailsModal({ isOpen, onClose, session }: SessionDetailsModalProps) {
  const { logSessionCompletion, updateSessionStatus, getSessionLoads, loading } = useSessions();
  const { profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [athleteLogs, setAthleteLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"INFO" | "ROSTER" | "LAB_DATA">("INFO");
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [assignedCoachName, setAssignedCoachName] = useState<string | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localCoaches, setLocalCoaches] = useState<any[]>([]);
  const [localAthletes, setLocalAthletes] = useState<any[]>([]);
  const [athleteProfiles, setAthleteProfiles] = useState<Record<string, any>>({});

  // VL4 Lab Test State
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [testMethod, setTestMethod] = useState<string>("Running");
  const [temperature, setTemperature] = useState<string>("");
  const [inclinePercent, setInclinePercent] = useState<string>("");
  const [testerName, setTesterName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [restingLactate, setRestingLactate] = useState<string>("");
  const [restingHr, setRestingHr] = useState<string>("");

  interface StageRow {
    stage: number;
    speed_kmh: string;
    time: string;
    lactate_mmol: string;
    heart_rate: string;
  }
  const [stages, setStages] = useState<StageRow[]>([]);

  const [recoveryLactate, setRecoveryLactate] = useState<string>("");
  const [recoveryHr, setRecoveryHr] = useState<string>("");
  const [recoveryTime, setRecoveryTime] = useState<string>("");

  const [savingLabData, setSavingLabData] = useState<boolean>(false);
  const [savedLabTests, setSavedLabTests] = useState<Record<string, any>>({});
  const [loadingLabTests, setLoadingLabTests] = useState<boolean>(false);

  const supabase = createClient();
  const isStaff = profile?.role === 'superadmin' || profile?.role === 'staff';
  const isFacilityWide = session ? ["MEAL", "CURFEW", "LOGISTICS"].includes(session.session_type) : false;
  const canDelete = profile?.role === 'superadmin' || (profile?.role === 'staff' && !session?.is_curriculum);
  const canAccessLabData = profile?.role && ['superadmin', 'staff', 'coach', 'medical'].includes(profile.role);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && session) {
      loadSessionData();
      if (canAccessLabData) {
        loadLabTestData();
      }
      // Fetch coaches for edit modal
      supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("role", ["staff", "superadmin"])
        .then(({ data }: { data: any[] | null }) => { if (data) setLocalCoaches(data); });
      // Fetch athletes for edit modal
      supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .eq("role", "athlete")
        .order("first_name")
        .then(({ data }: { data: any[] | null }) => { if (data) setLocalAthletes(data); });
    }
  }, [isOpen, session, canAccessLabData]);

  const loadLabTestData = async () => {
    if (!session) return;
    setLoadingLabTests(true);
    try {
      const { data, error } = await supabase
        .from("vl4_lab_tests")
        .select("*")
        .eq("session_id", session.id);
      
      if (error) {
        if (error.code === '42P01') {
          console.warn("Table 'vl4_lab_tests' does not exist yet. Please run migration.");
        } else {
          throw error;
        }
      }
      
      if (data) {
        const testsMap: Record<string, any> = {};
        data.forEach((test: any) => {
          testsMap[test.athlete_id] = test;
        });
        setSavedLabTests(testsMap);
      }
    } catch (err: any) {
      console.error("Failed to load VL4 lab tests:", err.message);
    } finally {
      setLoadingLabTests(false);
    }
  };

  const handleAthleteChange = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
  };

  // Sync form inputs with selected athlete data from database, handling race conditions when database load completes
  useEffect(() => {
    if (!selectedAthleteId) {
      setTestMethod("Running");
      setTemperature("");
      setInclinePercent("");
      setTesterName(`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim());
      setNotes("");
      setRestingLactate("");
      setRestingHr("");
      setStages([]);
      setRecoveryLactate("");
      setRecoveryHr("");
      setRecoveryTime("");
      return;
    }

    const savedTest = savedLabTests[selectedAthleteId];
    if (savedTest) {
      setTestMethod(savedTest.test_method || "Running");
      setTemperature(savedTest.temperature !== null && savedTest.temperature !== undefined ? savedTest.temperature.toString() : "");
      setInclinePercent(savedTest.incline_percent !== null && savedTest.incline_percent !== undefined ? savedTest.incline_percent.toString() : "");
      setTesterName(savedTest.tester_name || "");
      setNotes(savedTest.notes || "");
      setRestingLactate(savedTest.resting_lactate !== null && savedTest.resting_lactate !== undefined ? savedTest.resting_lactate.toString() : "");
      setRestingHr(savedTest.resting_hr !== null && savedTest.resting_hr !== undefined ? savedTest.resting_hr.toString() : "");
      
      const parsedStages = Array.isArray(savedTest.stage_data) ? savedTest.stage_data.map((s: any) => ({
        stage: s.stage,
        speed_kmh: s.speed_kmh !== undefined && s.speed_kmh !== null ? s.speed_kmh.toString() : "",
        time: s.time || "",
        lactate_mmol: s.lactate_mmol !== undefined && s.lactate_mmol !== null ? s.lactate_mmol.toString() : "",
        heart_rate: s.heart_rate !== undefined && s.heart_rate !== null ? s.heart_rate.toString() : ""
      })) : [];
      setStages(parsedStages);

      setRecoveryLactate(savedTest.recovery_lactate !== null && savedTest.recovery_lactate !== undefined ? savedTest.recovery_lactate.toString() : "");
      setRecoveryHr(savedTest.recovery_hr !== null && savedTest.recovery_hr !== undefined ? savedTest.recovery_hr.toString() : "");
      setRecoveryTime(savedTest.recovery_time || "");
    } else {
      setTestMethod("Running");
      setTemperature("");
      setInclinePercent("");
      setTesterName(`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim());
      setNotes("");
      setRestingLactate("");
      setRestingHr("");
      setStages([]);
      setRecoveryLactate("");
      setRecoveryHr("");
      setRecoveryTime("");
    }
  }, [selectedAthleteId, savedLabTests, profile]);

  const handleAddStage = () => {
    setStages(prev => [
      ...prev,
      {
        stage: prev.length + 1,
        speed_kmh: "",
        time: "00:03:00",
        lactate_mmol: "",
        heart_rate: ""
      }
    ]);
  };

  const handleRemoveStage = (index: number) => {
    setStages(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((row, i) => ({
        ...row,
        stage: i + 1
      }));
    });
  };

  const handleUpdateStage = (index: number, field: keyof StageRow, value: string) => {
    setStages(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleSaveLabData = async () => {
    if (!session) return;
    if (!selectedAthleteId) {
      alert("Please select an athlete first.");
      return;
    }
    setSavingLabData(true);
    try {
      const formattedStages = stages.map(s => ({
        stage: s.stage,
        speed_kmh: s.speed_kmh ? parseFloat(s.speed_kmh) : null,
        time: s.time || null,
        lactate_mmol: s.lactate_mmol ? parseFloat(s.lactate_mmol) : null,
        heart_rate: s.heart_rate ? parseInt(s.heart_rate) : null
      }));

      const testData = {
        session_id: session.id,
        athlete_id: selectedAthleteId,
        test_date: new Date().toISOString().split('T')[0],
        test_method: testMethod,
        temperature: temperature ? parseFloat(temperature) : null,
        incline_percent: inclinePercent ? parseFloat(inclinePercent) : null,
        tester_name: testerName || null,
        notes: notes || null,
        resting_lactate: restingLactate ? parseFloat(restingLactate) : null,
        resting_hr: restingHr ? parseInt(restingHr) : null,
        stage_data: formattedStages,
        recovery_lactate: recoveryLactate ? parseFloat(recoveryLactate) : null,
        recovery_hr: recoveryHr ? parseInt(recoveryHr) : null,
        recovery_time: recoveryTime || null,
        created_by: profile?.id
      };

      const { data, error } = await supabase
        .from("vl4_lab_tests")
        .upsert(testData, { onConflict: "session_id,athlete_id" })
        .select()
        .single();

      if (error) throw error;

      setSavedLabTests(prev => ({
        ...prev,
        [selectedAthleteId]: data
      }));

      alert("VL4 Lab Test Data saved successfully!");
    } catch (err: any) {
      console.error("Failed to save lab data:", err);
      alert(`Error saving lab data: ${err.message}`);
    } finally {
      setSavingLabData(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'LAB_DATA' && !selectedAthleteId && session?.assigned_athletes && session.assigned_athletes.length > 0) {
      handleAthleteChange(session.assigned_athletes[0]);
    }
  }, [activeTab, selectedAthleteId, session]);

  const loadSessionData = async () => {
    if (!session) return;
    
    // Fetch creator's name
    if (session.assigned_by) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", session.assigned_by)
        .single();
      if (profileData) {
        setCreatorName(`${profileData.first_name || ""} ${profileData.last_name || ""}`.trim());
      } else {
        setCreatorName(null);
      }
    } else {
      setCreatorName(null);
    }

    // Fetch assigned coach's name
    if (session.coach_id) {
      const { data: coachData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", session.coach_id)
        .single();
      if (coachData) {
        setAssignedCoachName(`${coachData.first_name || ""} ${coachData.last_name || ""}`.trim());
      } else {
        setAssignedCoachName(null);
      }
    } else {
      setAssignedCoachName(null);
    }

    if (isFacilityWide) return;

    const { data } = await getSessionLoads(session.id);
    
    // Initialize logs for all assigned athletes if they don't exist
    const logs = (session.assigned_athletes || []).map(id => {
      const existing = data?.find((d: any) => d.athlete_id === id);
      return existing || {
        athlete_id: id,
        actual_load_au: session.target_load_au || 450,
        rpe: 5,
        attendance: 'PRESENT',
        notes: ''
      };
    });
    
    // Fetch athlete profiles to display names
    if (session.assigned_athletes && session.assigned_athletes.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", session.assigned_athletes);

      if (profilesData) {
        const profileMap = profilesData.reduce((acc: any, p: any) => {
          acc[p.id] = p;
          return acc;
        }, {});
        setAthleteProfiles(profileMap);
      }
    }

    setAthleteLogs(logs);
  };

  if (!mounted || !isOpen || !session) return null;

  const handleConfirmPayment = async () => {
    if (!session || !isStaff) return;
    setUpdatingPayment(true);
    try {
      const { error } = await supabase
        .from("training_sessions")
        .update({
          payment_status: 'CONFIRMED',
          confirmed_by_admin: true,
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: profile?.id
        })
        .eq("id", session.id);

      if (error) throw error;
      onClose();
    } catch (err: any) {
      alert(`Failed to confirm payment: ${err.message}`);
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!session || !canDelete) return;
    
    const confirmMessage = session.is_curriculum 
      ? "Are you sure you want to delete this curriculum session? This will remove it from the calendar."
      : "Are you sure you want to delete this training session? All bookings and loads will be removed.";
      
    if (!confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from("training_sessions")
        .delete()
        .eq("id", session.id);

      if (error) throw error;
      alert("Session deleted successfully.");
      onClose();
    } catch (err: any) {
      alert(`Failed to delete session: ${err.message}`);
    }
  };

  const handleUpdateLog = (athleteId: string, updates: any) => {
    if (!isStaff) return;
    setAthleteLogs(prev => prev.map(l => l.athlete_id === athleteId ? { ...l, ...updates } : l));
  };

  const handleComplete = async () => {
    if (!isStaff) return;
    const res = await logSessionCompletion(session.id, athleteLogs);
    if (res.success) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto py-20">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-bg-card border border-border-card rounded-[48px] overflow-hidden shadow-2xl transition-colors duration-300"
        >
          {/* Header */}
          <div className="p-8 border-b border-border-card/60 bg-gradient-to-r from-[#22c55e]/[0.03] to-transparent flex justify-between items-start">
             <div>
                <div className="flex items-center gap-3 mb-3">
                   <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                     session.status === 'IN_PROGRESS' ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30 animate-pulse' : 'bg-bg-input text-text-muted border-border-input'
                   }`}>
                      {session.status}
                   </span>
                   <span className="block text-[11px] font-sans font-medium text-text-secondary tracking-wide ml-1">{session.session_type} // {session.id.slice(0, 8)}</span>
                </div>
                <h2 className="font-display text-2xl text-text-primary tracking-wider uppercase mb-1.5">{session.title}</h2>
                <div className="flex items-center gap-4 text-text-muted text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><Calendar size={12} className="text-[#22c55e]" /> {session.scheduled_date}</div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[#22c55e]" /> 
                      {(() => {
                        const parts = (session.start_time || "09:00").split(":");
                        let h = parseInt(parts[0], 10);
                        const m = parseInt(parts[1] || "00", 10);
                        const dur = Number(session.duration_minutes) || 60;
                        const endMins = (h * 60 + m + dur) % 1440;
                        const eh = Math.floor(endMins / 60);
                        const em = endMins % 60;
                        const fmt = (hour: number, min: number) => {
                          const ampm = hour >= 12 ? "PM" : "AM";
                          const dh = hour % 12 || 12;
                          const dm = min.toString().padStart(2, "0");
                          return `${dh}:${dm} ${ampm}`;
                        };
                        return `${fmt(h, m)} - ${fmt(eh, em)} (${dur}m)`;
                      })()}
                    </div>
                    <div className="flex items-center gap-1.5"><MapPin size={12} className="text-[#22c55e]" /> {session.location || 'HQ FIELD'}</div>
                </div>
             </div>
              <div className="flex items-center gap-3">
                {isStaff && (
                   <button 
                     onClick={() => setIsEditModalOpen(true)}
                     title="Edit session"
                     className="p-3 rounded-full bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20 transition-all cursor-pointer"
                   >
                     <Edit2 size={16} />
                   </button>
                )}
                {canDelete && (
                   <button 
                     onClick={handleDeleteSession}
                     className="p-3 rounded-full bg-bg-input border border-border-input text-text-secondary hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
                   >
                     <Trash2 size={18} />
                   </button>
                )}
                <button onClick={onClose} className="p-3 rounded-full bg-bg-input border border-border-input text-text-secondary hover:text-text-primary transition-all cursor-pointer">
                   <X size={20} />
                </button>
             </div>
          </div>

          <div className="flex h-[450px]">
             {/* Tabs Sidebar */}
             {!isFacilityWide && (
                <div className="w-[100px] border-r border-border-card/60 flex flex-col items-center py-8 gap-6">
                   {[
                      { id: 'INFO', icon: <Activity size={20} />, label: 'INFO' },
                      { id: 'ROSTER', icon: <Users size={20} />, label: 'ROSTER' },
                      ...(canAccessLabData ? [{ id: 'LAB_DATA', icon: <FlaskConical size={20} />, label: 'LAB DATA' }] : [])
                   ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-col items-center gap-1.5 transition-all cursor-pointer ${activeTab === tab.id ? 'text-[#22c55e]' : 'text-text-secondary/60 hover:text-text-primary'}`}
                      >
                         {tab.icon}
                         <span className="text-[9px] font-black tracking-widest">{tab.label}</span>
                      </button>
                   ))}
                </div>
             )}

             {/* Content Area */}
             <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                {activeTab === 'INFO' || isFacilityWide ? (
                   <div className="space-y-12">
                      {isFacilityWide ? (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-8 bg-bg-secondary rounded-3xl border border-border-card/60">
                               <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">PROTOCOL CREATOR</div>
                               <div className="text-xl font-display text-[#22c55e] uppercase truncate">
                                  {creatorName || "SYSTEM CENTRAL"}
                               </div>
                               <div className="text-text-muted text-[8px] font-black uppercase mt-2">INITIALIZED BY COMMAND PROFILE</div>
                            </div>
                            <div className="p-8 bg-bg-secondary rounded-3xl border border-border-card/60">
                               <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">ASSIGNED COACH</div>
                               <div className="text-xl font-display text-sky-400 uppercase truncate">
                                  {assignedCoachName || "UNASSIGNED"}
                               </div>
                               <div className="text-text-muted text-[8px] font-black uppercase mt-2">LEAD COACH FOR PROTOCOL</div>
                            </div>
                            <div className="p-8 bg-bg-secondary rounded-3xl border border-border-card/60">
                               <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">INITIALIZED TIMESTAMP</div>
                               <div className="text-sm font-mono text-text-primary mt-1">
                                  {session.created_at ? format(new Date(session.created_at), "yyyy-MM-dd HH:mm") : "N/A"}
                                </div>
                               <div className="text-text-muted text-[8px] font-black uppercase mt-4">SYSTEM RECORD ENTRY TIME</div>
                            </div>
                         </div>
                      ) : session.is_external ? (
                         <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <div className="p-8 bg-bg-secondary rounded-3xl border border-border-card/60">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">EXTERNAL CLIENT</div>
                                  <div className="text-xl font-display text-[#22c55e] uppercase truncate">
                                     {session.external_player_name}
                                  </div>
                                  <div className="text-text-muted text-[8px] font-black uppercase mt-2">REGISTERED NAME</div>
                               </div>
                               <div className="p-8 bg-bg-secondary rounded-3xl border border-border-card/60">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">PHONE NUMBER</div>
                                  <div className="text-base font-mono text-text-primary truncate">
                                     {session.external_person_phone || 'N/A'}
                                  </div>
                                  <div className="text-text-muted text-[8px] font-black uppercase mt-2">CONTACT DIRECT LINE</div>
                                </div>
                               <div className="p-8 bg-bg-secondary rounded-3xl border border-border-card/60">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">EMAIL ADDRESS</div>
                                  <div className="text-base font-mono text-text-primary truncate">
                                     {session.external_person_email || 'N/A'}
                                  </div>
                                  <div className="text-text-muted text-[8px] font-black uppercase mt-2">CONTACT INBOX</div>
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <div className="p-8 bg-bg-secondary rounded-3xl border border-border-card/60">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">TRAINING PERIOD</div>
                                  <div className="text-xs font-bold text-text-primary uppercase mt-1">
                                     {session.training_start_date || 'N/A'} TO {session.training_end_date || 'N/A'}
                                  </div>
                                  <div className="text-text-muted text-[8px] font-black uppercase mt-4">CONTRACTED TIMELINE</div>
                               </div>
                               <div className="p-8 bg-bg-secondary rounded-3xl border border-border-card/60">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">PAYMENT STATUS</div>
                                  <div className="flex items-center gap-2 mt-1">
                                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                       session.payment_status === 'CONFIRMED' 
                                         ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                         : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                     }`}>
                                        {session.payment_status || 'PENDING'}
                                     </span>
                                  </div>
                                  <div className="text-text-muted text-[8px] font-black uppercase mt-4">FINANCIAL CLEARANCE</div>
                               </div>
                               <div className="p-8 bg-bg-secondary rounded-3xl border border-border-card/60">
                                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">PAYMENT NOTES</div>
                                  <div className="text-xs text-text-secondary italic truncate mt-1">
                                     {session.payment_notes || 'No notes specified.'}
                                  </div>
                                  <div className="text-text-muted text-[8px] font-black uppercase mt-4">TRANSACTION METADATA</div>
                               </div>
                            </div>

                            {session.payment_status !== 'CONFIRMED' && isStaff && (
                               <button
                                 onClick={handleConfirmPayment}
                                 disabled={updatingPayment}
                                 className="w-full py-4 bg-emerald-500 text-black font-display text-sm tracking-widest rounded-2xl hover:bg-white transition-all uppercase flex items-center justify-center gap-3 mt-4 cursor-pointer"
                               >
                                 {updatingPayment ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} CONFIRM PAYMENT & VALIDATE SESSION
                               </button>
                            )}
                         </div>
                      ) : (
                         <div className="grid grid-cols-2 gap-12">
                            <div className="p-8 bg-bg-secondary rounded-3xl border border-border-card/60">
                               <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">TARGET INTENSITY MATRIX</div>
                               <div className="text-4xl font-display text-[#22c55e]">{session.target_load_au} AU</div>
                               <div className="text-text-muted text-[8px] font-black uppercase mt-2">PROJECTED SQUAD ACCUMULATION</div>
                            </div>
                            <div className="p-8 bg-bg-secondary rounded-3xl border border-border-card/60">
                               <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">UNIT ASSIGNMENT</div>
                               <div className="text-4xl font-display text-text-primary">{(session.assigned_athletes || []).length} SUBJECTS</div>
                               <div className="text-text-muted text-[8px] font-black uppercase mt-2">OPERATIONAL UNIT SIZE</div>
                            </div>
                         </div>
                      )}

                      <div className="space-y-4">
                         <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">MISSION NOTES</div>
                         <p className="text-text-secondary text-sm leading-relaxed italic">"{session.notes || 'No operational modifications recorded for this session.'}"</p>
                      </div>

                      {!isFacilityWide && (
                         <div className="pt-12 flex gap-4">
                            {isStaff && session.status === 'SCHEDULED' && (
                              <button 
                                onClick={() => updateSessionStatus(session.id, 'IN_PROGRESS')}
                                className="flex-1 py-4 bg-[#22c55e] text-black font-display text-sm tracking-widest rounded-2xl hover:bg-white transition-all uppercase flex items-center justify-center gap-3 cursor-pointer"
                              >
                                 <Play size={18} fill="currentColor" /> MARK IN PROGRESS
                              </button>
                            )}
                            {isStaff && session.status === 'IN_PROGRESS' && (
                              <button 
                                onClick={() => setActiveTab('ROSTER')}
                                className="flex-1 py-4 bg-amber-500 text-black font-display text-sm tracking-widest rounded-2xl hover:bg-white transition-all uppercase flex items-center justify-center gap-3 cursor-pointer"
                              >
                                 <CheckCircle2 size={18} /> INITIALIZE COMPLETION LOG
                              </button>
                            )}
                         </div>
                      )}
                   </div>
                ) : activeTab === 'ROSTER' ? (
                   <div className="space-y-8">
                      <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
                         <div className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">OPERATIONAL AUDIT: DATA RETENTION REQUIRED FOR COMPLETION</div>
                         <button 
                           onClick={handleComplete}
                           disabled={loading}
                           className="px-6 py-2.5 bg-amber-500 text-black font-display text-[10px] tracking-widest rounded-xl hover:bg-white transition-all uppercase shadow-lg flex items-center gap-2 cursor-pointer"
                         >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} COMMIT LOADS & CLOSE
                         </button>
                      </div>

                      <div className="space-y-4">
                         {athleteLogs.map((log, i) => (
                           <div key={i} className="bg-bg-secondary border border-border-card/60 p-6 rounded-[24px] flex flex-wrap lg:flex-nowrap items-center gap-6 group">
                              <div className="flex items-center gap-3 shrink-0 w-[200px]">
                                 <div className="w-10 h-10 rounded-xl bg-bg-input border border-border-input flex items-center justify-center font-display shadow-xl uppercase overflow-hidden">
                                    {athleteProfiles[log.athlete_id]?.avatar_url ? (
                                       <img src={athleteProfiles[log.athlete_id].avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                       athleteProfiles[log.athlete_id]?.first_name?.slice(0, 2) || log.athlete_id.slice(0, 2)
                                    )}
                                 </div>
                                 <div className="text-text-primary font-bold text-xs uppercase tracking-wider truncate">
                                    {athleteProfiles[log.athlete_id] 
                                       ? `${athleteProfiles[log.athlete_id].first_name} ${athleteProfiles[log.athlete_id].last_name || ''}`
                                       : `SUBJECT ${log.athlete_id.slice(0, 8)}`}
                                 </div>
                              </div>

                              <div className="flex gap-1.5 p-1 bg-bg-primary rounded-xl border border-border-card shrink-0">
                                 {['PRESENT', 'ABSENT', 'LATE'].map(status => (
                                   <button 
                                     key={status}
                                     onClick={() => handleUpdateLog(log.athlete_id, { attendance: status })}
                                     className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all cursor-pointer ${
                                       log.attendance === status ? 'bg-[#22c55e] text-black' : 'text-text-muted hover:text-text-primary'
                                     }`}
                                   >
                                      {status}
                                   </button>
                                 ))}
                              </div>

                              <div className="flex-1 grid grid-cols-2 gap-6 items-center">
                                 <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">ACTUAL LOAD (AU)</label>
                                    <input 
                                      type="number"
                                      value={log.actual_load_au}
                                      onChange={e => handleUpdateLog(log.athlete_id, { actual_load_au: parseInt(e.target.value) })}
                                      className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                                    />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">RPE <span className="text-[#22c55e]">{log.rpe}/10</span></label>
                                    <input 
                                      type="range"
                                      min="1"
                                      max="10"
                                      value={log.rpe}
                                      onChange={e => handleUpdateLog(log.athlete_id, { rpe: parseInt(e.target.value) })}
                                      className="w-full h-1.5 bg-bg-input rounded-lg appearance-none cursor-pointer accent-[#22c55e] mt-2 block"
                                    />
                                 </div>
                              </div>
                           </div>
                         ))}
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-8 animate-slide-up">
                       {/* Section 1 — Test Setup */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-bg-secondary border border-border-card/60 p-6 rounded-[24px]">
                          <div className="space-y-1.5 col-span-1 md:col-span-2">
                             <h3 className="text-sm font-display text-accent-green uppercase tracking-wider mb-2">Section 1 — Test Setup</h3>
                          </div>
                          <div className="space-y-1.5">
                             <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Select Athlete</label>
                             <select
                               value={selectedAthleteId}
                               onChange={e => handleAthleteChange(e.target.value)}
                               className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                             >
                                <option value="">Select an athlete...</option>
                                {(session.assigned_athletes || []).map(id => (
                                  <option key={id} value={id}>
                                     {athleteProfiles[id] 
                                        ? `${athleteProfiles[id].first_name} ${athleteProfiles[id].last_name || ''}`
                                        : `SUBJECT ${id.slice(0, 8)}`}
                                  </option>
                                ))}
                             </select>
                          </div>
                          <div className="space-y-1.5">
                             <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Test Method</label>
                             <select
                               value={testMethod}
                               onChange={e => setTestMethod(e.target.value)}
                               className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                             >
                                <option value="Running">Running</option>
                                <option value="Cycling">Cycling</option>
                                <option value="Swimming">Swimming</option>
                             </select>
                          </div>
                          <div className="space-y-1.5">
                             <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Temperature (°C)</label>
                             <input
                               type="number"
                               step="0.1"
                               value={temperature}
                               onChange={e => setTemperature(e.target.value)}
                               placeholder="e.g. 21.5"
                               className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Incline %</label>
                             <input
                               type="number"
                               step="0.1"
                               value={inclinePercent}
                               onChange={e => setInclinePercent(e.target.value)}
                               placeholder="e.g. 1.0"
                               className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                             />
                          </div>
                          <div className="space-y-1.5 col-span-1 md:col-span-2">
                             <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Tester/Coach Name</label>
                             <input
                               type="text"
                               value={testerName}
                               onChange={e => setTesterName(e.target.value)}
                               placeholder="Tester name"
                               className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                             />
                          </div>
                          <div className="space-y-1.5 col-span-1 md:col-span-2">
                             <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Notes</label>
                             <textarea
                               value={notes}
                               onChange={e => setNotes(e.target.value)}
                               placeholder="Additional observations..."
                               rows={3}
                               className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold resize-none"
                             />
                          </div>
                       </div>

                       {/* Section 2 — Resting Values */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-bg-secondary border border-border-card/60 p-6 rounded-[24px]">
                          <div className="space-y-1.5 col-span-1 md:col-span-2">
                             <h3 className="text-sm font-display text-accent-green uppercase tracking-wider mb-2">Section 2 — Resting Values</h3>
                          </div>
                          <div className="space-y-1.5">
                             <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Resting Lactate (mmol/l)</label>
                             <input
                               type="number"
                               step="0.01"
                               value={restingLactate}
                               onChange={e => setRestingLactate(e.target.value)}
                               placeholder="e.g. 1.20"
                               className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Resting Heart Rate (bpm)</label>
                             <input
                               type="number"
                               value={restingHr}
                               onChange={e => setRestingHr(e.target.value)}
                               placeholder="e.g. 60"
                               className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                             />
                          </div>
                       </div>

                       {/* Section 3 — Stage Test Data */}
                       <div className="bg-bg-secondary border border-border-card/60 p-6 rounded-[24px] space-y-4">
                          <div className="flex justify-between items-center">
                             <h3 className="text-sm font-display text-accent-green uppercase tracking-wider">Section 3 — Stage Test Data</h3>
                             <button
                               type="button"
                               onClick={handleAddStage}
                               className="px-4 py-2 border border-accent-green text-accent-green hover:bg-accent-green hover:text-black font-display text-[10px] tracking-widest rounded-xl transition-all uppercase flex items-center gap-1.5 cursor-pointer"
                             >
                                <Plus size={12} /> ADD STAGE
                             </button>
                          </div>
                          
                          <div className="overflow-x-auto">
                             <table className="w-full border-collapse">
                                <thead>
                                   <tr className="border-b border-border-input text-left text-[9px] font-black text-text-muted uppercase tracking-widest">
                                      <th className="pb-3 pl-2 w-16">Stage</th>
                                      <th className="pb-3 w-32">Speed (km/h)</th>
                                      <th className="pb-3 w-32">Time</th>
                                      <th className="pb-3 w-32">Lactate (mmol/l)</th>
                                      <th className="pb-3 w-32">HR (bpm)</th>
                                      <th className="pb-3 w-12 text-center"></th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-border-card">
                                   {stages.length === 0 ? (
                                      <tr>
                                         <td colSpan={6} className="py-6 text-center text-xs text-text-secondary italic">
                                            No stages added yet. Click "+ ADD STAGE" to begin.
                                         </td>
                                      </tr>
                                   ) : (
                                      stages.map((row, index) => (
                                         <tr key={index} className="align-middle">
                                            <td className="py-3 pl-2 text-xs font-mono text-text-primary font-bold">{row.stage}</td>
                                            <td className="py-3 pr-4">
                                               <input
                                                 type="number"
                                                 step="0.1"
                                                 value={row.speed_kmh}
                                                 onChange={e => handleUpdateStage(index, 'speed_kmh', e.target.value)}
                                                 placeholder="e.g. 10.0"
                                                 className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-1.5 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                                               />
                                            </td>
                                            <td className="py-3 pr-4">
                                               <input
                                                 type="text"
                                                 value={row.time}
                                                 onChange={e => handleUpdateStage(index, 'time', e.target.value)}
                                                 placeholder="00:03:00"
                                                 className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-1.5 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold font-mono"
                                               />
                                            </td>
                                            <td className="py-3 pr-4">
                                               <input
                                                 type="number"
                                                 step="0.01"
                                                 value={row.lactate_mmol}
                                                 onChange={e => handleUpdateStage(index, 'lactate_mmol', e.target.value)}
                                                 placeholder="e.g. 2.10"
                                                 className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-1.5 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                                               />
                                            </td>
                                            <td className="py-3 pr-4">
                                               <input
                                                 type="number"
                                                 value={row.heart_rate}
                                                 onChange={e => handleUpdateStage(index, 'heart_rate', e.target.value)}
                                                 placeholder="e.g. 152"
                                                 className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-1.5 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                                               />
                                            </td>
                                            <td className="py-3 text-center">
                                               <button
                                                 type="button"
                                                 onClick={() => handleRemoveStage(index)}
                                                 className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                               >
                                                  <Trash2 size={14} />
                                               </button>
                                            </td>
                                         </tr>
                                      ))
                                   )}
                                </tbody>
                             </table>
                          </div>
                       </div>

                       {/* Section 4 — Recovery Data */}
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-bg-secondary border border-border-card/60 p-6 rounded-[24px]">
                          <div className="space-y-1.5 col-span-1 md:col-span-3">
                             <h3 className="text-sm font-display text-accent-green uppercase tracking-wider mb-2">Section 4 — Recovery Data</h3>
                          </div>
                          <div className="space-y-1.5">
                             <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Recovery Lactate (mmol/l)</label>
                             <input
                               type="number"
                               step="0.01"
                               value={recoveryLactate}
                               onChange={e => setRecoveryLactate(e.target.value)}
                               placeholder="e.g. 4.50"
                               className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Recovery Heart Rate (bpm)</label>
                             <input
                               type="number"
                               value={recoveryHr}
                               onChange={e => setRecoveryHr(e.target.value)}
                               placeholder="e.g. 110"
                               className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Recovery Time (hh:mm:ss)</label>
                             <input
                               type="text"
                               value={recoveryTime}
                               onChange={e => setRecoveryTime(e.target.value)}
                               placeholder="00:05:00"
                               className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-semibold font-mono"
                             />
                          </div>
                       </div>

                       {/* Save Button */}
                       <button
                         type="button"
                         onClick={handleSaveLabData}
                         disabled={savingLabData}
                         className="w-full py-4 bg-accent-green text-black font-display text-sm tracking-widest rounded-2xl hover:bg-white transition-all uppercase flex items-center justify-center gap-3 shadow-xl font-button cursor-pointer"
                       >
                          {savingLabData ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} SAVE LAB DATA
                       </button>
                    </div>
                 )}
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      <EditSessionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => { setIsEditModalOpen(false); onClose(); }}
        session={session}
        coaches={localCoaches}
        athletes={localAthletes}
      />
    </>
  );
}
