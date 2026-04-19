"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
  Mail, 
  Lock, 
  Bell, 
  Eye, 
  Globe, 
  ShieldCheck,
  LogOut,
  ArrowRight,
  Loader2,
  AlertCircle,
  Save
} from "lucide-react";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";


export default function SettingsPage() {
  const { user, profile, supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [notifs, setNotifs] = useState({
    email: true,
    push: false,
    updates: true,
  });

  const handleSave = async () => {
    setLoading(true);
    // Simulate save
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="p-10 max-w-4xl">
      <div className="mb-12">
        <h2 className={`font-sans text-5xl text-white font-bold uppercase tracking-wider mb-2`}>System Settings</h2>
        <p className="text-white/40 text-[11px] font-bold uppercase tracking-[3px]">Manage your account security and portal preferences</p>
      </div>

      <div className="space-y-8">
        {/* Account Security */}
        <section className="bg-[#111] border border-white/5 rounded-3xl p-8">
           <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
              <ShieldCheck className="text-[#22c55e]" size={18} />
              <h3 className="text-[11px] font-bold text-white uppercase tracking-[3px]">Security Evolution</h3>
           </div>
           
           <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-[#22c55e]">
                       <Mail size={20} />
                    </div>
                    <div>
                       <p className="text-[11px] font-bold text-white/40 uppercase tracking-[2px] mb-1">Authenticated Encryption</p>
                       <p className="text-sm font-bold text-white uppercase tracking-widest">{user?.email}</p>
                    </div>
                 </div>
                 <button className="text-[9px] font-bold text-[#22c55e] uppercase tracking-[3px] opacity-0 group-hover:opacity-100 transition-all">Change →</button>
              </div>

              <div className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-red-500">
                       <Lock size={20} />
                    </div>
                    <div>
                       <p className="text-[11px] font-bold text-white/40 uppercase tracking-[2px] mb-1">Access Protocol</p>
                       <p className="text-sm font-bold text-white uppercase tracking-widest">••••••••••••••••</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => setPasswordModalOpen(true)}
                  className="text-[9px] font-bold text-red-500 uppercase tracking-[3px] opacity-0 group-hover:opacity-100 transition-all"
                >
                  Update →
                </button>
              </div>
           </div>
        </section>

        {/* Notifications */}
        <section className="bg-[#111] border border-white/5 rounded-3xl p-8">
           <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
              <Bell className="text-[#22c55e]" size={18} />
              <h3 className="text-[11px] font-bold text-white uppercase tracking-[3px]">Tactical Communications</h3>
           </div>

           <div className="space-y-4">
              {[
                { id: 'email', label: 'Email Notifications', desc: 'Performance reports and program updates.' },
                { id: 'push', label: 'Push Infrastructure', desc: 'Real-time booking and session alerts.' },
                { id: 'updates', label: 'System Briefings', desc: 'New feature drops and protocol changes.' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                   <div>
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-[2px]">{item.label}</h4>
                      <p className="text-[9px] text-white/40 uppercase font-bold mt-1 tracking-wider">{item.desc}</p>
                   </div>
                   <button 
                     onClick={() => setNotifs({...notifs, [item.id]: !notifs[item.id as keyof typeof notifs]})}
                     className={`w-12 h-6 rounded-full relative transition-all ${
                       notifs[item.id as keyof typeof notifs] ? 'bg-[#22c55e]' : 'bg-white/10'
                     }`}
                   >
                      <motion.div 
                        animate={{ x: notifs[item.id as keyof typeof notifs] ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-black rounded-full shadow-xl" 
                      />
                   </button>
                </div>
              ))}
           </div>
        </section>

        {/* Preferences */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-[#111] border border-white/5 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                 <Globe className="text-gray-500" size={16} />
                 <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-[2px]">Regional Interface</h4>
              </div>
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-white/80 uppercase tracking-widest font-bold">
                 English (International)
              </div>
           </div>
           <div className="bg-[#111] border border-white/5 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                 <Eye className="text-gray-500" size={16} />
                 <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-[2px]">UI Intensity</h4>
              </div>
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-white/80 uppercase tracking-widest font-bold">
                 Elite Dark (High Contrast)
              </div>
           </div>
        </section>

        {/* Bottom Actions */}
        <div className="pt-6 flex justify-between items-center">
           <div className="flex-1">
              {success && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-[#22c55e]"
                >
                   <ShieldCheck size={18} />
                   <span className="text-[10px] font-black uppercase tracking-[2px]">System preferences synchronized</span>
                </motion.div>
              )}
           </div>
           <button 
             onClick={handleSave}
             disabled={loading}
             className="px-10 py-4 bg-[#22c55e] text-black text-[11px] font-black uppercase tracking-[2px] rounded-xl flex items-center gap-3 hover:bg-white transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] disabled:opacity-50"
           >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Commit Preferences
           </button>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={passwordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
      />
    </div>
  );
}
