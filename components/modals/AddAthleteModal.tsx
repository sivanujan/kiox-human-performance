"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Lock,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Fingerprint
} from "lucide-react";
import { Anton, Plus_Jakarta_Sans } from "next/font/google";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import ImageUpload from "@/components/ui/ImageUpload";

const anton = Anton({ weight: '400', subsets: ['latin'] });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

interface AddAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddAthleteModal({ isOpen, onClose, onSuccess }: AddAthleteModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    avatar_url: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        password: generatePassword(),
        avatar_url: ""
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGeneratePassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setFormData(prev => ({ ...prev, password: generatePassword() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "athlete" })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create athlete");
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
      
      // Close after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
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
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
            backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          {/* Close Area */}
          <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => !loading && onClose()} />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-xl bg-[#080808] border border-[rgba(34,197,94,0.2)] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-gradient-to-br from-[#0A0A0A] to-black relative">
               <button 
                 onClick={onClose}
                 disabled={loading}
                 className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors disabled:opacity-50"
               >
                 <X size={24} />
               </button>

                <div className="flex items-center gap-6">
                   <div className="flex-shrink-0">
                      <ImageUpload 
                        onUpload={(url) => setFormData(p => ({ ...p, avatar_url: url }))}
                        initialUrl={formData.avatar_url}
                      />
                   </div>
                   <div>
                     <div className="flex items-center gap-3 mb-1 text-[10px] font-black tracking-[4px] uppercase text-[#22c55e]">
                       System Protocol
                     </div>
                     <h2 className={`${anton.className} text-3xl text-white uppercase tracking-wider mb-1`}>
                       Add New Athlete
                     </h2>
                   </div>
                </div>
            </div>

            {/* Form Content */}
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
                  <h3 className={`${anton.className} text-2xl text-white uppercase mb-2 tracking-widest`}>Protocol Initialized</h3>
                  <p className="text-white/40 text-sm font-medium">The athlete has been successfully added to the registry.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-[2px] ml-1">First Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input 
                          type="text"
                          required
                          value={formData.first_name}
                          onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))}
                          placeholder="EX: JOHN"
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all uppercase placeholder:text-white/5 font-bold"
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-[2px] ml-1">Last Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input 
                          type="text"
                          required
                          value={formData.last_name}
                          onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))}
                          placeholder="EX: DOE"
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all uppercase placeholder:text-white/5 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-[2px] ml-1">Username (Operational Tag)</label>
                    <div className="relative">
                      <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                      <input 
                        type="text"
                        required
                        value={formData.username}
                        onChange={e => setFormData(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                        placeholder="EX: JOHNDOE_24"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all lowercase placeholder:text-white/5 font-bold"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-[2px] ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                      <input 
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                        placeholder="EX: ATHLETE@KIOX.COM"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all uppercase placeholder:text-white/5 font-bold"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-[2px] ml-1">Temporary Password</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input 
                          type="text"
                          required
                          value={formData.password}
                          onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none transition-all font-mono font-bold"
                        />
                      </div>
                      <button 
                        onClick={handleGeneratePassword}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        title="Regenerate Password"
                      >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-wider">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#22c55e] text-black text-[12px] font-black uppercase tracking-[3px] rounded-xl hover:bg-white transition-all shadow-[0_10px_30px_rgba(34,197,94,0.2)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Initializing Matrix...
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Initialize Protocol
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
