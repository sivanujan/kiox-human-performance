"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";



interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { supabase } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Failed to update password.");
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          {/* Background Decor */}
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
            className="relative z-10 w-full max-w-[450px] bg-[#080808] border border-[rgba(34,197,94,0.2)] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-[#0A0A0A] relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-[1px] w-[20px] bg-gradient-to-r from-transparent to-[#22c55e]"></div>
                <span className="text-[#22c55e] text-[10px] tracking-[0.4em] font-bold uppercase">Authentication</span>
              </div>
              <h2 className={`font-sans text-white text-3xl font-bold uppercase tracking-wider`}>
                Update <span className="text-[#22c55e]">Security</span>
              </h2>
              
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[11px] font-bold uppercase tracking-wider"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-4 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl text-[#22c55e] text-[11px] font-bold uppercase tracking-wider"
                >
                  <ShieldCheck size={16} />
                  Access Protocol Updated
                </motion.div>
              )}

              <div className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-[2px] ml-1">New Access Code</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors">
                      <Lock size={16} />
                    </div>
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-black border border-white/10 rounded-xl pl-11 pr-12 py-4 text-sm text-white font-bold tracking-widest outline-none focus:border-[#22c55e]/50 transition-all placeholder:text-gray-700"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-[2px] ml-1">Verify Protocol</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors">
                      <ShieldCheck size={16} />
                    </div>
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new code"
                      className="w-full bg-black border border-white/10 rounded-xl pl-11 pr-12 py-4 text-sm text-white font-bold tracking-widest outline-none focus:border-[#22c55e]/50 transition-all placeholder:text-gray-700"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || success}
                className="w-full py-4 bg-[#22c55e] text-black text-[11px] font-black uppercase tracking-[3px] rounded-xl flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_10px_30px_rgba(34,197,94,0.2)] disabled:opacity-50 disabled:grayscale"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>Authorize Update <Lock size={14} /></>
                )}
              </button>
            </form>

            <div className="px-8 pb-8">
              <p className="text-[9px] text-gray-500 uppercase font-bold text-center leading-relaxed tracking-wider">
                Updating your security credentials will secure all active sessions and encrypt your profile with the new digital signature.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}
