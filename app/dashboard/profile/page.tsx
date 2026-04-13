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
  AlertCircle,
  MoveVertical
} from "lucide-react";
import { Anton, Orbitron, Rajdhani } from "next/font/google";
import ImageUpload from "@/components/ui/ImageUpload";

const anton = Anton({ 
  weight: '400', 
  subsets: ['latin'] 
});

const orbitron = Orbitron({ subsets: ["latin"] });
const rajdhani = Rajdhani({ 
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"] 
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

  const handleAvatarUpload = async (url: string) => {
    if (!user?.id) return;
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      
      if (updateError) throw updateError;
      await refreshProfile();
    } catch (err) {
      console.error("Avatar update failed:", err);
    }
  };

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

  const inputClasses = "w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] transition-all outline-none placeholder:text-white/5 font-medium";
  const labelClasses = `${rajdhani.className} text-[11px] font-black text-[#00ff41] uppercase tracking-[3px] mb-2.5 block`;

  return (
    <div className="p-10 w-full min-h-screen">
      <div className="mb-12">
        <h2 className={`${orbitron.className} text-5xl text-white uppercase tracking-[0.1em] mb-3`}>Identity Registry</h2>
        <div className="flex items-center gap-4">
          <div className="h-[1px] w-20 bg-[#00ff41]/30" />
          <p className="text-[#00ff41] text-[10px] font-black uppercase tracking-[5px] opacity-80">Manage your athlete profile and performance metadata</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {/* Section: Personal Information */}
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111] border border-white/5 rounded-2xl p-10 relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <User size={120} />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
              <ImageUpload 
                onUpload={handleAvatarUpload}
                initialUrl={profile?.avatar_url}
              />
              <div>
                <h3 className={`${orbitron.className} text-[14px] font-black text-white uppercase tracking-[4px]`}>Personal Information</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[2px]">Update your biometric and identity credentials</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={labelClasses}>First Name</label>
                <input 
                  type="text" 
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className={inputClasses}
                  placeholder="EX: JOHN"
                />
              </div>
              <div>
                <label className={labelClasses}>Last Name</label>
                <input 
                  type="text" 
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className={inputClasses}
                  placeholder="EX: DOE"
                />
              </div>
              <div>
                <label className={labelClasses}>Username</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className={inputClasses}
                  placeholder="@OPERATIONAL_TAG"
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111] border border-white/5 rounded-2xl p-10 relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Target size={120} />
            </div>

            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 rounded-xl bg-[#00ff41]/5 border border-[#00ff41]/20 flex items-center justify-center text-[#00ff41]">
                <Target size={20} />
              </div>
              <h3 className={`${orbitron.className} text-[14px] font-black text-white uppercase tracking-[4px]`}>Performance Vitals</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00ff41]/30" size={18} />
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
                  <MoveVertical className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00ff41]/30" size={18} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClasses}>Primary Position</label>
                <input 
                  type="text" 
                  value={formData.position_played}
                  onChange={(e) => setFormData({...formData, position_played: e.target.value})}
                  className={inputClasses}
                  placeholder="PRIMARY OPERATIONAL ROLE"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClasses}>Strategic Training Goals</label>
                <textarea 
                  rows={4}
                  value={formData.training_goals}
                  onChange={(e) => setFormData({...formData, training_goals: e.target.value})}
                  className={`${inputClasses} resize-none`}
                  placeholder="DEFINE MISSION OBJECTIVES..."
                />
              </div>
            </div>

            {/* CTA Button moved inside the second card for tactical placement */}
            <div className="mt-10 pt-10 border-t border-white/5">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-[#00ff41] text-black text-[13px] font-black uppercase tracking-[4px] rounded-xl flex items-center justify-center gap-4 hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_40px_rgba(0,255,65,0.3)]"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Commit Registry Updates
              </button>
              
              <div className="mt-4 flex justify-center">
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-[#00ff41]"
                  >
                    <CheckCircle2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[3px]">Protocol Updated</span>
                  </motion.div>
                )}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-500"
                  >
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[3px]">{error}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.section>
        </div>

        {/* Section: Connectivity - Stacked below but formatted to fill width */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111]/50 border border-white/5 rounded-2xl p-10"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <Phone size={20} />
            </div>
            <h3 className={`${orbitron.className} text-[14px] font-black text-white/60 uppercase tracking-[4px]`}>Connectivity Matrix</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                placeholder="OPERATIONAL REGION"
              />
            </div>
            <div>
              <label className={labelClasses}>Full Address</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className={inputClasses}
                  placeholder="GRID COORDINATES"
                />
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-white/5" size={18} />
              </div>
            </div>
          </div>
        </motion.section>
      </form>
    </div>
  );
}
