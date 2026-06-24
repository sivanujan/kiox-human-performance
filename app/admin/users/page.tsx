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
  ShieldAlert,
  ArrowUpDown,
  Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import InviteStaffModal from "@/components/modals/InviteStaffModal";
import UserProfileModal from "@/components/modals/UserProfileModal";
import InjuryLogModal from "@/components/modals/InjuryLogModal";
import Avatar from "@/components/ui/Avatar";

const ROLES = ['athlete', 'staff', 'superadmin', 'medical', 'parent'];
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
  const [enrollmentRequests, setEnrollmentRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');

  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && (profile?.role === 'superadmin' || profile?.role === 'staff')) {
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
    
    // Fetch programs and filter based on role
    const progRes = await fetch("/api/admin/programs");
    const progData = await progRes.json();
    if (!progData.error) {
      if (profile?.role === 'superadmin') {
        setPrograms(progData);
      } else {
        setPrograms(progData.filter((p: any) => p.coach_id === user?.id));
      }
    }

    // Fetch enrollment requests
    const enrollRes = await fetch("/api/admin/enrollments");
    const enrollData = await enrollRes.json();
    if (!enrollData.error) {
      setEnrollmentRequests(enrollData.filter((e: any) => e.payment_status === 'pending' || e.approval_status === 'requested'));
    }
    
    setLoading(false);
  };

  const handleEnrollmentAction = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch("/api/admin/enrollments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    });
    
    if (res.ok) {
      fetchProfiles();
    } else {
      const err = await res.json();
      alert(err.error);
    }
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

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to decommission agent ${userName}? This action is permanent and removes all profile history.`)) return;
    if (!confirm(`WARNING: This will permanently delete user credentials, bookings, and profiles for ${userName}. Confirm one last time to proceed.`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Agent decommissioned successfully.");
        fetchProfiles();
      } else {
        const err = await res.json();
        alert(`Decommissioning Error: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Decommissioning Error: ${err.message}`);
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
         <Loader2 className="text-accent-green animate-spin" size={48} />
       </div>
     );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-6 md:pb-8 border-b border-border-primary/50">
        <div className="flex items-end justify-between w-full lg:w-auto gap-12">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Users className="text-accent-green w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-label text-accent-green font-bold tracking-[0.2em] uppercase text-[10px] md:text-sm">Registry Management</span>
                </div>
                <h1 className="font-display text-4xl md:text-6xl text-text-primary font-black uppercase tracking-tight">Inventory</h1>
            </div>
            
            {profile?.role === 'superadmin' && (
              <button 
                  onClick={() => setIsInviteModalOpen(true)}
                  className="hidden lg:flex items-center gap-2 px-8 py-4 bg-bg-button-primary text-text-on-green font-button rounded-xl hover:bg-accent-green-dim transition-all active-scale shadow-lg"
              >
                  <Zap size={14} /> Invite Agent
              </button>
            )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {activeTab === 'inventory' && (
            <>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter Database..."
                  className="w-full sm:w-64 bg-bg-input border border-border-input hover:border-border-active transition-colors rounded-xl pl-12 pr-4 py-3 md:py-4 text-xs md:text-sm text-text-primary focus:border-accent-green outline-none font-label placeholder:text-text-muted/65"
                />
              </div>
              <select 
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="w-full sm:w-auto bg-bg-input border border-border-input hover:border-border-active transition-colors rounded-xl px-6 py-3 md:py-4 text-xs md:text-sm text-text-primary focus:border-accent-green outline-none font-label cursor-pointer appearance-none text-center sm:text-left"
              >
                <option value="all">Every Role</option>
                <option value="athlete">Athletes</option>
                <option value="staff">Staff</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-border-primary/30 pb-1">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`pb-4 px-4 text-[10px] font-black uppercase tracking-[2px] transition-all relative ${activeTab === 'inventory' ? 'text-accent-green' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Agent Inventory
          {activeTab === 'inventory' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-green" />}
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`pb-4 px-4 text-[10px] font-black uppercase tracking-[2px] transition-all relative ${activeTab === 'requests' ? 'text-accent-green' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Protocol Requests
          {enrollmentRequests.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-bg-button-primary text-text-on-green text-[8px] rounded-full">{enrollmentRequests.length}</span>
          )}
          {activeTab === 'requests' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-green" />}
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="lg:hidden w-full flex items-center justify-center gap-2 px-8 py-4 bg-bg-button-primary text-text-on-green font-button rounded-xl hover:bg-accent-green-dim transition-all active-scale"
          >
            <Zap size={14} /> Invite Tactical Agent
          </button>

      {/* Table Management View - Desktop Only */}
      <div className="hidden lg:block bg-bg-card border border-border-card rounded-3xl overflow-hidden relative shadow-2xl">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-secondary border-b border-border-primary/50">
                <th className="px-6 py-5 font-display text-text-secondary text-[10px] w-[25%] text-left font-bold tracking-widest uppercase cursor-pointer select-none hover:text-text-primary transition-colors">
                  <div className="flex items-center gap-1.5">
                    Agent Identity
                    <ArrowUpDown size={10} className="text-accent-green opacity-70" />
                  </div>
                </th>
                <th className="px-4 py-5 font-display text-text-secondary text-[10px] text-center font-bold tracking-widest uppercase">Governance</th>
                <th className="px-4 py-5 font-display text-text-secondary text-[10px] text-center font-bold tracking-widest uppercase min-w-[170px]">Assigned Unit</th>
                <th className="px-4 py-5 font-display text-text-secondary text-[10px] text-center font-bold tracking-widest uppercase cursor-pointer select-none hover:text-text-primary transition-colors">
                  <div className="flex items-center justify-center gap-1.5">
                    System Status
                    <ArrowUpDown size={10} className="text-accent-green opacity-70" />
                  </div>
                </th>
                <th className="px-6 py-5 font-display text-text-secondary text-[10px] text-right w-[20%] font-bold tracking-widest uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filteredProfiles.map((user_profile, index) => {
                  const getStatusStyles = (status: string) => {
                    switch (status) {
                      case 'pending':
                        return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
                      case 'approved':
                        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
                      case 'rejected':
                        return 'bg-red-500/10 text-red-500 border-red-500/30';
                      case 'active':
                      default:
                        return 'bg-accent-green/10 text-accent-green border-accent-green/30';
                    }
                  };

                  return (
                    <motion.tr 
                      key={user_profile.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`transition-colors group hover:bg-bg-card-hover ${index % 2 === 0 ? 'bg-bg-card' : 'bg-bg-secondary/60'}`}
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
                               <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                 <Loader2 size={12} className="animate-spin text-accent-green" />
                                </div>
                             )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-text-primary uppercase group-hover:text-accent-green transition-colors truncate">{user_profile.first_name} {user_profile.last_name}</p>
                            <p className="font-label text-text-secondary text-[10px] font-bold truncate">@{user_profile.username || 'not_set'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Governance */}
                      <td className="px-4 py-5">
                        <div className="flex justify-center flex-wrap gap-1.5">
                          {ROLES.map(role => (
                            <button 
                              key={role}
                              onClick={() => handleUpdate(user_profile.id, { role })}
                              className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${user_profile.role === role ? 'bg-accent-green/15 text-accent-green border-accent-green/30 font-black' : 'bg-transparent text-text-muted border-transparent hover:text-text-secondary font-normal'}`}
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
                                  className="bg-bg-input border border-border-input hover:border-border-active rounded-lg px-3 py-1.5 font-label text-[10px] text-text-secondary font-bold focus:border-accent-green outline-none transition-all cursor-pointer w-full max-w-[150px] uppercase tracking-widest no-custom-bg"
                              >
                                  <option value="" className="bg-bg-card text-text-primary">NO_UNIT</option>
                                  {teams.map(t => (
                                      <option key={t.id} value={t.id} className="bg-bg-card text-text-primary">{t.name.toUpperCase()}</option>
                                  ))}
                              </select>
                        </div>
                      </td>

                      {/* System Status toggles */}
                      <td className="px-4 py-5 text-center">
                        <div className="flex justify-center">
                          {profile?.role === 'superadmin' ? (
                            <div className="relative inline-block">
                              <select
                                value={user_profile.status}
                                onChange={(e) => handleUpdate(user_profile.id, { status: e.target.value })}
                                className={`pl-3 pr-8 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border focus:outline-none cursor-pointer appearance-none text-center no-custom-bg ${getStatusStyles(user_profile.status)}`}
                              >
                                {STATUSES.map(status => (
                                  <option key={status} value={status} className="bg-bg-card text-text-primary">
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={8} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                            </div>
                          ) : (
                            <span className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border ${getStatusStyles(user_profile.status)}`}>
                               {user_profile.status}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions column */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Profile */}
                          <div className="relative group">
                            <button 
                              onClick={() => {
                                setSelectedViewProfile(user_profile);
                                setIsViewModalOpen(true);
                              }}
                              className="w-10 h-10 bg-bg-secondary border border-border-primary/50 rounded-xl text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition-all flex items-center justify-center active-scale"
                            >
                              <ExternalLink size={14} />
                            </button>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-bg-card border border-border-primary text-[8px] font-black uppercase tracking-widest text-text-primary rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                              View Profile
                            </span>
                          </div>

                          {/* Verify Email */}
                          <div className="relative group">
                            <button 
                              onClick={() => handleVerifyEmail(user_profile.id)}
                              className="w-10 h-10 bg-blue-500/5 border border-blue-500/20 rounded-xl text-blue-500 hover:bg-blue-500 hover:text-text-on-green transition-all flex items-center justify-center active-scale"
                            >
                              <ShieldCheck size={14} />
                            </button>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-bg-card border border-border-primary text-[8px] font-black uppercase tracking-widest text-blue-400 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                              Verify Email
                            </span>
                          </div>

                          {/* Delete User */}
                          {profile?.role === 'superadmin' && user?.id !== user_profile.id && (
                            <div className="relative group">
                              <button 
                                onClick={() => handleDeleteUser(user_profile.id, `${user_profile.first_name} ${user_profile.last_name}`)}
                                className="w-10 h-10 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-text-on-green transition-all flex items-center justify-center active-scale"
                              >
                                <Trash2 size={14} />
                              </button>
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-bg-card border border-border-primary text-[8px] font-black uppercase tracking-widest text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                Decommission
                              </span>
                            </div>
                          )}

                          {/* Reset Password */}
                          {user_profile.role === 'staff' ? (
                            <div className="relative group">
                              <button 
                                onClick={() => handleResetPassword(user_profile.id)}
                                className="w-10 h-10 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-text-on-green transition-all flex items-center justify-center active-scale"
                              >
                                <Zap size={14} />
                              </button>
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-bg-card border border-border-primary text-[8px] font-black uppercase tracking-widest text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                Reset Password
                              </span>
                            </div>
                          ) : (
                            <div className="w-10 h-10" />
                          )}

                          {/* OPS/PROTO */}
                          <div className="relative group">
                            {user_profile.role === 'athlete' ? (
                              <button 
                                onClick={() => {
                                  setSelectedAthlete(user_profile);
                                  setIsActionModalOpen(true);
                                }}
                                className="w-10 h-10 bg-accent-green/5 border border-accent-green/30 rounded-xl text-accent-green hover:bg-bg-button-primary hover:text-text-on-green transition-all flex items-center justify-center active-scale"
                              >
                                <Layers size={14} />
                              </button>
                            ) : (
                              <button 
                                disabled
                                className="w-10 h-10 bg-bg-secondary border border-border-primary/30 rounded-xl text-text-muted flex items-center justify-center cursor-not-allowed opacity-50"
                              >
                                <Layers size={14} />
                              </button>
                            )}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-bg-card border border-border-primary text-[8px] font-black uppercase tracking-widest text-accent-green rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                              {user_profile.role === 'athlete' ? "Configure Protocol" : "Ops Control"}
                            </span>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredProfiles.map((user_profile) => (
          <div key={user_profile.id} className="bg-bg-card border border-border-card rounded-2xl p-5 space-y-4 shadow-xl">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar 
                    src={user_profile.avatar_url}
                    name={`${user_profile.first_name} ${user_profile.last_name}`}
                    role={user_profile.role}
                    size="md"
                  />
                  <div>
                    <p className="text-sm font-bold text-text-primary uppercase">{user_profile.first_name} {user_profile.last_name}</p>
                    <p className="font-label text-text-secondary text-[10px] font-bold">@{user_profile.username || 'not_set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => { setSelectedViewProfile(user_profile); setIsViewModalOpen(true); }}
                      className="p-2 bg-bg-secondary rounded-lg text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
                   >
                     <ExternalLink size={14} />
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-text-secondary uppercase tracking-widest">Core Governance</p>
                   <select 
                      value={user_profile.role}
                      onChange={(e) => handleUpdate(user_profile.id, { role: e.target.value })}
                      className="w-full bg-bg-input border border-border-input hover:border-border-active rounded-lg px-3 py-2 text-[10px] font-black text-accent-green uppercase tracking-widest focus:border-accent-green outline-none transition-colors"
                   >
                      {ROLES.map(r => <option key={r} value={r} className="bg-bg-card text-text-primary">{r}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-text-secondary uppercase tracking-widest">System Status</p>
                   <select 
                      value={user_profile.status}
                      onChange={(e) => handleUpdate(user_profile.id, { status: e.target.value })}
                      className="w-full bg-bg-input border border-border-input hover:border-border-active rounded-lg px-3 py-2 text-[10px] font-black text-accent-green uppercase tracking-widest focus:border-accent-green outline-none transition-colors"
                   >
                      {STATUSES.map(s => <option key={s} value={s} className="bg-bg-card text-text-primary">{s}</option>)}
                   </select>
                </div>
             </div>

             <div className="flex items-center justify-between pt-2 border-t border-border-primary/50">
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
                   {profile?.role === 'superadmin' && user?.id !== user_profile.id && (
                     <button 
                      onClick={() => handleDeleteUser(user_profile.id, `${user_profile.first_name} ${user_profile.last_name}`)}
                      className="p-2 bg-red-500/10 rounded-lg text-red-500"
                     >
                       <Trash2 size={14} />
                     </button>
                   )}
                </div>
                {user_profile.role === 'athlete' ? (
                  <button 
                    onClick={() => { setSelectedAthlete(user_profile); setIsActionModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-bg-button-primary text-text-on-green font-black text-[10px] rounded-xl uppercase tracking-widest hover:bg-accent-green-dim active-scale"
                  >
                    <Layers size={14} /> Protocol
                  </button>
                ) : (
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">System Level</span>
                )}
           </div>
        </div>
      ))}
    </div>
  </>
) : (
  <div className="bg-bg-card border border-border-card rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-primary/50">
                    <th className="px-6 py-5 font-display text-text-secondary text-[10px] font-bold tracking-widest uppercase">Athlete</th>
                    <th className="px-6 py-5 font-display text-text-secondary text-[10px] font-bold tracking-widest uppercase">Requested Matrix</th>
                    <th className="px-6 py-5 font-display text-text-secondary text-[10px] font-bold tracking-widest uppercase">Transfer Reference</th>
                    <th className="px-6 py-5 font-display text-text-secondary text-[10px] font-bold tracking-widest uppercase text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary/30">
                  {enrollmentRequests.map((req) => {
                    const athleteProfile = profiles.find(p => p.id === req.user_id);
                    return (
                      <tr key={req.id} className="hover:bg-bg-card-hover transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Avatar src={athleteProfile?.avatar_url} name={athleteProfile ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'Unknown'} size="sm" />
                            <div>
                              <p className="text-sm font-bold text-text-primary uppercase">{athleteProfile?.first_name} {athleteProfile?.last_name}</p>
                              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">@{athleteProfile?.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-accent-green uppercase tracking-wider">{req.program?.title}</p>
                          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{req.program?.category}</p>
                        </td>
                        <td className="px-6 py-5 font-mono text-xs text-text-primary tracking-widest uppercase">
                          {req.payment_reference || 'NO_REF_PROVIDED'}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => handleEnrollmentAction(req.id, 'reject')}
                              className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-text-on-green transition-all"
                            >
                              Deny
                            </button>
                            <button 
                              onClick={() => handleEnrollmentAction(req.id, 'approve')}
                              className="px-6 py-2 bg-bg-button-primary text-text-on-green text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-green-dim transition-all active-scale shadow-none"
                            >
                              Confirm Transfer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {enrollmentRequests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-text-muted font-black uppercase text-xs tracking-widest">
                        Queue Clear: No Pending Transfers
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
              className="absolute inset-0 backdrop-blur-md"
              style={{ backgroundColor: "var(--backdrop-overlay)" }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-bg-card border border-border-primary rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-text-primary">
                <Zap size={120} />
              </div>
              
              <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-8 text-left">
                  <div>
                    <h3 className="text-[10px] font-black text-accent-green uppercase tracking-[3px] mb-2">Protocol Configuration</h3>
                    <p className="text-xl font-bold text-text-primary uppercase">{selectedAthlete.first_name} {selectedAthlete.last_name}</p>
                  </div>
                  <button 
                    onClick={() => setIsActionModalOpen(false)} 
                    className="text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-card-hover border border-border-primary/50 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest transition-colors"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-10 text-left">
                  {/* Assign Program */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Layers size={14} className="text-accent-green" />
                      <span className="text-[9px] font-black uppercase tracking-[2px]">Active Training Protocol</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                      <select 
                        value={selectedProgramId}
                        onChange={e => setSelectedProgramId(e.target.value)}
                        className="flex-1 bg-bg-input border border-border-input hover:border-border-active transition-colors rounded-xl px-4 py-3 text-sm text-text-primary focus:border-accent-green outline-none uppercase font-bold"
                      >
                        <option value="">Select Architecture...</option>
                        {programs.map(p => (
                          <option key={p.id} value={p.id}>{p.title} ({p.duration})</option>
                        ))}
                      </select>
                      <button 
                        disabled={actionLoading || !selectedProgramId}
                        onClick={handleAssignProgram}
                        className="bg-bg-button-primary text-text-on-green px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] hover:bg-accent-green-dim transition-all disabled:opacity-30"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={14} /> : "Initialize"}
                      </button>
                    </div>

                  {/* Book Assessment */}
                  <div className="space-y-4 pt-8 border-t border-border-primary/50">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Target size={14} className="text-accent-green" />
                      <span className="text-[9px] font-black uppercase tracking-[2px]">Performance Evaluation</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select 
                        value={assessmentType}
                        onChange={e => setAssessmentType(e.target.value)}
                        className="bg-bg-input border border-border-input hover:border-border-active transition-colors rounded-xl px-4 py-3 text-sm text-text-primary focus:border-accent-green outline-none uppercase font-bold"
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
                        className="bg-bg-input border border-border-input hover:border-border-active transition-colors rounded-xl px-4 py-3 text-sm text-text-primary focus:border-accent-green outline-none font-bold"
                      />
                    </div>
                    <button 
                      disabled={actionLoading || !assessmentDate}
                      onClick={handleBookAssessment}
                      className="w-full bg-text-primary text-bg-primary py-4 rounded-xl text-[10px] font-black uppercase tracking-[2px] hover:bg-accent-green hover:text-text-on-green transition-all disabled:opacity-30 text-center"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={14} /> : "Schedule Evaluation Protocol"}
                    </button>
                  </div>
                  </div>

                  {/* Log Injury Shortcut */}
                  <div className="pt-8 border-t border-border-primary/50">
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
