"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings as SettingsIcon, 
  Shield, 
  Zap, 
  Cpu, 
  Bell, 
  Globe, 
  Lock, 
  Database,
  Loader2,
  Check,
  Activity,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import ImageUpload from "@/components/ui/ImageUpload";



export default function AdminSettings() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

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
       <div className="flex items-center justify-center p-20">
         <Loader2 className="text-[#22c55e] animate-spin" size={48} />
       </div>
     );
  }

  const settingSections = [
    {
      id: 'general',
      title: 'PLATFORM BRANDING',
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
      title: 'ENTERPRISE SECURITY',
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
      title: 'SYSTEM PULSE',
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
    <div className="space-y-12 max-w-5xl">
      {/* Header */}
      <div className="pb-8 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon className="text-[#22c55e]" size={16} />
          <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px]">System Infrastructure</span>
        </div>
        <h1 className={`font-display text-5xl text-white uppercase tracking-wider`}>Global Settings</h1>
      </div>

      {/* Personal Identity Section (NEW) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e]">
                 <Activity size={18} />
              </div>
              <div>
                <h3 className={`font-sans text-white text-lg font-bold tracking-wider uppercase`}>Personal Identity</h3>
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-[2px]">Manage your administrative presence and biometric data</p>
              </div>
           </div>
        </div>
        <div className="p-8 flex flex-col md:flex-row items-center gap-10">
           <ImageUpload 
             onUpload={handleAvatarUpload}
             initialUrl={profile?.avatar_url}
           />
           <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#22c55e] uppercase tracking-[2px]">First Name</label>
                    <input readOnly value={profile?.first_name || ""} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white/40 uppercase tracking-widest font-bold" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#22c55e] uppercase tracking-[2px]">Last Name</label>
                    <input readOnly value={profile?.last_name || ""} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white/40 uppercase tracking-widest font-bold" />
                 </div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black text-[#22c55e] uppercase tracking-[2px]">Operational Tag</label>
                 <input readOnly value={`@${profile?.username || "NOT_SET"}`} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-[#22c55e]/60 tracking-widest font-bold" />
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic pt-2">Note: To modify name/tag credentials, use the sidebar profile portal.</p>
           </div>
        </div>
      </motion.div>

      {/* Settings Grid */}
      <div className="space-y-8">
        {settingSections.map((section, idx) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e]">
                     {section.icon}
                  </div>
                  <div>
                    <h3 className={`font-sans text-white text-lg font-bold tracking-wider uppercase`}>{section.title}</h3>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-[2px]">{section.desc}</p>
                  </div>
               </div>
               <button className="px-4 py-2 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl text-[#22c55e] text-[9px] font-bold uppercase tracking-[2px] hover:bg-[#22c55e] hover:text-black transition-all">Update Section</button>
            </div>

            <div className="p-8 space-y-6">
               {section.items.map((item, i) => (
                 <div key={i} className="flex items-center justify-between group">
                    <div className="space-y-1">
                       <p className="text-sm font-bold text-white uppercase tracking-wide group-hover:text-[#22c55e] transition-colors">{item.label}</p>
                       <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[1px]">Configuration Key: {item.label.toLowerCase().replace(/ /g, '_')}</p>
                    </div>

                    <div className="flex items-center gap-4">
                       {item.type === 'input' && (
                         <input 
                           type="text" 
                           defaultValue={item.value} 
                           className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold uppercase tracking-widest outline-none focus:border-[#22c55e]/50 w-64" 
                         />
                       )}
                       {item.type === 'display' && (
                         <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{item.value}</span>
                       )}
                       {item.type === 'status' && (
                         <span className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg text-[9px] font-bold uppercase text-[#22c55e]">{item.value || item.status}</span>
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
          </motion.div>
        ))}
      </div>

      {/* Advanced Command Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-red-500/5 border border-red-500/20 p-8 rounded-3xl"
      >
         <h3 className={`font-sans text-red-500 text-lg font-bold tracking-wider mb-4 flex items-center gap-3`}>
            <AlertCircle size={20} /> CORE SYSTEM RESET
         </h3>
         <p className="text-xs font-bold text-white/50 uppercase tracking-[2px] mb-8 max-w-2xl leading-relaxed">
            Initializing a core reset will synchronize all platform biometrics to zero and purge the operational cache. This action requires Level 5 Authorization and cannot be reversed.
         </p>
         <button className={`font-sans px-8 py-3 bg-red-500 text-white text-[12px] font-bold tracking-[0.2em] rounded-xl hover:bg-white hover:text-red-500 transition-all uppercase`}>
            Initialize Platform Purge
         </button>
      </motion.div>

      {/* Personal Account Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e]">
                 <Lock size={18} />
              </div>
              <div>
                <h3 className={`font-sans text-white text-lg font-bold tracking-wider uppercase`}>Personal Account Security</h3>
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-[2px]">Manage your administrative access credentials</p>
              </div>
           </div>
        </div>
        <div className="p-8">
           <div className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl group hover:border-[#22c55e]/30 transition-all">
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-[#22c55e]">
                    <Shield size={20} />
                 </div>
                 <div>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-[2px] mb-1">Access Protocol</p>
                    <p className="text-sm font-bold text-white uppercase tracking-widest">••••••••••••••••</p>
                 </div>
              </div>
              <button 
                onClick={() => setPasswordModalOpen(true)}
                className="px-6 py-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl text-[#22c55e] text-[9px] font-bold uppercase tracking-[2px] hover:bg-[#22c55e] hover:text-black transition-all"
              >
                Change Password
              </button>
           </div>
        </div>
      </motion.div>

      <ChangePasswordModal 
        isOpen={passwordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
      />
    </div>
  );
}
