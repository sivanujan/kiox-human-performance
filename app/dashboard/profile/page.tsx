"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Shield, 
  Phone, 
  MapPin, 
  Ruler, 
  Weight, 
  Target, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Anton } from "next/font/google";

const anton = Anton({ 
  weight: '400', 
  subsets: ['latin'] 
});

export default function ProfilePage() {
  const { user, profile, refreshProfile, supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    date_of_birth: "",
    phone_number: "",
    address: "",
    country: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    height: "",
    weight: "",
    position_played: "",
    training_goals: "",
    medical_history: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        username: profile.username || "",
        date_of_birth: profile.date_of_birth || "",
        phone_number: profile.phone_number || "",
        address: profile.address || "",
        country: profile.country || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
        height: profile.height?.toString() || "",
        weight: profile.weight?.toString() || "",
        position_played: profile.position_played || "",
        training_goals: profile.training_goals || "",
        medical_history: profile.medical_history || ""
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          ...formData,
          height: formData.height ? parseFloat(formData.height) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all outline-none placeholder:text-white/10";
  const labelClasses = "text-[10px] font-black text-[#22c55e] uppercase tracking-[2px] mb-2 block";

  return (
    <div className="p-10 max-w-4xl">
      <div className="mb-10">
        <h2 className={`${anton.className} text-4xl text-white uppercase tracking-wider mb-2`}>Identity Registry</h2>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[3px]">Manage your athlete profile and performance metadata</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section: Personal Information */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-white/5 rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
            <User className="text-[#22c55e]" size={18} />
            <h3 className="text-[11px] font-black text-white uppercase tracking-[3px]">Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>First Name</label>
              <input 
                type="text" 
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className={inputClasses}
                placeholder="Ex: John"
              />
            </div>
            <div>
              <label className={labelClasses}>Last Name</label>
              <input 
                type="text" 
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className={inputClasses}
                placeholder="Ex: Doe"
              />
            </div>
            <div>
              <label className={labelClasses}>Username</label>
              <input 
                type="text" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className={inputClasses}
                placeholder="@handle"
              />
            </div>
            <div>
              <label className={labelClasses}>Date of Birth</label>
              <input 
                type="date" 
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                className={inputClasses}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </motion.section>

        {/* Section: Performance Vitals */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111] border border-white/5 rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
            <Target className="text-[#22c55e]" size={18} />
            <h3 className="text-[11px] font-black text-white uppercase tracking-[3px]">Performance Vitals</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className={labelClasses}>Height (CM)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  className={inputClasses}
                  placeholder="185"
                />
                <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10" size={16} />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Weight (KG)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className={inputClasses}
                  placeholder="85"
                />
                <Weight className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10" size={16} />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>Primary Position</label>
              <input 
                type="text" 
                value={formData.position_played}
                onChange={(e) => setFormData({...formData, position_played: e.target.value})}
                className={inputClasses}
                placeholder="Ex: Striker / Point Guard"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>Strategic Training Goals</label>
              <textarea 
                rows={3}
                value={formData.training_goals}
                onChange={(e) => setFormData({...formData, training_goals: e.target.value})}
                className={`${inputClasses} resize-none`}
                placeholder="Describe your objectives..."
              />
            </div>
          </div>
        </motion.section>

        {/* Section: Connectivity & Base */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111] border border-white/5 rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
            <Phone className="text-[#22c55e]" size={18} />
            <h3 className="text-[11px] font-black text-white uppercase tracking-[3px]">Connectivity & Base</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Primary Liaison (Phone)</label>
              <input 
                type="tel" 
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                className={inputClasses}
                placeholder="+00 000 000 000"
              />
            </div>
            <div>
              <label className={labelClasses}>Deploy Base (Country)</label>
              <input 
                type="text" 
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className={inputClasses}
                placeholder="Ex: United Kingdom"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>Full Address</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className={inputClasses}
                  placeholder="Street, City, Postcode"
                />
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10" size={16} />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section: Emergency Protocol */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-red-500/10">
            <Shield className="text-red-500" size={18} />
            <h3 className="text-[11px] font-black text-red-500 uppercase tracking-[3px]">Emergency Protocol</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`${labelClasses} text-red-500/60`}>Emergency Contact Name</label>
              <input 
                type="text" 
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                className={`${inputClasses} border-red-500/20 focus:border-red-500 focus:ring-red-500`}
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className={`${labelClasses} text-red-500/60`}>Emergency Contact Phone</label>
              <input 
                type="tel" 
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                className={`${inputClasses} border-red-500/20 focus:border-red-500 focus:ring-red-500`}
                placeholder="+00 000 000 000"
              />
            </div>
          </div>
        </motion.section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 sticky bottom-6 z-20">
          <div className="flex-1">
            {success && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-[#22c55e]"
              >
                <CheckCircle2 size={18} />
                <span className="text-[10px] font-black uppercase tracking-[2px]">Core registry updated successfully</span>
              </motion.div>
            )}
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-red-500"
              >
                <AlertCircle size={18} />
                <span className="text-[10px] font-black uppercase tracking-[2px]">{error}</span>
              </motion.div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-[#22c55e] text-black text-[11px] font-black uppercase tracking-[2px] rounded-xl flex items-center gap-3 hover:bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(34,197,94,0.3)]"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Commit Registry Updates
          </button>
        </div>
      </form>
    </div>
  );
}
