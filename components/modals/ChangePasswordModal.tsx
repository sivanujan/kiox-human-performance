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
  const { user, supabase } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [oldPassword, setOldPassword] = useState("");
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

    if (!user?.email) {
      setError("Active user session not found.");
      return;
    }

    setLoading(true);
    try {
      // 1. Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword
      });

      if (signInError) {
        throw new Error("Old access code is incorrect.");
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
      
      setSuccess(true);
      setOldPassword("");
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
            className="relative z-10 w-full max-w-[450px] bg-bg-card border border-accent-green/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-border-primary/50 bg-bg-primary/50 relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-[1px] w-[20px] bg-gradient-to-r from-transparent to-accent-green"></div>
                <span className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Authentication</span>
              </div>
              <h2 className="font-sans text-text-primary text-3xl font-bold uppercase tracking-wider">
                Update <span className="text-accent-green">Security</span>
              </h2>
              
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1"
                >
                  <ShieldCheck size={16} />
                  Access Protocol Updated
                </motion.div>
              )}

              <div className="space-y-6">
                {/* Old Password */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Current Access Code</label>
                  <div className="relative flex items-center group">
                    <div className="absolute left-4 flex items-center justify-center pointer-events-none text-text-muted group-focus-within:text-accent-green transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current code"
                      className="w-full bg-bg-primary border border-border-primary/50 rounded-xl pl-11 pr-12 py-3 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-4 text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">New Access Code</label>
                  <div className="relative flex items-center group">
                    <div className="absolute left-4 flex items-center justify-center pointer-events-none text-text-muted group-focus-within:text-accent-green transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-bg-primary border border-border-primary/50 rounded-xl pl-11 pr-12 py-3 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Verify Protocol</label>
                  <div className="relative flex items-center group">
                    <div className="absolute left-4 flex items-center justify-center pointer-events-none text-text-muted group-focus-within:text-accent-green transition-colors">
                      <ShieldCheck size={18} />
                    </div>
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new code"
                      className="w-full bg-bg-primary border border-border-primary/50 rounded-xl pl-11 pr-12 py-3 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || success}
                className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>Authorize Update <Lock size={14} /></>
                )}
              </button>
            </form>

            <div className="px-8 pb-8">
              <p className="text-[9px] text-text-muted uppercase font-bold text-center leading-relaxed tracking-wider">
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
