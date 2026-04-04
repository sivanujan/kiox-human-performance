"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Lock, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Anton } from "next/font/google";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

export default function SignInPage() {
  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");
  const [showPassword, setShowPassword] = useState(false);
  
  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const supabase = createClient();
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
           // fallback testing logic if keys aren't working because of the cancel
           if (error.message.includes('fetch')) {
               setErrorMsg("Database Connection Error. Are the Supabase Keys correct in .env.local?");
           } else {
               setErrorMsg(error.message);
           }
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    
    if (error) {
      if (error.message.includes('fetch')) {
         setErrorMsg("Database Connection Error. Are the Supabase Keys correct in .env.local?");
      } else {
         setErrorMsg(error.message);
      }
    } else {
      setSuccessMsg("Registration successful! Check your email or sign in directly.");
      setActiveTab("signin");
      setPassword("");
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
        <div className="bg-[#111111] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button onClick={() => { setActiveTab("signin"); setErrorMsg(""); setSuccessMsg(""); }} className={`flex-1 py-5 text-[12px] font-bold tracking-[2px] uppercase transition-all relative ${activeTab === "signin" ? "text-[#22c55e]" : "text-gray-500 hover:text-gray-300"}`}>
              Sign In {activeTab === "signin" && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#22c55e]" />}
            </button>
            <button onClick={() => { setActiveTab("register"); setErrorMsg(""); setSuccessMsg(""); }} className={`flex-1 py-5 text-[12px] font-bold tracking-[2px] uppercase transition-all relative ${activeTab === "register" ? "text-[#22c55e]" : "text-gray-500 hover:text-gray-300"}`}>
              Register {activeTab === "register" && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#22c55e]" />}
            </button>
          </div>

          <div className="p-8 md:p-12">
            {errorMsg && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-xs font-bold uppercase tracking-widest text-center">{errorMsg}</div>}
            {successMsg && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-500 text-xs font-bold uppercase tracking-widest text-center">{successMsg}</div>}

            <AnimatePresence mode="wait">
              {activeTab === "signin" ? (
                <motion.div key="signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                  <form className="space-y-6" onSubmit={handleSignIn}>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black tracking-[2px] text-[#22c55e] uppercase">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="name@example.com" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-black tracking-[2px] text-[#22c55e] uppercase">Password</label>
                        <Link href="#" className="text-[10px] font-bold text-[#22c55e]/60 hover:text-[#22c55e] uppercase tracking-widest transition-colors">Forgot Password?</Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input value={password} onChange={e => setPassword(e.target.value)} required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-white/10 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-[#22c55e] text-black font-black uppercase tracking-[2px] py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] hover:scale-[1.02] disabled:opacity-50 transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                      {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <form className="space-y-6" onSubmit={handleSignUp}>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black tracking-[2px] text-[#22c55e] uppercase">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input value={name} onChange={e => setName(e.target.value)} required type="text" placeholder="YOUR NAME" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black tracking-[2px] text-[#22c55e] uppercase">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="name@example.com" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black tracking-[2px] text-[#22c55e] uppercase">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input value={password} onChange={e => setPassword(e.target.value)} required type="password" placeholder="••••••••" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-[#22c55e] text-black font-black uppercase tracking-[2px] py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] hover:scale-[1.02] disabled:opacity-50 transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                      {loading ? 'Creating...' : 'Create Account'} <ArrowRight size={18} />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
