"use client";

import { motion } from "framer-motion";
import { 
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
import { useEffect, useState } from "react";
import ImageUpload from "@/components/ui/ImageUpload";
import TacticalModal from "@/components/ui/TacticalModal";

interface AddAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddAthleteModal({ isOpen, onClose, onSuccess }: AddAthleteModalProps) {
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
      
      // Explicit alert just in case the email fails in dev
      alert(`Athlete Created Successfully!\n\nPlease save these credentials (in case the email fails):\nEmail: ${formData.email}\nUsername: ${formData.username}\nTemporary Password: ${formData.password}`);

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TacticalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Athlete"
      subtitle="System Protocol"
      loading={loading}
    >
      <div className="space-y-6">
        {/* Identity Header */}
        <div className="flex items-center gap-6 mb-8">
           <div className="flex-shrink-0">
              <ImageUpload 
                onUpload={(url) => setFormData(p => ({ ...p, avatar_url: url }))}
                initialUrl={formData.avatar_url}
              />
           </div>
           <div className="min-w-0">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Upload Identification</p>
              <p className="text-xs text-white/40 leading-relaxed">Agent avatar will be visible across the tactical dashboard.</p>
           </div>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-20 h-20 bg-[#22c55e]/10 border-2 border-[#22c55e] rounded-full flex items-center justify-center text-[#22c55e] mb-6">
              <CheckCircle2 size={40} className="animate-bounce" />
            </div>
            <h3 className="font-display text-2xl text-white uppercase mb-2 tracking-widest">Protocol Initialized</h3>
            <p className="text-white/40 text-sm font-black uppercase tracking-widest">Agent added to global registry.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">First Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
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

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">Last Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
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

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">Username (Operational Tag)</label>
              <div className="relative">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
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

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
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

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] ml-1">Temporary Password</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
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
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all active-scale"
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
              className="w-full py-4 bg-[#22c55e] text-black text-[12px] font-black uppercase tracking-[3px] rounded-xl hover:bg-white transition-all shadow-[0_10px_30px_rgba(34,197,94,0.2)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active-scale"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Syncing Matrix...
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
    </TacticalModal>
  );
}
