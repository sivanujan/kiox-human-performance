"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [rememberMe, setRememberMe] = useState(true);

  const { supabase, user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsHydrated(true);
    // Initialize rememberMe from localStorage if it exists
    const saved = localStorage.getItem("kiox_remember_me");
    if (saved !== null) {
      setRememberMe(saved === "true");
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isHydrated && !authLoading && user && profile) {
      if (profile.role === 'superadmin' || profile.role === 'staff') {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, profile, authLoading, router, isHydrated]);

  // Check for error in URL params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setErrorMsg(decodeURIComponent(error));
    }
  }, [searchParams]);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Pre-flight Config Check
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setErrorMsg("CRITICAL: Supabase keys are missing from environment. Restart dev server or check .env.local.");
      setLoading(false);
      return;
    }

    // Verify Key Format (Detection for potentially wrong key services like Stripe)
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('sb_publishable_')) {
      console.warn("POTENTIAL KEY MISMATCH: The Supabase Anon Key starts with 'sb_publishable_'. This usually indicates a Stripe or Clerk key has been pasted into the Supabase configuration.");
    }
    
    try {
      if (!supabase) {
        throw new Error("Supabase internal client initialization failed.");
      }

      // Store rememberMe preference before signing in
      localStorage.setItem("kiox_remember_me", rememberMe.toString());

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Handle specific fetch/network errors
        if (error.message.includes('fetch') || error.name === 'TypeError') {
          setErrorMsg("Database Connection Error. Please verify your Supabase URL and Anon Key in .env.local and ensure you have an active network connection.");
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
      }
      // If no error, the redirection useEffect will kick in
    } catch (err: any) {
      console.error("Authentication Runtime Exception:", err);
      if (err.message?.includes('fetch') || err.name === 'TypeError') {
        setErrorMsg("Failed to reach Auth Matrix. Verify Supabase Keys in .env.local and check console for details.");
      } else {
        setErrorMsg(err.message || "A connection error occurred during authentication.");
      }
      setLoading(false);
    }
  };

  if (!isHydrated) return null;

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
              <Image src="/newlogo.png" alt="KIO-X" width={40} height={40} className="object-contain" priority unoptimized={true} />
            </div>
            <span className="font-display text-3xl text-white group-hover:text-[#22c55e] transition-colors">KIO-X</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button className="flex-1 py-5 font-label text-[#22c55e] transition-all relative">
              Sign In
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#22c55e]" />
            </button>
            <Link href="/register" className="flex-1 py-5 font-label text-gray-400 hover:text-white transition-all relative flex items-center justify-center font-bold tracking-widest uppercase">
              Register
            </Link>
          </div>

          <div className="p-8 md:p-12">
            {errorMsg && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 font-label text-center flex items-center justify-center gap-2"><AlertCircle size={14} /> {errorMsg}</div>}
            {successMsg && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-500 font-label text-center">{successMsg}</div>}

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <form className="space-y-6" onSubmit={handleSignIn}>
                <div className="space-y-2">
                  <label className="block font-label text-[#22c55e]">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                    <input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="name@example.com" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans font-medium" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block font-label text-[#22c55e] font-bold">Password</label>
                    <Link href="/forgot-password" className="font-label text-[#22c55e] opacity-60 hover:opacity-100 transition-opacity font-bold">Forgot Password?</Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                    <input value={password} onChange={e => setPassword(e.target.value)} required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans font-medium" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-5 h-5">
                      <input 
                        type="checkbox" 
                        className="peer sr-only" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <div className="w-full h-full bg-black/40 border border-white/10 rounded transition-all peer-checked:bg-[#22c55e] peer-checked:border-[#22c55e]" />
                      <div className="absolute inset-0 flex items-center justify-center text-black scale-0 peer-checked:scale-100 transition-transform">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-label text-gray-400 font-bold group-hover:text-white transition-colors">Remember Me</span>
                  </label>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-[#22c55e] text-black font-button py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] hover:scale-[1.02] disabled:opacity-50 transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
