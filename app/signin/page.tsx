"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";

function SignInContent() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { supabase, user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsHydrated(true);
    const saved = localStorage.getItem("kiox_remember_me");
    if (saved !== null) {
      setRememberMe(saved === "true");
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isHydrated && !authLoading && user) {
      if (profile) {
        if (profile.role === 'superadmin' || profile.role === 'staff' || profile.role === 'medical') {
          router.push(profile.role === 'superadmin' ? "/admin" : "/staff");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/register");
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
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setErrorMsg("Configuration error. Please contact support.");
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error("Authentication client failed to initialize.");
      }

      localStorage.setItem("kiox_remember_me", rememberMe.toString());

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('fetch') || error.name === 'TypeError') {
          setErrorMsg("Connection error. Please check your network and try again.");
        } else if (error.message.includes('Invalid login credentials')) {
          setErrorMsg("Invalid email or password. Please try again.");
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      setSuccessMsg("Signed in. Redirecting you now...");

      await refreshProfile();

      const { data: profileData } = await supabase.from('profiles').select('role').eq('id', data.user?.id).single();

      if (profileData) {
        if (profileData.role === 'superadmin' || profileData.role === 'staff' || profileData.role === 'medical') {
          router.push(profileData.role === 'superadmin' ? "/admin" : "/staff");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/register");
      }

    } catch (err: any) {
      console.error("Authentication error:", err);
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (!isHydrated) return null;

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      {/* Radial focus gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#22c55e]/[0.04] blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full border border-white/15 bg-black/60 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-[#22c55e]/40 transition-colors">
              <Image src="/logo.png" alt="KIO-X" width={36} height={36} className="object-contain" priority unoptimized={true} />
            </div>
            <span className="font-display text-[26px] text-white group-hover:text-[#22c55e] transition-colors leading-none">KIO-X</span>
          </Link>
          <p className="mt-2 text-[11px] text-gray-500 tracking-[0.04em]">Human Performance Platform</p>
        </div>

        {/* Card */}
        <div className="bg-[#0e0e0e] border border-white/[0.12] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          {/* Tabs */}
          <div className="flex border-b border-white/[0.08]">
            <button className="flex-1 py-4 text-sm font-semibold text-[#22c55e] relative transition-all">
              Sign in
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#16a34a]" />
            </button>
            <Link
              href="/register"
              className="flex-1 py-4 text-sm font-normal text-gray-500 hover:text-gray-300 relative flex items-center justify-center transition-colors"
            >
              Register
            </Link>
          </div>

          <div className="p-8">
            {/* Error/success messages */}
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-red-500/[0.08] border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2.5 leading-relaxed">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-5 p-3.5 bg-[#22c55e]/[0.08] border border-[#22c55e]/30 rounded-xl text-[#22c55e] text-xs flex items-center gap-2.5">
                <Check size={14} className="flex-shrink-0" />
                {successMsg}
              </div>
            )}

            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <form className="space-y-5" onSubmit={handleSignIn}>
                {/* Email field */}
                <div className="space-y-1.5">
                  <label htmlFor="signin-email" className="block text-[12px] font-medium text-gray-400 tracking-[0.03em]">
                    Email address
                  </label>
                  <div className="relative group">
                    <Mail
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                        emailFocused ? 'text-[#22c55e] opacity-100' : 'text-gray-500 opacity-50'
                      }`}
                      size={16}
                    />
                    <input
                      id="signin-email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      required
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      className="w-full bg-white/[0.04] border border-white/[0.12] rounded-xl py-3.5 pl-10 pr-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#16a34a]/70 focus:ring-1 focus:ring-[#16a34a]/30 focus:bg-white/[0.06] hover:border-white/[0.2] transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="signin-password" className="block text-[12px] font-medium text-gray-400 tracking-[0.03em]">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] text-gray-500 hover:text-[#22c55e] transition-colors tracking-[0.02em]"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                        passwordFocused ? 'text-[#22c55e] opacity-100' : 'text-gray-500 opacity-50'
                      }`}
                      size={16}
                    />
                    <input
                      id="signin-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full bg-white/[0.04] border border-white/[0.12] rounded-xl py-3.5 pl-10 pr-11 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#16a34a]/70 focus:ring-1 focus:ring-[#16a34a]/30 focus:bg-white/[0.06] hover:border-white/[0.2] transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <div className="relative w-[18px] h-[18px] flex-shrink-0">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        id="signin-remember"
                      />
                      <div className="w-full h-full bg-white/[0.04] border border-white/[0.15] rounded-[4px] transition-all peer-checked:bg-[#16a34a] peer-checked:border-[#16a34a] peer-focus:ring-2 peer-focus:ring-[#16a34a]/30" />
                      <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-[12px] text-gray-400 group-hover:text-gray-200 transition-colors tracking-[0.02em]">
                      Remember me
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.99] text-white font-semibold text-[13px] py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a]/50 focus:ring-offset-1 focus:ring-offset-transparent"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      <>Sign in <ArrowRight size={16} /></>
                    )}
                  </button>
                </div>

                {/* Trouble link */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      localStorage.clear();
                      await signOut();
                    }}
                    className="text-[11px] text-gray-600 hover:text-gray-300 transition-colors tracking-[0.02em]"
                  >
                    Having trouble?{" "}
                    <span className="underline underline-offset-2">Reset your session</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-9 h-9 border-2 border-[#22c55e]/20 border-t-[#22c55e] rounded-full animate-spin" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
