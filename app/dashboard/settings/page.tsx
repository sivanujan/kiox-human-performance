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
        <h2 className={`font-sans text-5xl text-text-primary font-bold uppercase tracking-wider mb-2`}>System Settings</h2>
        <p className="text-text-secondary text-[11px] font-bold uppercase tracking-[3px]">Manage your account security and portal preferences</p>
      </div>

      <div className="space-y-8">
        {/* Account Security */}
        <section className="bg-bg-card border border-border-primary/50 rounded-3xl p-8 shadow-2xl shadow-accent/5">
           <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border-primary/50">
              <ShieldCheck className="text-accent-green" size={18} />
              <h3 className="text-[11px] font-bold text-text-primary uppercase tracking-[3px]">Security Evolution</h3>
           </div>
           
           <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-bg-primary/50 border border-border-primary/50 rounded-2xl group hover:border-accent-green/30 transition-all">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-bg-primary/30 flex items-center justify-center text-text-muted group-hover:text-accent-green">
                       <Mail size={20} />
                    </div>
                    <div>
                       <p className="text-[11px] font-bold text-text-secondary uppercase tracking-[2px] mb-1">Authenticated Encryption</p>
                       <p className="text-sm font-bold text-text-primary uppercase tracking-widest">{user?.email}</p>
                    </div>
                 </div>
                 <button className="text-[9px] font-bold text-accent-green uppercase tracking-[3px] opacity-0 group-hover:opacity-100 transition-all">Change →</button>
              </div>

              <div className="flex items-center justify-between p-6 bg-bg-primary/50 border border-border-primary/50 rounded-2xl group hover:border-accent-green/30 transition-all">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-bg-primary/30 flex items-center justify-center text-text-muted group-hover:text-red-500">
                       <Lock size={20} />
                    </div>
                    <div>
                       <p className="text-[11px] font-bold text-text-secondary uppercase tracking-[2px] mb-1">Access Protocol</p>
                       <p className="text-sm font-bold text-text-primary uppercase tracking-widest">••••••••••••••••</p>
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
        <section className="bg-bg-card border border-border-primary/50 rounded-3xl p-8 shadow-2xl shadow-accent/5">
           <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border-primary/50">
              <Bell className="text-accent-green" size={18} />
              <h3 className="text-[11px] font-bold text-text-primary uppercase tracking-[3px]">Tactical Communications</h3>
           </div>

           <div className="space-y-4">
              {[
                { id: 'email', label: 'Email Notifications', desc: 'Performance reports and program updates.' },
                { id: 'push', label: 'Push Infrastructure', desc: 'Real-time booking and session alerts.' },
                { id: 'updates', label: 'System Briefings', desc: 'New feature drops and protocol changes.' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-bg-primary/30 border border-border-primary/50 rounded-xl">
                   <div>
                      <h4 className="text-[10px] font-bold text-text-primary uppercase tracking-[2px]">{item.label}</h4>
                      <p className="text-[9px] text-text-secondary uppercase font-bold mt-1 tracking-wider">{item.desc}</p>
                   </div>
                   <button 
                     onClick={() => setNotifs({...notifs, [item.id]: !notifs[item.id as keyof typeof notifs]})}
                     className={`w-12 h-6 rounded-full relative transition-all ${
                       notifs[item.id as keyof typeof notifs] ? 'bg-accent-green' : 'bg-bg-primary/50 border border-border-primary/50'
                     }`}
                   >
                      <motion.div 
                        animate={{ x: notifs[item.id as keyof typeof notifs] ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-bg-card rounded-full shadow-xl" 
                      />
                   </button>
                </div>
              ))}
           </div>
        </section>

        {/* Preferences */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-bg-card border border-border-primary/50 rounded-3xl p-8 shadow-2xl shadow-accent/5">
              <div className="flex items-center gap-3 mb-6">
                 <Globe className="text-text-muted" size={16} />
                 <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-[2px]">Regional Interface</h4>
              </div>
              <div className="px-4 py-3 bg-bg-primary/30 border border-border-primary/50 rounded-xl text-[11px] text-text-primary uppercase tracking-widest font-bold">
                 English (International)
              </div>
           </div>
           <div className="bg-bg-card border border-border-primary/50 rounded-3xl p-8 shadow-2xl shadow-accent/5">
              <div className="flex items-center gap-3 mb-6">
                 <Eye className="text-text-muted" size={16} />
                 <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-[2px]">UI Intensity</h4>
              </div>
              <div className="px-4 py-3 bg-bg-primary/30 border border-border-primary/50 rounded-xl text-[11px] text-text-primary uppercase tracking-widest font-bold">
                 Elite Theme Adaptive
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
                  className="flex items-center gap-2 text-accent-green"
                >
                   <ShieldCheck size={18} />
                   <span className="text-[10px] font-black uppercase tracking-[2px]">System preferences synchronized</span>
                </motion.div>
              )}
           </div>
           <button 
             onClick={handleSave}
             disabled={loading}
             className="px-10 py-4 bg-accent-green text-text-on-green text-[11px] font-black uppercase tracking-[2px] rounded-xl flex items-center gap-3 hover:bg-text-primary hover:text-bg-primary transition-all shadow-[0_10px_30px_var(--shadow-accent-glow)] disabled:opacity-50"
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
