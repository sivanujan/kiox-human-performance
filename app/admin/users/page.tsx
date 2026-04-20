"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Filter, 
  ChevronDown, 
  Loader2,
  Trophy,
  Activity,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  Zap,
  Target,
  User,
  ExternalLink,
  History,
  ShieldAlert
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import InviteStaffModal from "@/components/modals/InviteStaffModal";
import UserProfileModal from "@/components/modals/UserProfileModal";
import InjuryLogModal from "@/components/modals/InjuryLogModal";
import Avatar from "@/components/ui/Avatar";

const ROLES = ['athlete', 'staff', 'superadmin'];
const STATUSES = ['pending', 'approved', 'rejected', 'active'];

export default function UserInventory() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isInjuryModalOpen, setIsInjuryModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedViewProfile, setSelectedViewProfile] = useState<any | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [assessmentDate, setAssessmentDate] = useState("");
  const [assessmentType, setAssessmentType] = useState("Initial Evaluation");
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && profile?.role === 'superadmin') {
        fetchProfiles();
        fetchTeams();
      } else if (!user || profile) {
        setLoading(false);
      }
    }

    const handleRefresh = () => {
        fetchProfiles();
        fetchTeams();
    };
    window.addEventListener('refresh-users', handleRefresh);
    return () => window.removeEventListener('refresh-users', handleRefresh);
  }, [user, profile, authLoading]);

  const fetchProfiles = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (!data.error) setProfiles(data);
    
    // Also fetch programs for the assignment modal
    const progRes = await fetch("/api/admin/programs");
    const progData = await progRes.json();
    if (!progData.error) setPrograms(progData);
    
    setLoading(false);
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      const data = await res.json();
      if (!data.error) setTeams(data);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const res = await fetch("/api/admin/staff/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    
    if (res.ok) {
      alert("Password reset email sent to tactical agent.");
    } else {
      const err = await res.json();
      alert(`Reset Failed: ${err.error}`);
    }
  };

  const handleAssignProgram = async () => {
    if (!selectedAthlete || !selectedProgramId) return;
    setActionLoading(true);
    const res = await fetch("/api/admin/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedAthlete.id,
        programId: selectedProgramId
      })
    });
    
    if (res.ok) {
      setIsActionModalOpen(false);
      setSelectedProgramId("");
    } else {
      const data = await res.json();
      alert(data.error || "Assignment Failed");
    }
    setActionLoading(false);
  };

  const handleBookAssessment = async () => {
    if (!selectedAthlete || !assessmentDate) return;
    setActionLoading(true);
    const res = await fetch("/api/admin/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedAthlete.id,
        assessmentDate,
        assessmentType,
        staffId: user?.id
      })
    });
    
    if (res.ok) {
      setIsActionModalOpen(false);
      setAssessmentDate("");
    } else {
      const data = await res.json();
      alert(data.error || "Booking Failed");
    }
    setActionLoading(false);
  };

  const handleVerifyEmail = async (userId: string) => {
    if (!confirm("Are you sure you want to manually verify this user's email? This will allow them to bypass the email confirmation step.")) return;
    
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, confirmEmail: true }),
    });
    
    if (res.ok) {
       alert("User email verified successfully.");
       fetchProfiles();
    } else {
       const err = await res.json();
       alert(`Verification Error: ${err.error}`);
    }
  };

  const handleUpdate = async (userId: string, updates: any) => {
    setUpdatingId(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...updates })
    });
    
    if (res.ok) {
      fetchProfiles();
    }
    setUpdatingId(null);
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = (p.first_name + " " + p.last_name + " " + p.username).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
     return (
       <div className="flex items-center justify-center p-20">
         <Loader2 className="text-[#22c55e] animate-spin" size={48} />
       </div>
     );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-6 md:pb-8 border-b border-white/5">
        <div className="flex items-end justify-between w-full lg:w-auto gap-12">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Users className="text-[#22c55e] w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-label text-[#22c55e] font-bold tracking-[0.2em] uppercase text-[10px] md:text-sm">Registry Management</span>
                </div>
                <h1 className="font-display text-4xl md:text-6xl text-white font-black uppercase tracking-tight">Inventory</h1>
            </div>
            
            <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="hidden lg:flex items-center gap-2 px-8 py-4 bg-[#22c55e] text-black font-button rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] active-scale"
            >
                <Zap size={14} /> Invite Agent
            </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter Database..."
              className="w-full sm:w-64 bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-3 md:py-4 text-xs md:text-sm text-white focus:border-[#22c55e] outline-none transition-all font-label placeholder:text-gray-500"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto bg-[#111] border border-white/10 rounded-xl px-6 py-3 md:py-4 text-xs md:text-sm text-white focus:border-[#22c55e] outline-none font-label cursor-pointer appearance-none text-center sm:text-left"
          >
            <option value="all">Every Role</option>
            <option value="athlete">Athletes</option>
            <option value="staff">Staff</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
      </div>

      <button 
        onClick={() => setIsInviteModalOpen(true)}
        className="lg:hidden w-full flex items-center justify-center gap-2 px-8 py-4 bg-[#22c55e] text-black font-button rounded-xl hover:bg-white transition-all active-scale"
      >
        <Zap size={14} /> Invite Tactical Agent
      </button>

      {/* Table Management View - Desktop Only */}
      <div className="hidden lg:block bg-[#111] border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#22c55e]/5 border-b border-[#22c55e]/10">
                <th className="px-6 py-5 font-display text-gray-400 text-[10px] w-[25%] text-left font-bold tracking-widest uppercase">Agent Identity</th>
                <th className="px-4 py-5 font-display text-gray-400 text-[10px] text-center font-bold tracking-widest uppercase">Governance</th>
                <th className="px-4 py-5 font-display text-gray-400 text-[10px] text-center font-bold tracking-widest uppercase">Assigned Unit</th>
                <th className="px-4 py-5 font-display text-gray-400 text-[10px] text-center font-bold tracking-widest uppercase">System Status</th>
                <th className="px-6 py-5 font-display text-gray-400 text-[10px] text-right w-[20%] font-bold tracking-widest uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filteredProfiles.map((user_profile) => (
                  <motion.tr 
                    key={user_profile.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="transition-colors hover:bg-white/[0.01] group"
                  >
                    {/* Athlete Identity */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                           <Avatar 
                             src={user_profile.avatar_url}
                             name={`${user_profile.first_name} ${user_profile.last_name}`}
                             role={user_profile.role}
                             size="md"
                           />
                           {updatingId === user_profile.id && (
                             <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                               <Loader2 size={12} className="animate-spin text-[#22c55e]" />
                             </div>
                           )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white uppercase group-hover:text-[#22c55e] transition-colors truncate">{user_profile.first_name} {user_profile.last_name}</p>
                          <p className="font-label text-gray-500 text-[10px] font-bold truncate">@{user_profile.username || 'not_set'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Governance */}
                    <td className="px-4 py-5">
                      <div className="flex justify-center flex-wrap gap-1">
                        {ROLES.map(role => (
                          <button 
                            key={role}
                            onClick={() => handleUpdate(user_profile.id, { role })}
                            className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${user_profile.role === role ? 'bg-[#22c55e] text-black border-[#22c55e]' : 'bg-black/20 text-gray-500 border-white/5 hover:border-[#22c55e]/30'}`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Team/Unit Column */}
                    <td className="px-4 py-5">
                      <div className="flex justify-center">
                           <select
                               value={user_profile.team_id || ""}
                               onChange={(e) => handleUpdate(user_profile.id, { team_id: e.target.value === "" ? null : e.target.value })}
                               className="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 font-label text-[10px] text-gray-500 font-bold focus:border-[#22c55e] outline-none transition-all cursor-pointer w-full max-w-[120px] uppercase tracking-widest"
                           >
                               <option value="">NO_UNIT</option>
                               {teams.map(t => (
                                   <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                               ))}
                           </select>
                      </div>
                    </td>

                    {/* System Status toggles */}
                    <td className="px-4 py-5">
                      <div className="flex justify-center flex-wrap gap-1">
                        {STATUSES.map(status => (
                          <button 
                            key={status}
                            onClick={() => handleUpdate(user_profile.id, { status })}
                            className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${user_profile.status === status ? 'bg-[#22c55e] text-black border-[#22c55e]' : 'bg-black/20 text-gray-500 border-white/5 hover:border-[#22c55e]/30'}`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Actions column */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => {
                              setSelectedViewProfile(user_profile);
                              setIsViewModalOpen(true);
                            }}
                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:bg-white hover:text-black transition-all active-scale"
                          title="View Profile"
                        >
                          <ExternalLink size={14} />
                        </button>

                        <button 
                          onClick={() => handleVerifyEmail(user_profile.id)}
                          className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl text-blue-500/60 hover:bg-blue-500 hover:text-black transition-all active-scale"
                          title="Verify Email"
                        >
                          <ShieldCheck size={14} />
                        </button>

                        {user_profile.role === 'staff' && (
                          <button 
                            onClick={() => handleResetPassword(user_profile.id)}
                            className="p-2.5 bg-red-400/5 border border-red-400/20 rounded-xl text-red-400/60 hover:bg-red-400 hover:text-black transition-all active-scale"
                            title="Reset Password"
                          >
                            <Zap size={14} />
                          </button>
                        )}

                        {user_profile.role === 'athlete' ? (
                          <button 
                            onClick={() => {
                              setSelectedAthlete(user_profile);
                              setIsActionModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-[#22c55e]/5 border border-[#22c55e]/30 rounded-xl text-[#22c55e] font-label text-[10px] font-black uppercase tracking-widest hover:bg-[#22c55e] hover:text-black transition-all active-scale"
                          >
                            <Layers size={14} /> <span>PROTO</span>
                          </button>
                        ) : (
                          <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-700 font-label text-[10px] font-black tracking-widest text-center min-w-[70px] uppercase">Ops</div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredProfiles.map((user_profile) => (
          <div key={user_profile.id} className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar 
                    src={user_profile.avatar_url}
                    name={`${user_profile.first_name} ${user_profile.last_name}`}
                    role={user_profile.role}
                    size="md"
                  />
                  <div>
                    <p className="text-sm font-bold text-white uppercase">{user_profile.first_name} {user_profile.last_name}</p>
                    <p className="font-label text-gray-500 text-[10px] font-bold">@{user_profile.username || 'not_set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => { setSelectedViewProfile(user_profile); setIsViewModalOpen(true); }}
                      className="p-2 bg-white/5 rounded-lg text-white/40"
                   >
                     <ExternalLink size={14} />
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Core Governance</p>
                   <select 
                      value={user_profile.role}
                      onChange={(e) => handleUpdate(user_profile.id, { role: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] font-black text-[#22c55e] uppercase tracking-widest"
                   >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">System Status</p>
                   <select 
                      value={user_profile.status}
                      onChange={(e) => handleUpdate(user_profile.id, { status: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] font-black text-[#22c55e] uppercase tracking-widest"
                   >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
             </div>

             <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex gap-2">
                   <button 
                    onClick={() => handleVerifyEmail(user_profile.id)}
                    className="p-2 bg-blue-500/10 rounded-lg text-blue-500"
                   >
                     <ShieldCheck size={14} />
                   </button>
                   {user_profile.role === 'staff' && (
                     <button 
                      onClick={() => handleResetPassword(user_profile.id)}
                      className="p-2 bg-red-400/10 rounded-lg text-red-400"
                     >
                       <Zap size={14} />
                     </button>
                   )}
                </div>
                {user_profile.role === 'athlete' ? (
                  <button 
                    onClick={() => { setSelectedAthlete(user_profile); setIsActionModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-black font-black text-[10px] rounded-xl uppercase tracking-widest active-scale"
                  >
                    <Layers size={14} /> Protocol
                  </button>
                ) : (
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">System Level</span>
                )}
             </div>
          </div>
        ))}
        {filteredProfiles.length === 0 && (
          <div className="py-20 text-center text-gray-600 font-black uppercase text-xs tracking-widest border-2 border-dashed border-white/5 rounded-3xl">
            No Agents Found In Database
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <InviteStaffModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => fetchProfiles()}
      />

      {/* Action Modal */}
      <AnimatePresence>
        {isActionModalOpen && selectedAthlete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:pb-24 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActionModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Zap size={120} />
              </div>
              
              <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-8 text-left">
                  <div>
                    <h3 className="text-[10px] font-black text-[#22c55e] uppercase tracking-[3px] mb-2">Protocol Configuration</h3>
                    <p className="text-xl font-bold text-white uppercase">{selectedAthlete.first_name} {selectedAthlete.last_name}</p>
                  </div>
                  <button onClick={() => setIsActionModalOpen(false)} className="text-gray-500 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-widest bg-white/5 px-3 py-1 rounded-full">Close</button>
                </div>

                <div className="space-y-10 text-left">
                  {/* Assign Program */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white/40">
                      <Layers size={14} className="text-[#22c55e]" />
                      <span className="text-[9px] font-black uppercase tracking-[2px]">Active Training Protocol</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                      <select 
                        value={selectedProgramId}
                        onChange={e => setSelectedProgramId(e.target.value)}
                        className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none uppercase font-bold"
                      >
                        <option value="">Select Architecture...</option>
                        {programs.map(p => (
                          <option key={p.id} value={p.id}>{p.title} ({p.duration})</option>
                        ))}
                      </select>
                      <button 
                        disabled={actionLoading || !selectedProgramId}
                        onClick={handleAssignProgram}
                        className="bg-[#22c55e] text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] hover:bg-[#4ade80] transition-all disabled:opacity-30"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={14} /> : "Initialize"}
                      </button>
                    </div>

                  {/* Book Assessment */}
                  <div className="space-y-4 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-2 text-white/40">
                      <Target size={14} className="text-[#22c55e]" />
                      <span className="text-[9px] font-black uppercase tracking-[2px]">Performance Evaluation</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select 
                        value={assessmentType}
                        onChange={e => setAssessmentType(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none uppercase font-bold"
                      >
                        <option value="Initial Evaluation">Initial Evaluation</option>
                        <option value="Monthly Progress">Monthly Progress</option>
                        <option value="Advanced Biometrics">Advanced Biometrics</option>
                        <option value="Capacities Test">Capacities Test</option>
                      </select>
                      <input 
                        type="datetime-local"
                        value={assessmentDate}
                        onChange={e => setAssessmentDate(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none font-bold"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <button 
                      disabled={actionLoading || !assessmentDate}
                      onClick={handleBookAssessment}
                      className="w-full bg-white text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-[2px] hover:bg-[#22c55e] transition-all disabled:opacity-30 text-center"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={14} /> : "Schedule Evaluation Protocol"}
                    </button>
                  </div>
                  </div>

                  {/* Log Injury Shortcut */}
                  <div className="pt-8 border-t border-white/5">
                    <button 
                      onClick={() => {
                        setIsActionModalOpen(false);
                        setIsInjuryModalOpen(true);
                      }}
                      className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-[3px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 active-scale"
                    >
                      <ShieldAlert size={16} /> Log Injury / Recovery
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Detail Modal */}
      <UserProfileModal 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        user_profile={selectedViewProfile}
      />

      {/* Injury Log Modal */}
      {selectedAthlete && (
        <InjuryLogModal 
          isOpen={isInjuryModalOpen}
          onClose={() => setIsInjuryModalOpen(false)}
          athleteId={selectedAthlete.id}
          athleteName={`${selectedAthlete.first_name} ${selectedAthlete.last_name}`}
          onSuccess={() => fetchProfiles()}
        />
      )}
    </div>
  );
}
