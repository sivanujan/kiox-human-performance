"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  User, Mail, Lock, Phone, MapPin,
  ChevronRight, ChevronLeft, Check,
  Calendar, Activity, ShieldCheck,
  AlertCircle, Loader2, Eye, EyeOff
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

const countries = [
  { name: "SRILANKA", code: "+94" },
  { name: "UNITED ARAB EMIRATES", code: "+971" },
  { name: "QATAR", code: "+974" },
  { name: "OMAN", code: "+968" },
  { name: "KUWAIT", code: "+965" },
  { name: "SAUDI ARABIA", code: "+966" },
  { name: "UNITED STATES", code: "+1" },
  { name: "UNITED KINGDOM", code: "+44" },
  { name: "AUSTRALIA", code: "+61" },
  { name: "GERMANY", code: "+49" },
  { name: "SINGAPORE", code: "+65" },
  { name: "MALAYSIA", code: "+60" },
  { name: "INDIA", code: "+91" },
];

type Step = 1 | 2 | 3 | 4 | 5;

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "WEAK", color: "#ef4444" });
  
  // Registration Data
  const [formData, setFormData] = useState({
    // Step 1
    email: "",
    password: "",
    confirmPassword: "",
    // Step 3
    firstName: "",
    lastName: "",
    dob: "",
    username: "",
    // Step 4
    phone: "",
    countryCode: "+94",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "SRILANKA",
    emergencyName: "",
    emergencyCountryCode: "+94",
    emergencyPhone: "",
    // Step 5
    height: "",
    weight: "",
    position: "",
    goals: "",
    medicalHistory: "",
    waiverAccepted: false
  });

  const { user, profile, loading: authLoading, refreshProfile, supabase } = useAuth();
  const router = useRouter();

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'countryCode') {
      const selectedCountry = countries.find(c => c.code === value);
      setFormData(prev => ({
        ...prev,
        countryCode: value,
        country: selectedCountry ? selectedCountry.name : prev.country
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    if (name === 'password') {
       calculateStrength(value);
    }
  };

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 6) score++;
    if (pass.length > 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    let strength = { score: 0, label: "WEAK", color: "#ef4444" };
    if (score <= 2) strength = { score: 25, label: "WEAK", color: "#ef4444" };
    else if (score <= 4) strength = { score: 60, label: "MEDIUM", color: "#f97316" };
    else strength = { score: 100, label: "STRONG", color: "#22c55e" };

    if (pass.length === 0) strength = { score: 0, label: "EMPTY", color: "#333" };
    setPasswordStrength(strength);
  };

  // Step 1: Sign Up Logic
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    if (passwordStrength.label === "WEAK") {
      setErrorMsg("Password is too weak. Add more characters, numbers or symbols.");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");
    
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined,
        data: {
          full_name: `${formData.firstName} ${formData.lastName}`.trim()
        }
      }
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStep(2);
    }
    setLoading(false);
  };

  // Initial Session Check & Pre-fill
  useEffect(() => {
    if (!authLoading && user) {
      // ENFORCE EMAIL CONFIRMATION: If email is not confirmed, stay/go to step 2
      if (!user.email_confirmed_at) {
        setStep(2);
        return;
      }

      if (profile) {
        // 1. ADMIN/STAFF BYPASS: Managers should NEVER see the athlete onboarding flow
        if (profile.role === 'superadmin' || profile.role === 'staff') {
          router.push('/admin');
          return;
        }

        // 2. ATHLETE COMPLETION CHECK
        const requiredFields = [
          'first_name', 'last_name', 'username', 'date_of_birth',
          'phone_number', 'address', 'country',
          'emergency_contact_name', 'emergency_contact_phone',
          'height', 'weight', 'position_played', 'training_goals'
        ];

        const isComplete = requiredFields.every((field: string) => {
          const value = (profile as any)[field];
          return value !== null && value !== undefined && value !== '';
        });

        if (isComplete) {
          router.push('/dashboard');
          return;
        }

        // Pre-fill form with existing data
        setFormData(prev => ({
          ...prev,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          username: profile.username || '',
          dob: profile.date_of_birth || '',
          phone: profile.phone_number ? profile.phone_number.replace(/^\+?\d+/, '') : '',
          countryCode: profile.phone_number?.match(/^\+\d+/)?.[0] || '+94',
          addressLine1: profile.address?.split(',')[0] || '',
          city: profile.address?.split(',')[1]?.trim() || '',
          state: profile.address?.split(',')[2]?.trim() || '',
          country: profile.country || 'SRILANKA',
          emergencyName: profile.emergency_contact_name || '',
          emergencyPhone: profile.emergency_contact_phone ? profile.emergency_contact_phone.replace(/^\+?\d+/, '') : '',
          emergencyCountryCode: profile.emergency_contact_phone?.match(/^\+\d+/)?.[0] || '+94',
          height: profile.height?.toString() || '',
          weight: profile.weight?.toString() || '',
          position: profile.position_played || '',
          goals: profile.training_goals || '',
          medicalHistory: profile.medical_history || '' }));
        
        // User is logged in and confirmed but profile incomplete (and is an athlete)
        if (step < 3) setStep(3);
      } else {
        // Logged in and confirmed but no profile at all
        if (step < 3) setStep(3);
      }
    }
  }, [user, profile, authLoading, router]);

  // Email verification polling (step 2)
  useEffect(() => {
    if (step === 2) {
      if (resendTimer > 0) {
        const timerId = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        return () => clearTimeout(timerId);
      }

      if (user && user.email_confirmed_at) {
        setStep(3);
      }
    }
  }, [step, user, resendTimer]);

  const handleResendEmail = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: formData.email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined }
    });

    if (error) {
       setErrorMsg(error.message);
    } else {
       setSuccessMsg("Verification link resent. Check your inbox.");
       setResendTimer(150); // 2 mins 30 secs
    }
    setLoading(false);
  };

  const handleDevVerify = async () => {
    if (!user?.id) return;
    setLoading(true);
    
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, confirmEmail: true }) });

    if (res.ok) {
       setSuccessMsg("System Overridden. Initializing Profile Setup...");
       setTimeout(() => setStep(3), 1000);
    } else {
       const err = await res.json();
       setErrorMsg(`Override Failed: ${err.error || "Manual verification failed"}`);
    }
    setLoading(false);
  };

  // Step 3-5: Profile Update Logic
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (!user) {
        setErrorMsg("System Session Expired. Please Re-authenticate.");
        setLoading(false);
        return;
      }

      // Sanitize Numerical Inputs to prevent NaN
      const h = parseFloat(formData.height);
      const w = parseFloat(formData.weight);

      const updates = {
        id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dob,
        address: `${formData.addressLine1}${formData.addressLine2 ? ', ' + formData.addressLine2 : ''}, ${formData.city}, ${formData.state}`,
        country: formData.country,
        phone_number: `${formData.countryCode}${formData.phone}`.replace(/\s+/g, ''),
        emergency_contact_name: formData.emergencyName,
        emergency_contact_phone: `${formData.emergencyCountryCode}${formData.emergencyPhone}`.replace(/\s+/g, ''),
        username: formData.username.toLowerCase().trim(),
        height: isNaN(h) ? null : h,
        weight: isNaN(w) ? null : w,
        position_played: formData.position,
        training_goals: formData.goals,
        medical_history: formData.medicalHistory,
        waiver_accepted: formData.waiverAccepted,
        updated_at: new Date().toISOString() };

      const { error: upsertError } = await supabase.from('profiles').upsert(updates);

      // Always stop loading once DB action completes
      setLoading(false);

      if (upsertError) {
        setErrorMsg(upsertError.message);
      } else {
        setSuccessMsg("Registry Synchronized. Security Protocols Verified.");
        
        // Non-blocking profile refresh
        refreshProfile().catch(console.error);

        // Immediate redirect attempt
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Submission error details:", err);
      setErrorMsg(`Protocol Synchronous Error: ${err.message || 'Unknown protocol failure'}`);
      setLoading(false);
    }
  };

  // Animation Variants
  const slideVariants: Variants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0 }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeIn" }
    })
  };

  const [direction, setDirection] = useState(1);

  const nextStep = () => {
    setDirection(1);
    setStep(prev => (prev + 1) as Step);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(prev => (prev - 1) as Step);
  };

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor - Match to signin */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#22c55e]/5 blur-[120px] rounded-full" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-[500px]">
        {/* Logo - Match to signin */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full border border-white/20 bg-black/50 flex items-center justify-center overflow-hidden">
              <Image src="/newlogo.png" alt="KIO-X" width={40} height={40} className="object-contain" priority unoptimized={true} />
            </div>
            <span className="font-display text-3xl text-white group-hover:text-[#22c55e] transition-colors">KIO-X</span>
          </Link>
          <div className="mt-4 font-label text-[#22c55e] opacity-60">Step {step} of 5</div>
        </div>

        {/* Card - Match to signin */}
        <div className="bg-[#111111] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl">
          {/* Progress Bar (Subtle) */}
          <div className="h-[2px] w-full bg-white/5">
            <motion.div 
              initial={{ width: "20%" }} 
              animate={{ width: `${(step / 5) * 100}%` }} 
              className="h-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
            />
          </div>

          <div className="p-8 md:p-12">
            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 font-label text-center flex items-center justify-center gap-2">
                <AlertCircle size={14} /> {errorMsg}
              </motion.div>
            )}

            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div key="step1" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl text-white mb-1">Create Account</h2>
                    <p className="font-label text-gray-500">Phase One: Access Credentials</p>
                  </div>
                  <form onSubmit={handleSignUp} className="space-y-6">
                    <div className="space-y-2">
                       <label className="block font-label text-[#22c55e] font-bold">Email Address</label>
                       <div className="relative group">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                         <input name="email" value={formData.email} onChange={handleChange} required type="email" placeholder="name@example.com" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans font-medium" />
                       </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block font-label text-[#22c55e] font-bold">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                        <input name="password" value={formData.password} onChange={handleChange} required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans font-medium" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {/* Strength Bar */}
                      <div className="space-y-1.5 px-1">
                        <div className="flex justify-between items-center text-[8px] font-black tracking-[1px] uppercase">
                          <span className="text-gray-400">Security Level</span>
                          <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                        </div>
                        <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength.score}%`, backgroundColor: passwordStrength.color }}
                            className="h-full"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block font-label text-[#22c55e] font-bold">Confirm Password</label>
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                          <span className="font-label text-[#ef4444] animate-pulse">Mismatch</span>
                        )}
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                        <input name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans font-medium" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-[#22c55e] text-black font-button py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] hover:scale-[1.02] disabled:opacity-50 transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                      {loading ? <Loader2 className="animate-spin" /> : <>Next <ChevronRight size={18} /></>}
                    </button>
                    <p className="text-center text-[10px] font-bold text-gray-500 tracking-[2px] uppercase">
                      Already have an account? <Link href="/signin" className="text-[#22c55e] hover:underline">Sign In</Link>
                    </p>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center py-6">
                  <div className="w-20 h-20 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                    <Mail className="text-[#22c55e]" size={32} />
                  </div>
                  <h2 className="font-display text-2xl text-white mb-4">Verify Email</h2>
                   <p className="text-gray-400 font-label leading-relaxed mb-6">
                    Transmission sent to <br /><span className="text-white font-bold">{formData.email}</span>
                  </p>
                  <div className="mb-10 p-5 bg-white/5 border border-white/5 rounded-2xl text-left space-y-4">
                     <div className="flex items-center gap-2 text-[10px] font-black text-[#22c55e] uppercase tracking-widest">
                       <ShieldCheck size={14} /> Protocol Verification Guide
                     </div>
                     <div className="space-y-3">
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-[1px] leading-relaxed">
                           1. <span className="text-white">Check Spam Registry</span>: Verify your spam/junk folders. Links often end up there.
                        </p>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-[1px] leading-relaxed">
                           2. <span className="text-white">Rate Limits</span>: Supabase restricts verification emails to 3 per hour. Wait 15 minutes before retrying.
                        </p>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-[1px] leading-relaxed">
                           3. <span className="text-white">SMTP Alignment</span>: If using custom SMTP, ensure the <span className="text-[#22c55e]">Sender Name/Email</span> in the Supabase Dashboard matches your SMTP user.
                        </p>
                     </div>
                  </div>
                    <div className="flex flex-col items-center gap-6">
                      <div className="flex items-center gap-3 font-label text-[#22c55e]">
                        <Loader2 className="animate-spin" size={16} />
                        Waiting for uplink...
                      </div>
                      
                      <div className="w-full max-w-sm space-y-4 mt-6">
                         <button 
                           onClick={handleResendEmail} 
                           disabled={loading || resendTimer > 0} 
                           className="w-full py-4 font-label border border-white/10 text-gray-500 hover:text-white hover:border-[#22c55e]/50 disabled:opacity-30 transition-all rounded-xl"
                         >
                           {resendTimer > 0 ? `Resend Link In ${Math.floor(resendTimer/60)}:${(resendTimer%60).toString().padStart(2, '0')}` : "Resend Verification Email"}
                         </button>

                         <button 
                           onClick={prevStep} 
                           className="w-full py-2 text-[8px] font-black uppercase tracking-[2px] text-gray-500 hover:text-[#22c55e] transition-colors"
                         >
                           Wrong email? Edit Address
                         </button>

                         {/* Developer Bypass (Localhost Only) */}
                         {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                           <div className="pt-8 border-t border-white/5 mt-8">
                              <p className="text-[8px] font-black text-amber-500 uppercase tracking-[2px] mb-3">Developer Mode Active</p>
                              <button 
                                onClick={handleDevVerify}
                                className="w-full py-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase tracking-[3px] rounded-xl hover:bg-amber-500 hover:text-black transition-all"
                              >
                                Manual Dev Override (Bypass Email)
                              </button>
                           </div>
                         )}
                      </div>
                    </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl text-white mb-1">Personal Identity</h2>
                    <p className="font-label text-gray-500">Phase Three: Base Profile</p>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="block font-label text-[#22c55e] font-bold">First Name <span className="text-red-500">*</span></label>
                         <input name="firstName" value={formData.firstName} onChange={handleChange} required type="text" placeholder="First Name" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm font-medium" />
                      </div>
                      <div className="space-y-2">
                         <label className="block font-label text-[#22c55e] font-bold">Last Name <span className="text-red-500">*</span></label>
                         <input name="lastName" value={formData.lastName} onChange={handleChange} required type="text" placeholder="Last Name" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="block font-label text-[#22c55e] font-bold">Username <span className="text-red-500">*</span></label>
                       <div className="relative group">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                         <input name="username" value={formData.username} onChange={handleChange} required type="text" placeholder="CHOOSE_A_HANDLE" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm font-medium lowercase" />
                       </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block font-label text-[#22c55e]">Date of Birth <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors pointer-events-none" size={18} />
                        <input 
                          name="dob" 
                          value={formData.dob} 
                          onChange={handleChange} 
                          required 
                          type="date" 
                          className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm [color-scheme:dark]" 
                        />
                      </div>
                    </div>
                    <button 
                      onClick={nextStep} 
                      disabled={!formData.firstName || !formData.lastName || !formData.dob || !formData.username}
                      className="w-full bg-[#22c55e] text-black font-button py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                    >
                      Continue <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl text-white mb-1">Connectivity</h2>
                    <p className="font-label text-gray-400">Phase Four: Contact Details</p>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block font-label text-[#22c55e]">Phone Number <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          <select 
                            name="countryCode" 
                            value={formData.countryCode} 
                            onChange={handleChange}
                            className="w-[110px] bg-black/30 border border-white/10 rounded-xl py-4 px-3 text-white focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm appearance-none cursor-pointer"
                          >
                            {countries.map(c => (
                              <option key={c.code} value={c.code} className="bg-[#111] text-white">
                                {c.code} ({c.name.substring(0, 3)})
                              </option>
                            ))}
                          </select>
                          <input 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleChange} 
                            required 
                            type="tel" 
                            placeholder="77 123 4567" 
                            className="flex-1 bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm font-medium" 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Address Line 1 */}
                      <div className="space-y-2">
                        <label className="block font-label text-[#22c55e]">Address Line 1 <span className="text-red-500">*</span></label>
                        <input name="addressLine1" value={formData.addressLine1} onChange={handleChange} required type="text" placeholder="Street address, P.O. box" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm" />
                      </div>

                      {/* Address Line 2 */}
                      <div className="space-y-2">
                        <label className="block font-label text-gray-500">Address Line 2 (Optional)</label>
                        <input name="addressLine2" value={formData.addressLine2} onChange={handleChange} type="text" placeholder="Apartment, suite, unit" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm" />
                      </div>

                      {/* City & State */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block font-label text-[#22c55e]">City <span className="text-red-500">*</span></label>
                          <input name="city" value={formData.city} onChange={handleChange} required type="text" placeholder="City" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm" />
                        </div>
                        <div className="space-y-2">
                          <label className="block font-label text-[#22c55e]">State / Province <span className="text-red-500">*</span></label>
                          <input name="state" value={formData.state} onChange={handleChange} required type="text" placeholder="State / Region" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm" />
                        </div>
                      </div>

                      {/* Country - Now at the end */}
                      <div className="space-y-2 pt-2">
                         <label className="block font-label text-gray-500">Country (Auto-locked)</label>
                         <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
                            <input 
                              name="country" 
                              value={formData.country} 
                              readOnly 
                              className="w-full bg-white/5 border border-white/5 rounded-xl py-4 pl-12 pr-6 text-white/40 font-black tracking-[1px] font-sans text-sm uppercase cursor-not-allowed" 
                            />
                         </div>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <h3 className="font-label text-white/40">Emergency Contact <span className="text-red-500">*</span></h3>
                      <div className="space-y-4">
                        <input name="emergencyName" value={formData.emergencyName} onChange={handleChange} required type="text" placeholder="Contact Name" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm" />
                        <div className="flex gap-2">
                          <select 
                            name="emergencyCountryCode" 
                            value={formData.emergencyCountryCode} 
                            onChange={handleChange}
                            className="w-[110px] bg-black/30 border border-white/10 rounded-xl py-4 px-3 text-white focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm appearance-none cursor-pointer"
                          >
                            {countries.map(c => (
                              <option key={c.code} value={c.code} className="bg-[#111] text-white">
                                {c.code} ({c.name.substring(0, 3)})
                              </option>
                            ))}
                          </select>
                          <input 
                            name="emergencyPhone" 
                            value={formData.emergencyPhone} 
                            onChange={handleChange} 
                            required 
                            type="tel" 
                            placeholder="CONTACT PHONE" 
                            className="flex-1 bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm" 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={prevStep} className="flex-1 bg-white/5 text-white/40 font-button py-4 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                        <ChevronLeft size={18} />
                      </button>
                      <button 
                        type="button" 
                        onClick={nextStep} 
                        disabled={!formData.phone || !formData.addressLine1 || !formData.city || !formData.state || !formData.emergencyName || !formData.emergencyPhone}
                        className="flex-[3] bg-[#22c55e] text-black font-button py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                      >
                        Continue <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="step5" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl text-white mb-1">Performance Registry</h2>
                    <p className="font-label text-gray-500">Phase Five: Athlete Statistics</p>
                  </div>

                  {errorMsg && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-[2px] text-center">{errorMsg}</div>}
                  {successMsg && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-[10px] font-black uppercase tracking-[2px] text-center">{successMsg}</div>}

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black tracking-[2px] text-[#22c55e] uppercase">Height (CM) <span className="text-red-500">*</span></label>
                        <input name="height" value={formData.height} onChange={handleChange} required type="number" placeholder="185" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black tracking-[2px] text-[#22c55e] uppercase">Weight (KG) <span className="text-red-500">*</span></label>
                        <input name="weight" value={formData.weight} onChange={handleChange} required type="number" placeholder="82" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all text-sm" />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="block font-label text-[#22c55e] font-bold uppercase tracking-widest text-[10px]">Position Played <span className="text-red-500">*</span></label>
                       <input name="position" value={formData.position} onChange={handleChange} required type="text" placeholder="eg: Forward" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all text-sm font-medium" />
                    </div>
                    <div className="space-y-2">
                       <label className="block font-label text-[#22c55e] font-bold uppercase tracking-widest text-[10px]">Main Goals <span className="text-red-500">*</span></label>
                       <textarea name="goals" value={formData.goals} onChange={handleChange} required rows={2} placeholder="eg: Speed, Agility" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-500 focus:border-[#22c55e]/50 focus:bg-black/50 transition-all text-sm font-medium resize-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black tracking-[2px] text-gray-500 uppercase">Medical History (Optional)</label>
                      <textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} rows={2} placeholder="Any previous injuries or conditions..." className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:border-[#22c55e]/50 focus:bg-black/50 transition-all text-sm resize-none" />
                    </div>
                    
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                      <div className="flex items-start gap-4">
                        <div className="relative pt-1 shrink-0">
                          <input type="checkbox" name="waiverAccepted" checked={formData.waiverAccepted} onChange={handleChange} className="w-4 h-4 appearance-none border border-white/20 rounded checked:bg-[#22c55e] checked:border-[#22c55e] transition-all cursor-pointer" />
                          {formData.waiverAccepted && <Check className="absolute top-[6px] left-[2px] text-black" size={12} strokeWidth={4} />}
                        </div>
                        <p className="text-[8px] text-gray-400 leading-relaxed font-bold uppercase tracking-widest">
                          I voluntarily participate and assume full responsibility for any injury or damages and hereby release, indemnify, and hold harmless the KIO-X Performance Center.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button type="button" onClick={prevStep} className="flex-1 bg-white/5 text-white/40 font-black uppercase tracking-[2px] py-4 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                        <ChevronLeft size={18} />
                      </button>
                      <button 
                        type="submit" 
                        disabled={loading || (!successMsg && (!formData.waiverAccepted || !formData.height || !formData.weight || !formData.position || !formData.goals))} 
                        className={`flex-[3] ${successMsg ? 'bg-white text-black underline underline-offset-4' : 'bg-[#22c55e] text-black'} font-black uppercase tracking-[2px] py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] shadow-[0_0_30px_rgba(34,197,94,0.2)] disabled:opacity-30 disabled:hover:scale-100 transition-all`}
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" />
                        ) : successMsg ? (
                          <>ACCESS DASHBOARD <ChevronRight size={18} /></>
                        ) : (
                          <>Complete Registry <ShieldCheck size={18} /></>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="p-6 text-center border-t border-white/5">
          <p className="text-[8px] font-black uppercase tracking-[4px] text-gray-700">KIO-X Performance Protocol &copy; 2024</p>
        </div>
      </motion.div>
    </main>
  );
}
