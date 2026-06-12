"use client";

import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Activity, 
  Target, 
  Calendar, 
  Fingerprint, 
  Mail, 
  MapPin,
  Clock,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import ImageUpload from "@/components/ui/ImageUpload";
import TacticalModal from "@/components/ui/TacticalModal";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user_profile: any;
}

export default function UserProfileModal({ isOpen, onClose, user_profile }: UserProfileModalProps) {
  const [updating, setUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user_profile?.avatar_url || "");

  useEffect(() => {
    if (user_profile) setAvatarUrl(user_profile.avatar_url || "");
  }, [user_profile]);

  const handleAvatarChange = async (url: string) => {
    setAvatarUrl(url);
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user_profile.id, avatar_url: url })
      });
      if (!res.ok) throw new Error("Update failed");
      window.dispatchEvent(new CustomEvent('refresh-users'));
    } catch (err) {
      alert("Failed to update profile image.");
    } finally {
      setUpdating(false);
    }
  };

  const DetailItem = ({ icon: Icon, label, value, color = "text-accent-green" }: any) => (
    <div className="p-4 bg-bg-secondary border border-border-primary/50 rounded-2xl flex items-center gap-4 group hover:border-border-primary transition-all">
      <div className={`w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center ${color} shrink-0`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] md:text-[10px] font-bold text-text-secondary uppercase tracking-[2px]">{label}</p>
        <p className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider truncate">{value || "NOT SPECIFIED"}</p>
      </div>
    </div>
  );

  if (!user_profile) return null;

  return (
    <TacticalModal
      isOpen={isOpen}
      onClose={onClose}
      title={user_profile.first_name + " " + (user_profile.last_name || "")}
      subtitle="Elite Identity Verified"
      loading={updating}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-8">
        {/* Identity Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-border-primary/50">
           <div className="relative shrink-0">
              <ImageUpload 
                onUpload={handleAvatarChange}
                initialUrl={avatarUrl}
              />
              {updating && (
                <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                  <Loader2 size={12} className="animate-spin text-accent-green" />
                </div>
              )}
           </div>
           <div className="text-center sm:text-left">
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-4">
                 <span className="px-3 py-1 bg-accent-green/10 border border-accent-green/30 text-accent-green text-[9px] font-black uppercase tracking-widest rounded-full">{user_profile.role}</span>
                 <span className="px-3 py-1 bg-bg-secondary border border-border-primary/50 text-text-secondary text-[9px] font-black uppercase tracking-widest rounded-full">{user_profile.status}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
                Operational clearance verified by central authority. Biometric status: <span className="text-accent-green">Optimal</span>.
              </p>
           </div>
        </div>

        {/* Tactical Matrix Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <DetailItem icon={Fingerprint} label="Internal Identifier" value={user_profile.id.substring(0, 12) + "..."} color="text-amber-500" />
           <DetailItem icon={Mail} label="Tactical Tag" value={`@${user_profile.username || 'UNSET'}`} />
           <DetailItem icon={Target} label="Core Specialization" value={user_profile.position_played} color="text-red-500" />
           <DetailItem icon={Clock} label="Registry Date" value={new Date(user_profile.created_at).toLocaleDateString()} color="text-blue-500" />
        </div>

        {/* Biometric Narrative */}
        <div className="space-y-4">
           <div className="flex items-center gap-3 border-b border-border-primary/50 pb-2">
              <Activity className="text-accent-green" size={16} />
              <h3 className="text-text-primary text-[10px] font-black uppercase tracking-[2px]">Field Summary</h3>
           </div>
            <div className="p-6 bg-bg-secondary border border-border-primary/50 rounded-2xl">
              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-medium italic">
                 "{user_profile.bio || "No tactical briefing or biometric history recorded for this asset. Operating under standard clearance protocols."}"
              </p>
            </div>
        </div>

        {/* Network & Logistics */}
        <div className="space-y-4 pt-4 pb-8 md:pb-0">
           <div className="flex items-center gap-3 border-b border-border-primary/50 pb-2">
              <Calendar className="text-accent-green" size={16} />
              <h3 className="text-text-primary text-[10px] font-black uppercase tracking-[2px]">Operations & Authority</h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-bg-secondary p-4 rounded-2xl border border-border-primary/50">
                 <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[2px] mb-2">Command Staff</p>
                 <p className="text-xs font-bold text-text-primary uppercase tracking-widest truncate">{user_profile.assigned_staff || "Central Operations"}</p>
              </div>
              <div className="bg-bg-secondary p-4 rounded-2xl border border-border-primary/50">
                 <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[2px] mb-2">Access Priority</p>
                 <p className="text-xs font-bold text-text-primary uppercase tracking-widest">Level {user_profile.role === 'superadmin' ? 'MAX' : user_profile.role === 'staff' ? 'HIGH' : 'STD'}</p>
              </div>
           </div>
        </div>

        {/* Tactical Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border-primary/50">
           <div className="flex items-center gap-2 text-text-muted text-[8px] md:text-[9px] font-black uppercase tracking-[2px] flex-1">
              <MapPin size={12} className="shrink-0" /> Localized Deployment Hub • Active Link
           </div>
           <button 
             onClick={onClose}
             className="w-full sm:w-auto px-8 py-3 bg-bg-button-primary text-text-on-green text-[10px] font-black uppercase tracking-[2px] rounded-xl hover:bg-accent-green-dim transition-all active-scale"
           >
             Acknowledge
           </button>
        </div>
      </div>
    </TacticalModal>
  );
}
