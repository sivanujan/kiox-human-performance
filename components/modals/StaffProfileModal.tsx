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
  LogOut } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import ImageUpload from "@/components/ui/ImageUpload";


interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StaffProfileModal({
  isOpen,
  onClose }: StaffProfileModalProps) {
  const { user, profile, refreshProfile, signOut, supabase } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    avatar_url: "" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        username: profile.username || "",
        avatar_url: profile.avatar_url || "" });
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

          {/* Close backdrop */}
          <div
            className="absolute inset-0 z-0 cursor-pointer"
            onClick={() => !loading && onClose()}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-xl bg-[#080808] border border-[rgba(34,197,94,0.3)] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
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
                    Staff Identity Matrix
                  </div>
                  <h2
                    className={`font-display text-3xl text-white uppercase tracking-wider mb-1`}
                  >
                    Modify Staff Profile
                  </h2>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[2px]">
                    {profile?.role === "superadmin"
                      ? "Super Admin"
                      : "Performance Staff"}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-8 space-y-6">
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
                    Your staff profile has been updated successfully.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">
                        First Name
                      </label>
                      <div className="relative">
                        <UserIcon
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                          size={16}
                        />
                        <input
                          type="text"
                          required
                          value={formData.first_name}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              first_name: e.target.value }))
                          }
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all uppercase placeholder:text-white/5 font-bold"
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">
                        Last Name
                      </label>
                      <div className="relative">
                        <UserIcon
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                          size={16}
                        />
                        <input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              last_name: e.target.value }))
                          }
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all uppercase placeholder:text-white/5 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">
                      Operational Tag (Username)
                    </label>
                    <div className="relative">
                      <Fingerprint
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                        size={16}
                      />
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            username: e.target.value
                              .toLowerCase()
                              .replace(/\s/g, "_") }))
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all lowercase placeholder:text-white/5 font-bold"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-wider">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm("Are you sure you want to log out of your session?")) {
                          await signOut();
                        }
                      }}
                      className="px-6 py-4 bg-red-950/20 border border-red-500/30 text-red-500 text-[12px] font-black uppercase tracking-[3px] rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-[0_10px_30px_rgba(239,68,68,0.1)] flex items-center justify-center gap-3"
                    >
                      <LogOut size={16} />
                      Log Out
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 bg-[#22c55e] text-black text-[12px] font-black uppercase tracking-[3px] rounded-xl hover:bg-white transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Encrypting Data...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Profile Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer Badge */}
            <div className="p-6 border-t border-white/5 bg-[#080808] flex items-center justify-center gap-3 opacity-20 text-[9px] font-bold uppercase tracking-[4px]">
              <ShieldCheck size={14} /> Level 3 Staff Clearance Verified
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
