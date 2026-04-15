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
import { Anton, Plus_Jakarta_Sans, Orbitron } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import ImageUpload from "@/components/ui/ImageUpload";

const anton = Anton({ weight: '400', subsets: ['latin'] });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });
const orbitron = Orbitron({ subsets: ["latin"] });

export default function StaffSettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saverLoading, setSaverLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
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
      if (!user || (profile?.role !== 'staff' && profile?.role !== 'superadmin')) {
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
    <main className="min-h-screen bg-[#080808] pt-10 pb-20 px-6 relative overflow-hidden text-white font-sans">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="container mx-auto max-w-5xl relative z-10">

        {/* Header Section */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Zap className="text-[#22c55e]" size={18} />
              <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[5px]">Secure Personnel Hub</span>
            </div>
            <h1 className={`${anton.className} text-6xl md:text-8xl text-white uppercase tracking-wider`}>Personnel Profile</h1>
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-[4px] mt-6 leading-relaxed max-w-xl">
              Access and manage your tactical identity, squad assignments, and operational security credentials.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[#111] border border-[#22c55e]/30 p-8 rounded-[32px] backdrop-blur-xl shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 scale-110">
               <ImageUpload 
                 onUpload={(url) => setFormData(p => ({ ...p, avatar_url: url }))}
                 initialUrl={formData.avatar_url}
               />
            </div>
            <div className="relative z-10">
               <div className="text-[9px] font-black text-[#22c55e] uppercase tracking-[4px] mb-1">KIO-X STAFF COMMAND // OPS_READY</div>
               <div className={`${plusJakarta.className} text-2xl font-black uppercase tracking-widest text-white`}>Coach {profile?.first_name} {profile?.last_name}</div>
               <div className="flex items-center gap-3 mt-2">
                  <div className="text-white/40 text-[10px] font-black uppercase tracking-[2px]">Role: <span className="text-[#22c55e]">Performance Admin</span></div>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <div className="text-white/40 text-[10px] font-black uppercase tracking-[2px]">Team: <span className="text-white">{userTeam?.name || "U21 Elite Squad"}</span></div>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           {/* Sidebar: Tactical Context */}
           <div className="lg:col-span-1 space-y-8">
              <div className="bg-[#111] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 text-[#22c55e] group-hover:opacity-10 transition-opacity">
                    <Target size={100} />
                 </div>
                 <div className="flex items-center gap-3 mb-8 text-[#22c55e]">
                    <Activity size={18} />
                    <h3 className="text-[11px] font-black uppercase tracking-[3px]">Unit Intelligence</h3>
                 </div>
                 
                 <div className="space-y-6">
                    <div>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[2px] mb-2">Assigned Unit</p>
                        <div className="px-5 py-4 bg-black/40 border-l-2 border-[#22c55e] rounded-r-xl">
                           <span className={`${plusJakarta.className} text-sm font-black text-white uppercase tracking-wider`}>
                              {userTeam?.name || "Independent Ops"}
                           </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[2px] mb-2">Unit Mission</p>
                        <p className="text-[10px] text-white/50 leading-relaxed uppercase font-bold tracking-widest italic">
                           "{userTeam?.description || "High-performance operational baseline. No specific tactical assignment detected."}"
                        </p>
                    </div>
                 </div>
              </div>

              <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-3xl p-8">
                 <div className="flex items-center gap-3 mb-6 text-[#22c55e]">
                    <ShieldCheck size={18} />
                    <h3 className="text-[11px] font-black uppercase tracking-[3px]">Access Policy</h3>
                 </div>
                 <p className="text-[10px] text-white/40 leading-relaxed uppercase font-black tracking-widest">
                    All administrative actions are logged to your digital signature. Maintain strict operational security at all times. Use a high-entropy access code for maximum protection.
                 </p>
              </div>
           </div>

           {/* Main Content: Profile & Security Form */}
           <div className="lg:col-span-2 space-y-12">
              <section className="bg-[#111] border border-white/10 rounded-[40px] p-10 shadow-2xl relative">
                  <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <User className="text-[#22c55e]" size={20} />
                        <h3 className={`${anton.className} text-2xl text-white uppercase tracking-widest`}>Personnel Profile</h3>
                      </div>
                      
                      <AnimatePresence>
                        {successMsg && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0 }}
                            className="bg-[#22c55e]/10 text-[#22c55e] text-[9px] font-black uppercase tracking-[2px] px-4 py-2 rounded-full border border-[#22c55e]/20"
                          >
                            <CheckCircle2 className="inline mr-2" size={14} /> {successMsg}
                          </motion.div>
                        )}
                        {errorMsg && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0 }}
                            className="bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-[2px] px-4 py-2 rounded-full border border-red-500/20"
                          >
                            <XCircle className="inline mr-2" size={14} /> {errorMsg}
                          </motion.div>
                        )}
                      </AnimatePresence>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* First Name */}
                        <div className="space-y-3">
                           <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px] ml-1">Given Name</label>
                           <div className="relative group">
                              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                              <input 
                                value={formData.first_name}
                                onChange={e => setFormData({...formData, first_name: e.target.value})}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-white font-sans font-bold uppercase tracking-widest focus:border-[#22c55e] outline-none transition-all placeholder:text-white/10"
                                placeholder="FIRST_NAME"
                              />
                           </div>
                        </div>

                        {/* Last Name */}
                        <div className="space-y-3">
                           <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px] ml-1">Surname</label>
                           <div className="relative group">
                              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                              <input 
                                value={formData.last_name}
                                onChange={e => setFormData({...formData, last_name: e.target.value})}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-white font-sans font-bold uppercase tracking-widest focus:border-[#22c55e] outline-none transition-all placeholder:text-white/10"
                                placeholder="LAST_NAME"
                              />
                           </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-3">
                           <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px] ml-1">Digital Callsign</label>
                           <div className="relative group">
                              <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                              <input 
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-white font-sans font-bold uppercase tracking-widest focus:border-[#22c55e] outline-none transition-all placeholder:text-white/10"
                                placeholder="OPERATOR_CODE"
                              />
                           </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-3">
                           <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px] ml-1">Comms Frequency</label>
                           <div className="relative group">
                              <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                              <input 
                                value={formData.phone_number}
                                onChange={e => setFormData({...formData, phone_number: e.target.value})}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-white font-sans font-bold uppercase tracking-widest focus:border-[#22c55e] outline-none transition-all placeholder:text-white/10"
                                placeholder="+1 000 000 0000"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="pt-6">
                        <button 
                           type="submit"
                           disabled={saverLoading}
                           className="w-full py-6 bg-white text-black font-['Anton'] text-sm uppercase tracking-[4px] rounded-2xl hover:bg-[#22c55e] transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                        >
                           {saverLoading ? (
                             <Loader2 size={24} className="animate-spin" />
                           ) : (
                             <>
                               Commit Changes <Zap className="group-hover:scale-125 transition-transform" size={20} />
                             </>
                           )}
                        </button>
                     </div>
                  </form>
              </section>

              {/* Security Protocol */}
              <section className="bg-[#0A0A0A] border border-red-500/10 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 text-red-500 pointer-events-none">
                     <Lock size={150} />
                  </div>
                  
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
                        <Lock className="text-red-500" size={20} />
                        <h3 className={`${anton.className} text-2xl text-white uppercase tracking-widest`}>Access Security</h3>
                     </div>

                     <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-black/60 border border-white/5 rounded-3xl hover:border-red-500/30 transition-all">
                        <div className="flex items-start gap-6">
                           <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-white/20">
                              <ShieldCheck size={32} />
                           </div>
                           <div>
                              <p className="text-[11px] font-bold text-white uppercase tracking-[3px] mb-2">Access Code Rotation</p>
                              <p className="text-[10px] text-white/30 uppercase font-bold tracking-[1px] leading-relaxed max-w-sm">
                                 Manually cycle your tactical access code. Frequent rotation is advised for high-clearance personnel.
                              </p>
                           </div>
                        </div>

                        <button 
                           onClick={() => setPasswordModalOpen(true)}
                           className="px-10 py-5 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500 text-[11px] font-black uppercase tracking-[3px] hover:bg-red-500 hover:text-black transition-all shadow-[0_10px_30px_rgba(239,68,68,0.1)] whitespace-nowrap"
                        >
                           Cycle Access Code
                        </button>
                     </div>
                  </div>
              </section>
           </div>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={passwordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
      />
    </main>
  );
}
