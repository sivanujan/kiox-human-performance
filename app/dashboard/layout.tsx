"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Bell, 
  LogOut, 
  LayoutDashboard, 
  User as UserIcon, 
  Clipboard, 
  Calendar, 
  BarChart3, 
  Target, 
  Settings,
  Shield
} from "lucide-react";
import { Anton } from "next/font/google";
import Image from "next/image";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

import Avatar from "@/components/ui/Avatar";
import { Orbitron } from "next/font/google";
const orbitron = Orbitron({ subsets: ["latin"] });


const navItems = [
  { icon: <LayoutDashboard size={18} />, label: 'OVERVIEW', href: '/dashboard' },
  { icon: <UserIcon size={18} />, label: 'MY PROFILE', href: '/dashboard/profile' },
  { icon: <Clipboard size={18} />, label: 'MY PROGRAM', href: '/dashboard/program' },
  { icon: <Calendar size={18} />, label: 'SCHEDULE', href: '/dashboard/schedule' },
  { icon: <BarChart3 size={18} />, label: 'PROGRESS', href: '/dashboard/progress' },
  { icon: <Target size={18} />, label: 'BOOK SESSION', href: '/dashboard/booking', badge: 'NEW' },
  { icon: <Settings size={18} />, label: 'SETTINGS', href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut, supabase } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="text-[#22c55e] animate-spin" size={48} />
      </div>
    );
  }

  // Ensure user is an athlete
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/signin");
      } else if (profile?.role === 'superadmin') {
        router.push("/admin");
      } else if (profile?.role === 'staff') {
        router.push("/staff");
      }
    }
  }, [user, profile, loading, router]);

  const userName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : user?.email?.split('@')[0] || 'Athlete';
  const status = profile?.status || 'Active';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-[210px] h-screen bg-[#0a0a0a] border-r border-[#00ff41]/15 fixed left-0 top-0 z-[100] flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 rounded-lg bg-[#00ff41] flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(0,255,65,0.4)] group-hover:scale-110 transition-all duration-300">
               X
             </div>
             <span className={`${orbitron.className} text-xl tracking-[0.2em] font-black text-white group-hover:text-[#00ff41] transition-colors`}>KIO-X</span>
          </Link>
        </div>

        {/* User Profile Block */}
        <div className="p-5 border-b border-white/5">
          <div className="flex flex-col items-center text-center">
            <Avatar 
              src={profile?.avatar_url}
              name={userName}
              role="athlete"
              size="lg"
              className="mb-3 border-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.2)]"
            />
            <div className={`${orbitron.className} text-[13px] text-white mb-0.5 uppercase tracking-wider truncate w-full`}>
              {userName}
            </div>
            <div className="text-white/30 text-[10px] mb-3 truncate w-full uppercase tracking-tighter">
              @{profile?.username || user?.email?.split('@')[0]}
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] rounded-full text-[8px] font-bold uppercase tracking-[0.1em]">
              <div className="w-1 h-1 rounded-full bg-[#00ff41] animate-pulse shadow-[0_0_5px_#00ff41]" />
              {status}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={i}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-all relative ${
                  isActive 
                    ? 'text-[#00ff41]' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute inset-y-0 left-0 w-1 bg-[#00ff41] shadow-[0_0_10px_#00ff41]"
                  />
                )}
                <span className={isActive ? 'text-[#00ff41]' : 'text-current'}>{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-[#00ff41] text-black text-[7px] px-1.5 py-0.5 rounded-sm font-black animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-5 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 border border-white/10 rounded-xl text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:border-[#00ff41]/30 hover:text-[#00ff41] transition-all"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>


      {/* Main Content Area */}
      <main className="flex-1 ml-[210px] min-h-screen relative">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
          backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} />

        {/* Top Header Bar */}
        <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 px-10 h-[80px] flex items-center justify-between">
          <div>
            <div className="text-[#00ff41] text-[10px] font-black tracking-[0.3em] uppercase mb-1">Elite Performance Portal</div>
            <h1 className={`${orbitron.className} text-xl md:text-2xl text-white uppercase tracking-wider`}>
              Welcome back, <span className="text-[#00ff41]">{userName.split(' ')[0]}</span> 👋
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Small */}
            <Link href="/dashboard/profile" className="w-10 h-10 rounded-xl bg-[#00ff41]/10 border border-[#00ff41]/30 flex items-center justify-center text-[#00ff41] font-black text-sm cursor-pointer hover:border-[#00ff41] hover:bg-[#00ff41]/20 transition-all">
              {userName[0].toUpperCase()}
            </Link>
          </div>
        </header>


        {/* Page Content */}
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
