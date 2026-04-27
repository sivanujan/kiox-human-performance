"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import StaffProfileModal from "@/components/modals/StaffProfileModal";
import { 
  Loader2, 
  LogOut, 
  LayoutDashboard, 
  User as UserIcon, 
  Settings,
  Zap,
  ShieldCheck,
  ChevronRight,
  Camera,
  Bell,
  Menu,
  Calendar,
  X as CloseIcon
} from "lucide-react";
import Image from "next/image";
import StaffNotificationDropdown from "@/components/StaffNotificationDropdown";
import Avatar from "@/components/ui/Avatar";



const staffNavItems = [
  { icon: <LayoutDashboard size={18} />, label: 'CONTROL CENTER', href: '/staff' },
  { icon: <Zap size={18} />, label: 'SPECIAL OPS', href: '/staff/special-sessions' },
  { icon: <Calendar size={18} />, label: 'SESSION REQUESTS', href: '/staff/bookings' },
  { icon: <UserIcon size={18} />, label: 'PERSONNEL HUB', href: '/staff/settings' },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [teams, setTeams] = useState<any[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/signin");
      } else if (profile?.role !== 'staff' && profile?.role !== 'superadmin') {
        router.push("/dashboard");
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
  const userName = `${profile?.first_name} ${profile?.last_name || ''}`;

  return (
    <div className="min-h-screen bg-[#080808] text-white flex overflow-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[140] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[150] w-[280px] bg-[#0a0a0a] border-r border-[#22c55e]/15 
        flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-[#22c55e]/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border border-white/10 bg-black/50 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <Image src="/newlogo.png" alt="KIO-X" width={32} height={32} priority className="w-8 h-8 object-contain" />
             </div>
             <span className={`font-display text-2xl tracking-widest text-white`}>KIO-X</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white transition-colors">
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Profile Block */}
        <motion.div 
          onClick={() => setIsProfileOpen(true)}
          whileHover={{ x: 5, backgroundColor: "rgba(34, 197, 94, 0.05)" }}
          className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent cursor-pointer transition-colors group"
          title="Click to Modify Profile"
        >
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <Avatar 
                src={profile?.avatar_url}
                name={userName}
                size="xl"
                className="rounded-2xl border-2 border-[#22c55e] shadow-[0_0_30px_rgba(34,197,94,0.2)]"
              />
              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px] border-2 border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                 <Camera size={24} className="text-[#22c55e] mb-1 animate-pulse" />
                 <span className="text-[8px] font-black text-white uppercase tracking-widest">MODIFY</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#22c55e] flex items-center justify-center text-black border-2 border-[#0a0a0a] shadow-[0_0_10px_#22c55e] z-20">
                <ShieldCheck size={14} fill="currentColor" />
              </div>
            </div>
            
            <div className={`font-display text-lg text-white mb-1 uppercase tracking-wider group-hover:text-[#22c55e] transition-colors`}>
              Coach {profile?.first_name}
            </div>
            <div className="flex flex-col gap-1 items-center">
              <div className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full text-[#22c55e] text-[8px] font-black uppercase tracking-[2px]">
                {profile?.role === 'superadmin' ? 'Super Admin' : 'Performance Staff'}
              </div>
              <div className="text-gray-400 text-[9px] font-bold uppercase tracking-[1px] mt-1">
                {userTeam?.name || "Independent Ops"}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6 px-4 space-y-2">
          <div className="text-gray-500 text-[9px] font-black uppercase tracking-[3px] ml-4 mb-4">Tactical Menu</div>
          {staffNavItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={i}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[11px] font-black tracking-[2px] uppercase transition-all group ${
                  isActive 
                    ? 'bg-[#22c55e] text-black shadow-[0_10px_20px_rgba(34,197,94,0.2)]' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={isActive ? 'text-black' : 'text-[#22c55e] group-hover:scale-110 transition-transform'}>{item.icon}</span>
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-6 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="active-scale w-full py-4 border border-white/10 rounded-2xl text-[10px] text-gray-400 font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:border-red-500/30 hover:text-red-500 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={14} /> Exit Matrix
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-[280px] min-h-screen relative overflow-y-auto">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ 
          backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} />

        {/* Top Header Bar */}
        <header className="sticky top-0 z-[100] bg-[#080808]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-10 h-[70px] md:h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-[#22c55e] active-scale transition-all"
            >
              <Menu size={20} />
            </button>
             <div className="w-1 h-6 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e] hidden xs:block" />
             <div className="hidden xs:block">
                <div className="text-[#22c55e] text-[8px] md:text-[9px] font-black tracking-[3px] uppercase mb-0.5">Tactical Command Hub</div>
                <h1 className={`font-display text-lg md:text-2xl text-white uppercase tracking-wider truncate max-w-[150px] md:max-w-none`}>
                  System Online // <span className="text-[#22c55e]">{profile?.first_name || 'Staff'}</span>
                </h1>
             </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <StaffNotificationDropdown />
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 group px-4 py-2 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-[#22c55e]/30 transition-all active-scale"
            >
               <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-black text-white uppercase tracking-[2px]">{userName}</div>
                  <div className="text-[8px] font-bold text-[#22c55e] uppercase tracking-[1px]">Operational Staff</div>
               </div>
               <Avatar 
                  src={profile?.avatar_url}
                  name={userName}
                  size="md"
                  className="group-hover:border-[#22c55e] transition-all"
               />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="relative z-10 p-4 md:p-10">
          {children}
        </div>
      </main>

      <StaffProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </div>
  );
}
