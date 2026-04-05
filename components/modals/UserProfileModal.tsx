"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  User as UserIcon, 
  ShieldCheck, 
  Trophy, 
  Activity, 
  Target, 
  Calendar, 
  Fingerprint, 
  Mail, 
  MapPin,
  Clock
} from "lucide-react";
import { Anton, Plus_Jakarta_Sans } from "next/font/google";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

const anton = Anton({ weight: '400', subsets: ['latin'] });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user_profile: any;
}

export default function UserProfileModal({ isOpen, onClose, user_profile }: UserProfileModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user_profile) return null;

  const DetailItem = ({ icon: Icon, label, value, color = "text-[#22c55e]" }: any) => (
    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-4 group hover:border-white/10 transition-all">
      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[2px]">{label}</p>
        <p className="text-sm font-bold text-white uppercase tracking-wider">{value || "NOT SPECIFIED"}</p>
      </div>
    </div>
  );

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
            backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          {/* Close Area */}
          <div className="absolute inset-0 z-0 cursor-pointer" onClick={onClose} />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-2xl bg-[#080808] border border-[rgba(34,197,94,0.2)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header / Identity */}
            <div className="p-8 border-b border-white/5 bg-gradient-to-br from-[#0A0A0A] to-black relative">
               <button 
                 onClick={onClose}
                 className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"
               >
                 <X size={24} />
               </button>

               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-[#22c55e]/10 border-2 border-[#22c55e] flex items-center justify-center text-[#22c55e] shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                     {user_profile.role === 'superadmin' ? <ShieldCheck size={32} /> : 
                      user_profile.role === 'staff' ? <Trophy size={32} /> : <UserIcon size={32} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1 text-[10px] font-black tracking-[4px] uppercase text-[#22c55e]">
                      Elite Identity Verified
                    </div>
                    <h2 className={`${anton.className} text-4xl text-white uppercase tracking-wider mb-1`}>
                      {user_profile.first_name} {user_profile.last_name || 'IDENTITY UNSET'}
                    </h2>
                    <div className="flex items-center gap-3">
                       <span className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-[9px] font-black uppercase tracking-widest rounded-full">{user_profile.role}</span>
                       <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest rounded-full">{user_profile.status}</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Scrollable Details */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar footer-safe">
               {/* Metadata Section */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem icon={Fingerprint} label="System Internal ID" value={user_profile.id.substring(0, 18) + "..."} color="text-amber-500" />
                  <DetailItem icon={Mail} label="Operational Tag" value={`@${user_profile.username || 'NOT_SET'}`} />
                  <DetailItem icon={Target} label="Field Position" value={user_profile.position_played} color="text-red-500" />
                  <DetailItem icon={Clock} label="Registry Active" value={new Date(user_profile.created_at).toLocaleDateString()} color="text-blue-500" />
               </div>

               {/* Bio/Info Section */}
               <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                     <Activity className="text-[#22c55e]" size={16} />
                     <h3 className={`${plusJakarta.className} text-white text-xs font-bold uppercase tracking-[2px]`}>Background Protocol</h3>
                  </div>
                  <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                     <p className="text-sm text-white/60 leading-relaxed font-medium">
                        {user_profile.bio || "No biometric summary or background briefing available for this entity. System logs indicate standard operational clearance."}
                     </p>
                  </div>
               </div>

               {/* Enterprise Matrix */}
               <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                     <Calendar className="text-[#22c55e]" size={16} />
                     <h3 className={`${plusJakarta.className} text-white text-xs font-bold uppercase tracking-[2px]`}>Operations & Logistics</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[2px] mb-2">Assigned Authority</p>
                        <p className="text-sm font-bold text-white uppercase tracking-widest">{user_profile.assigned_staff || "DIRECT SYSTEM CARE"}</p>
                     </div>
                     <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[2px] mb-2">Access Level</p>
                        <p className="text-sm font-bold text-white uppercase tracking-widest">Level {user_profile.role === 'superadmin' ? '5' : user_profile.role === 'staff' ? '3' : '1'} Clearance</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Footer Footer */}
            <div className="p-8 border-t border-white/5 bg-[#0A0A0A] flex justify-between items-center">
               <div className="flex items-center gap-2 text-white/20 text-[9px] font-bold uppercase tracking-widest">
                  <MapPin size={12} /> GLOBAL REGISTRY • STABLE DEPLOYMENT
               </div>
               <button 
                 onClick={onClose}
                 className="px-8 py-3 bg-[#22c55e] text-black text-[10px] font-black uppercase tracking-[2px] rounded-xl hover:bg-white transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)]"
               >
                 Close Briefing
               </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
