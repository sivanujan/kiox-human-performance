"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";


export default function ResetPasswordPage() {
  const { supabase, user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "WEAK", color: "#ef4444" });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const router = useRouter();

  useEffect(() => {
     // Check if we have a session (Supabase auto-signs in from the recovery link)
     const checkSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
              // If no session, we might want to redirect, but for now we let Supabase handle the URL hash
          }
      }
      if (!authLoading) checkSession();
  }, [supabase.auth, authLoading]);

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    calculateStrength(val);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    if (passwordStrength.label === "WEAK") {
      setErrorMsg("Password is too weak. Please add more symbols or characters.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    console.log("INITIALIZING CREDENTIAL SECURING PROTOCOL...");

    try {
      // Use the mission-stable server-side credential terminal
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("CREDENTIAL PROVISIONING FAILURE:", result.error);
        setErrorMsg(result.error || "Tactical synchronization failed.");
        setLoading(false);
      } else {
        console.log("CREDENTIAL PROVISIONING SUCCESSFUL");
        setSuccessMsg("Shield Established. Password updated successfully.");
        
        // 3. Force state cleanup and redirect
        setTimeout(() => {
          router.push("/signin?message=Credentials established. Please sign in with your new identity.");
        }, 2200);
      }
    } catch (err: any) {
      console.error("CRITICAL PROVISIONING EXCEPTION:", err);
      setErrorMsg("Interference detected in credential tunnel. Please refresh and try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#22c55e]/5 blur-[120px] rounded-full" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-[500px]">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full border border-white/20 bg-black/50 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="KIO-X" width={40} height={40} className="object-contain" unoptimized={true} />
             </div>
             <span className={`font-display text-3xl tracking-[4px] text-white`}>KIO-X</span>
          </Link>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl p-8 md:p-12">
          <div className="mb-8 text-center">
            <h2 className={`font-display text-3xl text-white uppercase tracking-widest mb-2`}>New Protocol</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Set your new elite security credentials</p>
          </div>

          {errorMsg && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{errorMsg}</div>}
          {successMsg && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-500 text-[10px] font-black uppercase tracking-widest text-center">{successMsg}</div>}

          {!successMsg ? (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-gray-400 tracking-[0.03em]">New Password</label>
                  <div className="relative group">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                      passwordFocused ? 'text-[#22c55e] opacity-100' : 'text-gray-500 opacity-50'
                    }`} size={16} />
                    <input 
                      value={password} 
                      onChange={handlePasswordChange} 
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      required 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="w-full bg-white/[0.04] border border-white/[0.12] rounded-xl py-3.5 pl-10 pr-12 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#16a34a]/70 focus:ring-1 focus:ring-[#16a34a]/30 focus:bg-white/[0.06] hover:border-white/[0.2] transition-all font-sans" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  
                  {/* Strength Indicator */}
                  <div className="space-y-2 mt-3">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${passwordStrength.score}%`, backgroundColor: passwordStrength.color }} className="h-full transition-all duration-500" />
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[1px]">
                      <span className="text-gray-500">Security Strength</span>
                      <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="block text-[12px] font-medium text-gray-400 tracking-[0.03em]">Confirm Password</label>
                    {password && confirmPassword && password !== confirmPassword && (
                        <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1"><AlertCircle size={10} /> Mismatch</span>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                      confirmPasswordFocused ? 'text-[#22c55e] opacity-100' : 'text-gray-500 opacity-50'
                    }`} size={16} />
                    <input 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                      required 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="w-full bg-white/[0.04] border border-white/[0.12] rounded-xl py-3.5 pl-10 pr-12 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#16a34a]/70 focus:ring-1 focus:ring-[#16a34a]/30 focus:bg-white/[0.06] hover:border-white/[0.2] transition-all font-sans" 
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading || passwordStrength.label === "WEAK"} className="w-full bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.99] text-white font-semibold text-[13px] py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a]/50 focus:ring-offset-1 focus:ring-offset-transparent shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                {loading ? 'Securing...' : 'Establish Password'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-6">
                <div className="w-20 h-20 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="text-[#22c55e]" size={40} />
                </div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[2px] leading-relaxed">Your account access has been fully restored. Redirecting to secure login...</p>
                <div className="flex justify-center">
                    <Loader2 className="animate-spin text-[#22c55e]" size={24} />
                </div>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
