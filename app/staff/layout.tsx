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
  CalendarDays,
  Layers,
  Clipboard,
  X as CloseIcon,
  MessageSquare,
  FileText
} from "lucide-react";
import Image from "next/image";
import StaffNotificationDropdown from "@/components/StaffNotificationDropdown";
import Avatar from "@/components/ui/Avatar";
import ThemeToggle from "@/components/ThemeToggle";

const staffNavItems = [
  { icon: <LayoutDashboard size={18} />, label: 'Dashboard', href: '/staff' },
  { icon: <CalendarDays size={18} />, label: 'Calendar', href: '/staff/calendar' },
  { icon: <Layers size={18} />, label: 'Programs Matrix', href: '/staff/programs' },
  { icon: <FileText size={18} />, label: 'Forms & Protocols', href: '/staff/forms-protocols' },
  { icon: <Clipboard size={18} />, label: 'Curriculum', href: '/staff/curriculum' },
  { icon: <Zap size={18} />, label: 'Special Ops', href: '/staff/special-sessions' },
  { icon: <Calendar size={18} />, label: 'Session Requests', href: '/staff/bookings' },
  { icon: <MessageSquare size={18} />, label: 'Chat Uplink', href: '/staff/chat' },
  { icon: <UserIcon size={18} />, label: 'Personnel Hub', href: '/staff/settings' },
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
      } else if (profile?.role !== 'staff' && profile?.role !== 'superadmin' && profile?.role !== 'medical') {
        router.push("/dashboard");
      } else if (profile?.role === 'medical' && pathname !== '/staff/chat' && pathname !== '/staff/settings' && pathname !== '/staff/programs' && pathname !== '/staff/curriculum' && pathname !== '/staff/forms-protocols') {
        router.push("/staff/chat");
      } else {
        fetchTeams();
      }
    }
  }, [user, profile, loading, router, pathname]);

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

  const userName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
    : user?.email?.split('@')[0] || 'Operator';

  const userTeam = teams.find(t => t.id === profile?.team_id);

  const getBreadcrumbs = () => {
    switch (pathname) {
      case '/staff':
        return <span className="text-gray-400 font-sans text-xs">Dashboard</span>;
      case '/staff/calendar':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/staff" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Calendar</span>
          </span>
        );
      case '/staff/programs':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/staff" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Programs Matrix</span>
          </span>
        );
      case '/staff/curriculum':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/staff" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Curriculum</span>
          </span>
        );
      case '/staff/special-sessions':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/staff" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Special Ops</span>
          </span>
        );
      case '/staff/bookings':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/staff" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Session Requests</span>
          </span>
        );
      case '/staff/chat':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/staff" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Chat Uplink</span>
          </span>
        );
      case '/staff/settings':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/staff" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Personnel Hub</span>
          </span>
        );
      case '/staff/forms-protocols':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/staff" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Forms & Protocols</span>
          </span>
        );
      default:
        return <span className="text-gray-400 font-sans text-xs">Dashboard</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-[var(--accent-green)]/10 animate-ping absolute inset-0" />
          <div className="w-20 h-20 rounded-full border-t-2 border-[var(--accent-green)] animate-spin" />
        </div>
        <div className="text-[10px] font-black text-[var(--accent-green)] uppercase tracking-[0.5em] animate-pulse">
          Syncing Operational Context...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex text-[var(--text-primary)]">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Component */}
      <aside className={`fixed top-0 bottom-0 left-0 z-[250] w-[280px] bg-[var(--bg-card)] border-r border-[var(--border-primary)] flex flex-col justify-between p-6 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-8">
          {/* Brand Logo */}
          <div className="flex items-center justify-between">
            <Link href="/staff" className="flex items-center gap-3 active-scale">
              <div className="w-9 h-9 rounded-xl border border-[var(--border-primary)]/50 bg-[var(--bg-primary)]/50 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="KIO-X" width={28} height={28} className="object-contain" priority unoptimized={true} />
              </div>
              <span className={`font-display text-lg font-black tracking-[3px] text-[var(--text-primary)]`}>KIO-X</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded bg-[var(--bg-primary)]/50 border border-[var(--border-primary)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <CloseIcon size={16} />
            </button>
          </div>

          {/* Coach Quick Stats Info Box */}
          <div className="p-4 bg-[var(--bg-primary)]/20 border border-[var(--border-primary)]/50 rounded-2xl flex items-center gap-4">
             <Avatar 
                src={profile?.avatar_url}
                name={userName}
                role="staff"
                size="md"
             />
             <div className="min-w-0">
                <div className="text-sm font-extrabold text-[var(--text-primary)] truncate tracking-wide">{userName}</div>
                <div className="text-[10px] text-[var(--text-secondary)] font-medium truncate tracking-normal mt-0.5">{profile?.role === 'superadmin' ? 'Super Admin' : profile?.role === 'medical' ? 'Medical Staff' : 'Performance Staff'}</div>
             </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {staffNavItems
              .filter((item) => {
                if (item.label === 'Curriculum' && profile?.role !== 'superadmin') {
                  return false;
                }
                return profile?.role !== 'medical' || 
                  item.href === '/staff/chat' || 
                  item.href === '/staff/settings' || 
                  item.href === '/staff/programs' || 
                  item.href === '/staff/curriculum' ||
                  item.href === '/staff/forms-protocols';
              })
              .map((item) => {
              const active = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-bold transition-all relative group active-scale ${
                    active 
                      ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/20 font-black' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <span className={`${active ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors'}`}>
                    {item.icon}
                  </span>
                  <span className="tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Exit/Signout Option */}
        <div className="pt-6 border-t border-[var(--border-primary)]/50">
          <button 
            onClick={handleSignOut}
            className="active-scale w-full py-4 border border-[var(--border-primary)]/50 rounded-2xl text-[10px] text-[var(--text-secondary)] font-bold tracking-wider flex items-center justify-center gap-3 hover:border-red-500/30 hover:text-red-500 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={14} /> Exit Matrix
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-[280px] min-h-screen relative overflow-y-auto bg-[var(--bg-secondary)]">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ 
          backgroundImage: 'linear-gradient(var(--accent-green) 1px, transparent 1px), linear-gradient(90deg, var(--accent-green) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} />

        {/* Top Header Bar */}
        <header className="sticky top-0 z-[100] bg-[var(--bg-header)]/90 backdrop-blur-xl border-b border-[var(--border-primary)]/50 px-4 md:px-10 h-[70px] md:h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[var(--bg-primary)]/50 border border-[var(--border-primary)]/50 text-[var(--accent-green)] active-scale transition-all"
            >
              <Menu size={20} />
            </button>
             <div className="w-1 h-6 bg-[var(--accent-green)] rounded-full shadow-[0_0_10px_var(--accent-green)] hidden xs:block" />
             <div className="hidden xs:block space-y-0.5">
                <div className="mb-0.5">
                  {getBreadcrumbs()}
                </div>
                <h1 className="font-sans text-sm md:text-base font-bold text-[var(--text-primary)] tracking-wide truncate max-w-[150px] md:max-w-none">
                  System Online • <span className="text-[var(--accent-green)] font-semibold">{profile?.first_name || 'Staff'}</span>
                </h1>
             </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle variant="icon" />
            <StaffNotificationDropdown />
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 group sm:px-4 sm:py-2 bg-transparent sm:bg-[var(--bg-primary)]/20 border-none sm:border border-[var(--border-primary)]/50 rounded-2xl hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-green)]/30 transition-all active-scale"
            >
               <div className="text-right hidden sm:block leading-tight">
                  <div className="text-sm font-extrabold text-[var(--text-primary)] tracking-wide">{userName}</div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-medium tracking-normal mt-0.5">
                    {profile?.role === 'medical' ? 'Medical Staff' : 'Operational Staff'}
                  </div>
               </div>
               <Avatar 
                  src={profile?.avatar_url}
                  name={userName}
                  size="md"
                  className="group-hover:border-[var(--border-active)] transition-all"
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
