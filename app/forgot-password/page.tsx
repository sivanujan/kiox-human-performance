"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowRight, ChevronLeft, Loader2, ShieldCheck } from "lucide-react";
import { Anton } from "next/font/google";
import { useAuth } from "@/components/providers/AuthProvider";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

export default function ForgotPasswordPage() {
  const { supabase, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  // Countdown Logic
  useEffect(() => {
    if (resendTimer > 0) {
      const timerId = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [resendTimer]);

  const handleResetRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (resendTimer > 0) return;

    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg("Recovery Link Dispatched. Please check your inbox (and spam folder).");
      setResendTimer(150); // 2 mins 30 secs
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#22c55e]/5 blur-[120px] rounded-full" />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 w-full max-w-[500px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full border border-white/20 bg-black/50 flex items-center justify-center overflow-hidden">
              <Image src="/newlogo.png" alt="KIO-X" width={40} height={40} className="object-contain" unoptimized={true} />
            </div>
            <span className={`${anton.className} text-3xl tracking-[4px] text-white group-hover:text-[#22c55e] transition-colors`}>KIO-X</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl p-8 md:p-12 text-center">
          <div className="mb-8">
            <h2 className={`${anton.className} text-3xl text-white uppercase tracking-widest mb-2`}>Recover Access</h2>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[2px]">Enter your email for the recovery link</p>
          </div>

          {errorMsg && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest">{errorMsg}</div>}
          {successMsg && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-500 text-[10px] font-black uppercase tracking-widest">{successMsg}</div>}

          {!successMsg || resendTimer > 0 ? (
            <form className="space-y-6 text-left" onSubmit={handleResetRequest}>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-[2px] text-[#22c55e] uppercase">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                  <input 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    type="email" 
                    placeholder="name@example.com" 
                    disabled={successMsg !== ""}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans disabled:opacity-50" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading || resendTimer > 0} 
                className="w-full bg-[#22c55e] text-black font-black uppercase tracking-[2px] py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] hover:scale-[1.02] disabled:opacity-50 transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
              >
                {loading ? 'Dispatching...' : resendTimer > 0 ? `Resend In ${Math.floor(resendTimer/60)}:${(resendTimer%60).toString().padStart(2, '0')}` : 'Send Recovery Link'} <ArrowRight size={18} />
              </button>
            </form>
          ) : (
             <div className="space-y-6">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="text-green-500" size={32} />
                </div>
                <div className="space-y-4">
                  <button 
                      onClick={() => handleResetRequest()}
                      className="w-full border border-[#22c55e]/30 text-[#22c55e] font-black uppercase tracking-[2px] py-4 rounded-xl hover:bg-[#22c55e]/10 transition-all"
                  >
                      I didn't get it. Send Again
                  </button>
                  <Link 
                      href="/signin"
                      className="w-full block bg-white/5 text-white/60 font-black uppercase tracking-[2px] py-4 rounded-xl text-center hover:bg-white/10 transition-all"
                  >
                      Return to Sign In
                  </Link>
                </div>
             </div>
          )}

          <div className="mt-8 pt-8 border-t border-white/5">
            <Link href="/signin" className="inline-flex items-center gap-2 text-[10px] font-bold text-white/20 hover:text-[#22c55e] uppercase tracking-widest transition-colors">
              <ChevronLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
