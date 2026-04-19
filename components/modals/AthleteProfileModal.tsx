"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User as UserIcon,
  Fingerprint,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
  Target } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import ImageUpload from "@/components/ui/ImageUpload";


interface AthleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: () => void;
}

export default function AthleteProfileModal({
  isOpen,
  onClose,
  onChangePassword
}: AthleteProfileModalProps) {
  const { user, profile, refreshProfile, supabase } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    avatar_url: "",
    bio: "",
    position_played: "" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        username: profile.username || "",
        avatar_url: profile.avatar_url || "",
        bio: profile.bio || "",
        position_played: profile.position_played || "" });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, profile]);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          username: formData.username,
          avatar_url: formData.avatar_url,
          bio: formData.bio,
          position_played: formData.position_played,
          updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Profile Update Failed");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
          {/* Background Grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)",
              backgroundSize: "40px 40px" }}
          />

          <div
            className="absolute inset-0 z-0 cursor-pointer"
            onClick={() => !loading && onClose()}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-2xl bg-[#080808] border border-[rgba(34,197,94,0.3)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header / Identity Matrix */}
            <div className="p-8 border-b border-white/5 bg-gradient-to-br from-[#0A0A0A] to-black relative">
              <button
                onClick={onClose}
                disabled={loading}
                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <ImageUpload
                    onUpload={(url) =>
                      setFormData((p) => ({ ...p, avatar_url: url }))
                    }
                    initialUrl={formData.avatar_url}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1 text-[10px] font-black tracking-[4px] uppercase text-[#22c55e]">
                    Elite Identity Verified
                  </div>
                  <h2
                    className={`font-display text-4xl text-white uppercase tracking-wider mb-1`}
                  >
                    Modify Unit Profile
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-[9px] font-black uppercase tracking-widest rounded-full">LEVEL 1 CLEARANCE</span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest rounded-full">ACTIVE DUTY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Intelligence Briefing */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-20 h-20 bg-[#22c55e]/10 border-2 border-[#22c55e] rounded-full flex items-center justify-center text-[#22c55e] mb-6">
                    <CheckCircle2 size={40} className="animate-bounce" />
                  </div>
                  <h3
                    className={`font-display text-2xl text-white uppercase mb-2 tracking-widest`}
                  >
                    Identity Synchronized
                  </h3>
                  <p className="text-white/40 text-sm font-medium">
                    Your athlete profile has been updated globally.
                  </p>
                </motion.div>
              ) : (
                <form id="profile-form" onSubmit={handleSubmit} className="space-y-10">
                  {/* SECTION 1: CORE IDENTITY */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                       <UserIcon className="text-[#22c55e]" size={16} />
                       <h3 className={`font-sans text-white text-xs font-bold uppercase tracking-[2px]`}>Core Identity</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">First Name</label>
                        <input
                          type="text"
                          required
                          value={formData.first_name}
                          onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all uppercase font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">Last Name</label>
                        <input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all uppercase font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">Personnel Tag (Username)</label>
                      <div className="relative">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                          type="text"
                          required
                          value={formData.username}
                          onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, "_") }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all lowercase font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: OPERATIONAL INTEL */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                       <Target className="text-[#22c55e]" size={16} />
                       <h3 className={`font-sans text-white text-xs font-bold uppercase tracking-[2px]`}>Operations & Biometrics</h3>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">Tactical Position / Field Role</label>
                        <input
                          type="text"
                          placeholder="e.g. Midfielder / Unit Captain"
                          value={formData.position_played}
                          onChange={(e) => setFormData((p) => ({ ...p, position_played: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all uppercase font-bold placeholder:text-white/5"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">Biometric Summary (Bio)</label>
                        <textarea
                          rows={4}
                          placeholder="Brief mission profile or background briefing..."
                          value={formData.bio}
                          onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all font-medium placeholder:text-white/5 resize-none"
                        />
                    </div>
                  </div>

                  {/* SECTION 3: SYSTEM SECURITY */}
                  <div className="space-y-4 pt-4">
                     <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                        <ShieldCheck className="text-[#22c55e]" size={16} />
                        <h3 className={`font-sans text-white text-xs font-bold uppercase tracking-[2px]`}>Security Protocols</h3>
                     </div>
                     <button
                        type="button"
                        onClick={onChangePassword}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-[#22c55e]/30 transition-all"
                     >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#22c55e] transition-colors">
                              <Fingerprint size={20} />
                           </div>
                           <div className="text-left">
                              <p className="text-[11px] font-bold text-white uppercase tracking-wider">Update Access Credentials</p>
                              <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Modify your digital signature (Password)</p>
                           </div>
                        </div>
                        <CheckCircle2 size={16} className="text-gray-700 group-hover:text-[#22c55e] transition-colors" />
                     </button>
                  </div>
                </form>
              )}
            </div>

            {/* Persistence & Action Footer */}
            <div className="p-8 border-t border-white/5 bg-[#080808] flex gap-4">
              {!success && (
                <button
                  type="submit"
                  form="profile-form"
                  disabled={loading}
                  className="flex-1 py-4 bg-[#22c55e] text-black text-[12px] font-black uppercase tracking-[3px] rounded-xl hover:bg-white transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Encrypting Data...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Intelligence Matrix
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
