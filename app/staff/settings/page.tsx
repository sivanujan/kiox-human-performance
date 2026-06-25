"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck,
  Lock,
  ArrowLeft,
  Loader2,
  Trophy,
  User,
  Mail,
  Smartphone,
  CheckCircle2,
  XCircle,
  Hash,
  Activity,
  Zap,
  Target
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import PurgeModal from "@/components/modals/PurgeModal";
import { AlertCircle } from "lucide-react";


export default function StaffSettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saverLoading, setSaverLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [teams, setTeams] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone_number: "",
    team_id: "",
    avatar_url: ""
  });

  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
    if (!authLoading) {
      if (!user || (profile?.role !== 'staff' && profile?.role !== 'superadmin' && profile?.role !== 'medical')) {
        router.push("/signin");
      } else {
        setFormData({
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          username: profile?.username || "",
          phone_number: profile?.phone_number || "",
          team_id: profile?.team_id || "",
          avatar_url: profile?.avatar_url || ""
        });
        fetchTeams();
        setLoading(false);
      }
    }
  }, [user, profile, authLoading, router]);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      const data = await res.json();
      if (!data.error) setTeams(data);
    } catch (err) {
      console.error("Teams fetch error:", err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaverLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/staff/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        await refreshProfile();
        setSuccessMsg("Tactical Identity Synchronized");
        // Trigger a refresh if needed or local update
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(data.error || "Synchronization Failed");
      }
    } catch (err) {
      setErrorMsg("Operational Link Lost. Check Connection.");
    } finally {
      setSaverLoading(false);
    }
  };

  if (!isHydrated || loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-[#22c55e]/10 animate-ping absolute inset-0" />
          <div className="w-20 h-20 rounded-full border-t-2 border-[#22c55e] animate-spin" />
        </div>
        <div className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.5em] animate-pulse">
          Syncing Operational Context...
        </div>
      </div>
    );
  }

  const userTeam = teams.find(t => t.id === profile?.team_id);

  return (
    <main className="min-h-screen bg-[#080808] py-10 md:py-16 px-4 md:px-8 relative overflow-hidden text-white font-sans">
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', 
          backgroundSize: '60px 60px' 
        }} 
      />

      <div className="container mx-auto max-w-5xl relative z-10 space-y-8 md:space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Zap className="text-[#22c55e]" size={16} />
              <span className="text-xs font-semibold text-[#22c55e] tracking-wider font-mono">Secure Personnel Hub</span>
            </div>
            <h1 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] text-white tracking-wide leading-none uppercase">
              Personnel Profile
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xl font-normal">
              Access and manage your tactical identity, squad assignments, and operational security credentials.
            </p>
          </div>

          {/* Profile Card */}
          <div className="flex items-center gap-5 bg-[#141414] border border-white/5 p-5 md:p-6 rounded-2xl shadow-xl relative overflow-hidden group/profile-card w-full md:w-auto min-w-[320px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/5 to-transparent opacity-50 group-hover/profile-card:opacity-100 transition-opacity" />
            <div className="relative z-10 flex-shrink-0">
               <ImageUpload 
                 onUpload={(url) => setFormData(p => ({ ...p, avatar_url: url }))}
                 initialUrl={formData.avatar_url}
                 showRemove={false}
               />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
               <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 w-fit mb-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                 Ops Ready
               </div>
               <h2 className="font-sans text-lg font-bold text-white truncate leading-snug">
                 {profile?.role === 'medical' ? 'Officer' : 'Coach'} {profile?.first_name} {profile?.last_name}
               </h2>
               <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-2 font-normal">
                  <span>Role:</span>
                  <span className="text-white font-medium">{profile?.role === 'superadmin' ? 'Super Admin' : profile?.role === 'medical' ? 'Medical Staff' : 'Performance Staff'}</span>
                  <span>Team:</span>
                  <span className="text-white font-medium">{userTeam?.name || "U21 Elite Squad"}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-start">
           
           {/* Main Content: Profile & Security Form (Left/Top on Mobile, Right on Desktop) */}
           <div className="md:col-span-2 space-y-8 order-1 md:order-2">
              <section className="bg-[#141414] border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl relative">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <User className="text-[#22c55e]" size={18} />
                        <h3 className="font-sans text-base font-bold text-white tracking-wide">Personnel profile details</h3>
                      </div>
                      
                      <AnimatePresence>
                        {successMsg && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0 }}
                            className="bg-[#22c55e]/10 text-[#22c55e] text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#22c55e]/20 flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={14} /> {successMsg}
                          </motion.div>
                        )}
                        {errorMsg && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0 }}
                            className="bg-red-500/10 text-red-500 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-red-500/20 flex items-center gap-1.5"
                          >
                            <XCircle size={14} /> {errorMsg}
                          </motion.div>
                        )}
                      </AnimatePresence>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div className="space-y-1.5">
                           <label className="block text-[13px] font-sans font-medium text-white/60 tracking-wide ml-1">First name</label>
                           <div className="relative flex items-center group">
                              <div className="absolute left-4 flex items-center justify-center pointer-events-none text-gray-500 group-focus-within:text-[#22c55e] transition-colors">
                                <User size={18} />
                              </div>
                              <input 
                                value={formData.first_name}
                                onChange={e => setFormData({...formData, first_name: e.target.value})}
                                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 focus:bg-[#202020] outline-none transition-all placeholder:text-white/30 font-medium"
                                placeholder="Enter first name"
                              />
                           </div>
                        </div>

                        {/* Last Name */}
                        <div className="space-y-1.5">
                           <label className="block text-[13px] font-sans font-medium text-white/60 tracking-wide ml-1">Last name</label>
                           <div className="relative flex items-center group">
                              <div className="absolute left-4 flex items-center justify-center pointer-events-none text-gray-500 group-focus-within:text-[#22c55e] transition-colors">
                                <User size={18} />
                              </div>
                              <input 
                                value={formData.last_name}
                                onChange={e => setFormData({...formData, last_name: e.target.value})}
                                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 focus:bg-[#202020] outline-none transition-all placeholder:text-white/30 font-medium"
                                placeholder="Enter last name"
                              />
                           </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-1.5">
                           <div className="flex justify-between items-baseline ml-1">
                              <label className="text-[13px] font-sans font-medium text-white/60 tracking-wide">Username</label>
                              <span className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Digital callsign</span>
                           </div>
                           <div className="relative flex items-center group">
                              <div className="absolute left-4 flex items-center justify-center pointer-events-none text-gray-500 group-focus-within:text-[#22c55e] transition-colors">
                                <Hash size={18} />
                              </div>
                              <input 
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 focus:bg-[#202020] outline-none transition-all placeholder:text-white/30 font-medium"
                                placeholder="Enter username"
                              />
                           </div>
                           <p className="text-[11px] text-gray-400 ml-1">Your unique operator code used to log in and sign logs.</p>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                           <div className="flex justify-between items-baseline ml-1">
                              <label className="text-[13px] font-sans font-medium text-white/60 tracking-wide">Phone number</label>
                              <span className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Comms frequency</span>
                           </div>
                           <div className="relative flex items-center group">
                              <div className="absolute left-4 flex items-center justify-center pointer-events-none text-gray-500 group-focus-within:text-[#22c55e] transition-colors">
                                <Smartphone size={18} />
                              </div>
                              <input 
                                value={formData.phone_number}
                                onChange={e => setFormData({...formData, phone_number: e.target.value})}
                                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 focus:bg-[#202020] outline-none transition-all placeholder:text-white/30 font-medium"
                                placeholder="+1 (555) 000-0000"
                              />
                           </div>
                           <p className="text-[11px] text-gray-400 ml-1">For urgent operational notifications and critical alerts.</p>
                        </div>
                     </div>

                     <div className="pt-6 flex flex-col-reverse sm:flex-row sm:justify-end items-center gap-4">
                        <button 
                           type="button"
                           onClick={() => {
                             if (profile) {
                               setFormData({
                                 first_name: profile.first_name || "",
                                 last_name: profile.last_name || "",
                                 username: profile.username || "",
                                 phone_number: profile.phone_number || "",
                                 team_id: profile.team_id || "",
                                 avatar_url: profile.avatar_url || ""
                               });
                             }
                           }}
                           className="w-full sm:w-auto px-6 py-3 border border-white/10 hover:bg-white/5 text-white/80 hover:text-white rounded-xl text-sm font-medium transition-all"
                        >
                           Discard Changes
                        </button>
                        <button 
                           type="submit"
                           disabled={saverLoading}
                           className="w-full sm:w-auto px-8 py-3 bg-[#22c55e] text-black font-semibold text-sm rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           {saverLoading ? (
                             <Loader2 size={18} className="animate-spin" />
                           ) : (
                             <>
                               Save Changes
                               <Zap aria-hidden="true" size={16} />
                             </>
                           )}
                        </button>
                     </div>
                  </form>
              </section>

              {/* Security Protocol */}
              <section className="bg-[#141414] border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-red-500 pointer-events-none">
                     <Lock size={120} />
                  </div>
                  
                  <div className="relative z-10 space-y-6">
                     <div className="flex items-center gap-2.5 pb-4 border-b border-white/5">
                        <Lock className="text-red-500" size={18} />
                        <h3 className="font-sans text-base font-bold text-white tracking-wide">Access security</h3>
                     </div>

                     <div className="flex flex-col lg:flex-row items-center justify-between gap-6 p-6 bg-black/40 border border-white/5 rounded-xl hover:border-red-500/20 transition-all">
                        <div className="flex items-start gap-4">
                           <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 shrink-0">
                              <ShieldCheck size={24} />
                           </div>
                           <div className="space-y-1">
                              <p className="text-sm font-semibold text-white tracking-wide">Access code rotation</p>
                              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                                 Manually cycle your tactical access code. Frequent rotation is advised for high-clearance personnel.
                              </p>
                           </div>
                        </div>

                        <button 
                           onClick={() => setPasswordModalOpen(true)}
                           className="w-full lg:w-auto px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold hover:bg-red-500 hover:text-black transition-all shadow-[0_10px_30px_rgba(239,68,68,0.05)] whitespace-nowrap"
                        >
                           Change Password
                        </button>
                     </div>
                  </div>
              </section>
           </div>

           {/* Sidebar: Tactical Context (Right/Bottom on Mobile, Left on Desktop) */}
           <div className="md:col-span-1 space-y-8 order-2 md:order-1">
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden group/context-card">
                 <div className="absolute top-0 right-0 p-6 opacity-5 text-[#22c55e] group-hover/context-card:opacity-10 transition-opacity">
                    <Target size={80} />
                 </div>
                 <div className="flex items-center gap-2.5 mb-6 text-[#22c55e] pb-4 border-b border-white/5">
                    <Activity size={18} />
                    <h3 className="font-sans text-base font-bold tracking-wide">Unit intelligence</h3>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-[13px] font-sans font-medium text-gray-400 tracking-wide">Assigned Unit</p>
                        <div className="px-4 py-3 bg-black/40 border-l-2 border-[#22c55e] rounded-r-lg">
                           <span className="font-sans text-sm font-semibold text-white tracking-wide">
                              {userTeam?.name || "Independent Ops"}
                           </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[13px] font-sans font-medium text-gray-400 tracking-wide">Unit Mission</p>
                        <p className="text-xs text-gray-400 leading-relaxed italic font-normal tracking-wide">
                           "{userTeam?.description || "High-performance operational baseline. No specific tactical assignment detected."}"
                        </p>
                    </div>
                 </div>
              </div>

              <div className="bg-[#22c55e]/5 border border-[#22c55e]/15 rounded-2xl p-6 md:p-8 space-y-4">
                 <div className="flex items-center gap-2.5 text-[#22c55e] pb-2 border-b border-[#22c55e]/10">
                    <ShieldCheck size={18} />
                    <h3 className="font-sans text-base font-bold tracking-wide">Access policy</h3>
                 </div>
                 <p className="text-xs text-gray-400 leading-relaxed font-normal tracking-wide">
                    All administrative actions are logged to your digital signature. Maintain strict operational security at all times. Use a high-entropy access code for maximum protection.
                 </p>
              </div>
              
              {profile?.role === 'superadmin' && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 md:p-8 space-y-4">
                   <div className="flex items-center gap-2.5 text-red-500 pb-2 border-b border-red-500/10">
                      <AlertCircle size={18} />
                      <h3 className="font-sans text-base font-bold tracking-wide">System Purge</h3>
                   </div>
                   <p className="text-xs text-red-400/80 leading-relaxed font-normal tracking-wide mb-4">
                      Super Admin override. Initialize a full operational cache clear.
                   </p>
                   <button 
                     onClick={() => setPurgeModalOpen(true)}
                     className="w-full px-6 py-3 bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-white hover:text-red-500 transition-all shadow-[0_10px_30px_rgba(239,68,68,0.2)] whitespace-nowrap"
                   >
                     Initialize Platform Purge
                   </button>
                </div>
              )}
           </div>

        </div>
      </div>

      <ChangePasswordModal 
        isOpen={passwordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
      />

      <PurgeModal
        isOpen={purgeModalOpen}
        onClose={() => setPurgeModalOpen(false)}
      />
    </main>
  );
}
