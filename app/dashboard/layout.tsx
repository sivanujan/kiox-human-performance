"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import NotificationDropdown from "@/components/NotificationDropdown";
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
  Shield,
  ShieldCheck,
  ChevronRight,
  Zap,
  Activity
} from "lucide-react";
import { Anton, Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

const athleteNavItems = [
  { icon: <LayoutDashboard size={18} />, label: 'OVERVIEW', href: '/dashboard' },
  { icon: <UserIcon size={18} />, label: 'MY PROFILE', href: '/dashboard/profile' },
  { icon: <Clipboard size={18} />, label: 'MY PROGRAM', href: '/dashboard/program' },
  { icon: <Calendar size={18} />, label: 'SCHEDULE', href: '/dashboard/schedule' },
  { icon: <BarChart3 size={18} />, label: 'PROGRESS', href: '/dashboard/progress' },
  { icon: <Target size={18} />, label: 'BOOK SESSION', href: '/dashboard/booking', badge: 'NEW' },
  { icon: <Settings size={18} />, label: 'SETTINGS', href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/signin");
      } else if (profile?.role === 'superadmin') {
        router.push("/admin");
      } else if (profile?.role === 'staff') {
        router.push("/staff");
      } else {
        fetchTeams();
      }
    }
  }, [user, profile, loading, router]);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      const data = await res.json();
      if (!data.error) setTeams(data);
    } catch (err) {
      console.error("Teams fetch error:", err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="text-[#22c55e] animate-spin" size={48} />
      </div>
    );
  }

  const userTeam = teams.find(t => t.id === profile?.team_id);
  const userName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Elite Performer';
  const status = profile?.status || 'OPTIMIZED';

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">
      {/* Sidebar */}
      <aside className="w-[280px] h-screen bg-[#0a0a0a] border-r border-[#22c55e]/15 fixed left-0 top-0 z-[100] flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-[#22c55e]/10">
          <Link href="/" className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border border-white/10 bg-black/50 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <Image src="/newlogo.png" alt="KIO-X" width={32} height={32} priority className="w-8 h-8 object-contain" />
             </div>
             <span className={`${anton.className} text-2xl tracking-widest text-white`}>KIO-X</span>
          </Link>
        </div>

        {/* Profile Block */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className={`w-20 h-20 rounded-2xl bg-[#22c55e]/10 border-2 border-[#22c55e] flex items-center justify-center ${anton.className} text-4xl text-[#22c55e] shadow-[0_0_30px_rgba(34,197,94,0.2)]`}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  profile?.first_name?.[0] || 'A'
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#22c55e] flex items-center justify-center text-black border-2 border-[#0a0a0a] shadow-[0_0_10px_#22c55e]">
                <Activity size={12} fill="currentColor" />
              </div>
            </div>
            
            <div className={`${anton.className} text-lg text-white mb-1 uppercase tracking-wider truncate w-full px-2`}>
              {userName}
            </div>
            <div className="flex flex-col gap-1 items-center">
              <div className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full text-[#22c55e] text-[8px] font-black uppercase tracking-[2px]">
                Elite Performer
              </div>
              <div className="text-white/30 text-[9px] font-bold uppercase tracking-[1px] mt-1">
                {userTeam?.name || "Independent Unit"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6 px-4 space-y-2">
          <div className="text-white/20 text-[9px] font-black uppercase tracking-[3px] ml-4 mb-4">Operational Menu</div>
          {athleteNavItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={i}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[11px] font-black tracking-[2px] uppercase transition-all group ${
                  isActive 
                    ? 'bg-[#22c55e] text-black shadow-[0_10px_20px_rgba(34,197,94,0.2)]' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={isActive ? 'text-black' : 'text-[#22c55e] group-hover:scale-110 transition-transform'}>{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-[7px] px-1.5 py-0.5 rounded-sm font-black animate-pulse">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-6 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="w-full py-4 border border-white/10 rounded-2xl text-[10px] text-white/30 font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:border-red-500/30 hover:text-red-500 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={14} /> Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[280px] min-h-screen relative">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ 
          backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} />

        {/* Top Header Bar */}
        <header className="sticky top-0 z-50 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5 px-10 h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-6 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e]" />
             <div>
                <div className="text-[#22c55e] text-[9px] font-black tracking-[3px] uppercase mb-0.5">Tactical Performance Hub</div>
                <h1 className={`${anton.className} text-2xl text-white uppercase tracking-wider`}>
                  System Online // <span className="text-[#22c55e]">{profile?.first_name || 'Protocol'}</span>
                </h1>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <NotificationDropdown />
            <Link href="/dashboard/profile" className="flex items-center gap-3 group">
               <div className="text-right hidden md:block">
                  <div className="text-[10px] font-black text-white uppercase tracking-[2px]">{userName}</div>
                  <div className="text-[8px] font-bold text-[#22c55e] uppercase tracking-[1px]">{status}</div>
               </div>
               <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] font-black text-sm group-hover:bg-[#22c55e] group-hover:text-black transition-all">
                  {profile?.first_name?.[0] || 'U'}
               </div>
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
