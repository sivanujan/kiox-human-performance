"use client";

import { useAuth } from "@/components/providers/AuthProvider";
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
  MessageSquare, 
  Settings,
  Shield
} from "lucide-react";
import { Anton } from "next/font/google";
import Image from "next/image";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

const navItems = [
  { icon: <LayoutDashboard size={18} />, label: 'OVERVIEW', href: '/dashboard' },
  { icon: <UserIcon size={18} />, label: 'MY PROFILE', href: '/dashboard/profile' },
  { icon: <Clipboard size={18} />, label: 'MY PROGRAM', href: '/dashboard/program' },
  { icon: <Calendar size={18} />, label: 'SCHEDULE', href: '/dashboard/schedule' },
  { icon: <BarChart3 size={18} />, label: 'PROGRESS', href: '/dashboard/progress' },
  { icon: <Target size={18} />, label: 'BOOK SESSION', href: '/dashboard/booking', badge: 'NEW' },
  { icon: <MessageSquare size={18} />, label: 'MESSAGES', href: '/dashboard/messages' },
  { icon: <Settings size={18} />, label: 'SETTINGS', href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, supabase } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="text-[#22c55e] animate-spin" size={48} />
      </div>
    );
  }

  // Ensure user is an athlete
  if (!user || profile?.role !== 'athlete') {
    if (!loading && user && profile?.role === 'superadmin') router.push("/admin");
    else if (!loading && !user) router.push("/signin");
  }

  const userName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : user?.email?.split('@')[0] || 'Athlete';
  const status = profile?.status || 'Active';

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">
      {/* Sidebar */}
      <aside className="w-[260px] h-screen bg-[#0a0a0a] border-r border-[#22c55e]/15 fixed left-0 top-0 z-[100] flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-[#22c55e]/10">
          <Link href="/" className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border border-white/10 bg-black/50 flex items-center justify-center overflow-hidden">
                <Image src="/newlogo.png" alt="KIO-X" width={32} height={32} unoptimized={true} />
             </div>
             <span className={`${anton.className} text-2xl tracking-widest text-white`}>KIO-X</span>
          </Link>
        </div>

        {/* User Profile Block */}
        <div className="p-6 border-b border-[#22c55e]/10">
          <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 border-2 border-[#22c55e] flex items-center justify-center text-2xl text-[#22c55e] font-display mb-3 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            {userName[0].toUpperCase()}
          </div>
          <div className={`${anton.className} text-lg text-white mb-1 uppercase tracking-wider truncate`}>
            {userName}
          </div>
          <div className="text-white/40 text-xs mb-3 truncate">
            @{profile?.username || user?.email?.split('@')[0]}
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[2px] ${
            status === 'active' ? 'bg-[#22c55e]/10 border-[#22c55e] text-[#22c55e]' : 'bg-amber-500/10 border-amber-500 text-amber-500'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full bg-current ${status === 'active' ? 'animate-pulse' : ''}`} />
            {status}
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
                className={`flex items-center gap-3 px-6 py-4 text-[11px] font-black tracking-[2px] uppercase transition-all border-l-[3px] ${
                  isActive 
                    ? 'bg-[#22c55e]/5 border-[#22c55e] text-[#22c55e]' 
                    : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={isActive ? 'text-[#22c55e]' : 'text-current'}>{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-[#22c55e] text-black text-[8px] px-2 py-0.5 rounded-full font-black">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-6 border-t border-[#22c55e]/10">
          <button
            onClick={handleSignOut}
            className="w-full py-3 border border-white/10 rounded-xl text-[10px] text-white/40 font-black uppercase tracking-[2px] flex items-center justify-center gap-2 hover:border-[#22c55e]/30 hover:text-[#22c55e] transition-all"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[260px] min-h-screen relative">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ 
          backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} />

        {/* Top Header Bar */}
        <header className="sticky top-0 z-50 bg-[#080808]/90 backdrop-blur-xl border-b border-[#22c55e]/10 px-10 h-[80px] flex items-center justify-between">
          <div>
            <div className="text-[#22c55e] text-[9px] font-black tracking-[4px] uppercase mb-1">Elite Performance Portal</div>
            <h1 className={`${anton.className} text-xl md:text-2xl text-white uppercase tracking-wider`}>
              Welcome back, <span className="text-[#22c55e]">{userName.split(' ')[0]}</span> 👋
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-[#22c55e]/5 border border-[#22c55e]/20 flex items-center justify-center transition-all group-hover:border-[#22c55e]/50">
                <Bell size={20} className="text-[#22c55e]" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#080808]" />
            </div>

            {/* Profile Small */}
            <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] font-display text-sm cursor-pointer hover:border-[#22c55e] transition-all">
              {userName[0].toUpperCase()}
            </div>
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
