"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings as SettingsIcon, 
  Shield, 
  Zap, 
  Globe, 
  Lock, 
  Loader2,
  Activity,
  AlertCircle,
  Target,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  User
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import ImageUpload from "@/components/ui/ImageUpload";
import PurgeModal from "@/components/modals/PurgeModal";

export default function AdminSettings() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user && profile?.role === 'superadmin') {
      setLoading(false);
    }
  }, [user, profile, authLoading]);

  const handleAvatarUpload = async (url: string) => {
    if (!user?.id) return;
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      
      if (updateError) throw updateError;
      // Refresh context
      window.dispatchEvent(new CustomEvent('refresh-users'));
    } catch (err) {
      console.error("Avatar update failed:", err);
    }
  };

  if (loading) {
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

  const settingSections = [
    {
      id: 'general',
      title: 'Platform Branding',
      desc: 'Global identity and visual protocols',
      icon: <Globe size={18} />,
      items: [
        { label: 'System Name', value: 'KIO-X PERFORMANCE', type: 'input' },
        { label: 'Organization ID', value: 'KIO-HQ-01', type: 'display' },
        { label: 'Deployment Channel', value: 'Production • Stable', type: 'status' },
      ]
    },
    {
      id: 'security',
      title: 'Enterprise Security',
      desc: 'Access hierarchies and firewall protocols',
      icon: <Shield size={18} />,
      items: [
        { label: 'Multi-Factor Auth', status: true, type: 'toggle' },
        { label: 'Admin Session Persistence', value: '30 Minutes', type: 'select' },
        { label: 'IP White-listing', status: false, type: 'toggle' },
      ]
    },
    {
      id: 'system',
      title: 'System Pulse',
      desc: 'Real-time diagnostic and sync triggers',
      icon: <Zap size={18} />,
      items: [
        { label: 'Supabase Sync State', status: 'Optimal', type: 'status' },
        { label: 'Cache Performance', value: '99.9% Hit', type: 'display' },
        { label: 'Registry Auto-Sync', status: true, type: 'toggle' },
      ]
    }
  ];

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
              <SettingsIcon className="text-[#22c55e]" size={16} />
              <span className="text-xs font-semibold text-[#22c55e] tracking-wider font-mono">System Infrastructure</span>
            </div>
            <h1 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] text-white tracking-wide leading-none uppercase">
              Global Settings
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xl font-normal">
              Manage enterprise-level configurations, platform branding, and security protocols across the entire architecture.
            </p>
          </div>

          {/* Profile Card */}
          <div className="flex items-center gap-5 bg-[#141414] border border-white/5 p-5 md:p-6 rounded-2xl shadow-xl relative overflow-hidden group/profile-card w-full md:w-auto min-w-[320px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/5 to-transparent opacity-50 group-hover/profile-card:opacity-100 transition-opacity" />
            <div className="relative z-10 flex-shrink-0">
               <ImageUpload 
                 onUpload={handleAvatarUpload}
                 initialUrl={profile?.avatar_url}
                 showRemove={false}
               />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
               <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 w-fit mb-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                 Level 5 Auth
               </div>
               <h2 className="font-sans text-lg font-bold text-white truncate leading-snug">
                 Super Admin
               </h2>
               <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-2 font-normal">
                  <span>Name:</span>
                  <span className="text-white font-medium">{profile?.first_name} {profile?.last_name}</span>
                  <span>Tag:</span>
                  <span className="text-white font-medium">@{profile?.username || "NOT_SET"}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-start">
           
           {/* Main Content (Left/Top on Mobile, Right on Desktop) */}
           <div className="md:col-span-2 space-y-8 order-1 md:order-2">
              
              {/* Iterating over Setting Sections */}
              {settingSections.map((section, idx) => (
                <section key={section.id} className="bg-[#141414] border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl relative">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="text-[#22c55e]">
                            {section.icon}
                          </div>
                          <h3 className="font-sans text-base font-bold text-white tracking-wide">{section.title}</h3>
                        </div>
                    </div>

                    <div className="space-y-6">
                       {section.items.map((item, i) => (
                         <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                            <div className="space-y-1">
                               <p className="text-[13px] font-sans font-medium text-white/60 tracking-wide group-hover:text-white transition-colors">{item.label}</p>
                               <p className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Key: {item.label.toLowerCase().replace(/ /g, '_')}</p>
                            </div>

                            <div className="flex items-center gap-4">
                               {item.type === 'input' && (
                                 <input 
                                   type="text" 
                                   defaultValue={item.value} 
                                   className="w-full sm:w-64 bg-[#1c1c1c] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 focus:bg-[#202020] outline-none transition-all font-medium" 
                                 />
                               )}
                               {item.type === 'display' && (
                                 <span className="text-sm font-medium text-white/80">{item.value}</span>
                               )}
                               {item.type === 'status' && (
                                 <span className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg text-xs font-semibold text-[#22c55e]">{item.value || item.status}</span>
                               )}
                               {item.type === 'select' && (
                                 <select className="bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 focus:bg-[#202020] outline-none transition-all font-medium cursor-pointer">
                                   <option>{item.value}</option>
                                   <option>1 Hour</option>
                                   <option>24 Hours</option>
                                 </select>
                               )}
                               {item.type === 'toggle' && (
                                 <div className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${item.status ? 'bg-[#22c55e]' : 'bg-white/10'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${item.status ? 'ml-6' : 'ml-0'}`} />
                                 </div>
                               )}
                            </div>
                         </div>
                       ))}
                    </div>
                </section>
              ))}

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
                              <p className="text-sm font-semibold text-white tracking-wide">Access protocol credentials</p>
                              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                                 Update your super admin access password. This secures the global system architecture.
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

           {/* Sidebar: Tactical Context & System Purge (Right/Bottom on Mobile, Left on Desktop) */}
           <div className="md:col-span-1 space-y-8 order-2 md:order-1">
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden group/context-card">
                 <div className="absolute top-0 right-0 p-6 opacity-5 text-[#22c55e] group-hover/context-card:opacity-10 transition-opacity">
                    <Target size={80} />
                 </div>
                 <div className="flex items-center gap-2.5 mb-6 text-[#22c55e] pb-4 border-b border-white/5">
                    <Activity size={18} />
                    <h3 className="font-sans text-base font-bold tracking-wide">Enterprise context</h3>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-[13px] font-sans font-medium text-gray-400 tracking-wide">Current Role</p>
                        <div className="px-4 py-3 bg-black/40 border-l-2 border-[#22c55e] rounded-r-lg">
                           <span className="font-sans text-sm font-semibold text-white tracking-wide">
                              Super Administrator
                           </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[13px] font-sans font-medium text-gray-400 tracking-wide">System Scope</p>
                        <p className="text-xs text-gray-400 leading-relaxed italic font-normal tracking-wide">
                           "Unrestricted access to all organizational units, operational biometrics, and global system parameters."
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

              {/* Advanced Command Area */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 md:p-8 space-y-4">
                 <div className="flex items-center gap-2.5 text-red-500 pb-2 border-b border-red-500/10">
                    <AlertCircle size={18} />
                    <h3 className="font-sans text-base font-bold tracking-wide">System Purge</h3>
                 </div>
                 <p className="text-xs text-red-400/80 leading-relaxed font-normal tracking-wide mb-4">
                    Initializing a core reset will synchronize all platform biometrics to zero and purge the operational cache. This action requires Level 5 Authorization and cannot be reversed.
                 </p>
                 <button 
                   onClick={() => setPurgeModalOpen(true)}
                   className="w-full px-6 py-3 bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-white hover:text-red-500 transition-all shadow-[0_10px_30px_rgba(239,68,68,0.2)] whitespace-nowrap"
                 >
                   Initialize Platform Purge
                 </button>
              </div>
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
