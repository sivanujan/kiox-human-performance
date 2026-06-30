"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import NotificationDropdown from "@/components/NotificationDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Loader2, 
  Bell, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Clipboard, 
  Calendar, 
  CalendarDays,
  BarChart3, 
  ShieldAlert, 
  Settings,
  Trophy,
  Zap,
  Plus,
  ArrowRight,
  ChevronRight,
  Camera,
  Menu,
  X as CloseIcon,
  MessageSquare,
  FileText
} from "lucide-react";
import AddAthleteModal from "@/components/modals/AddAthleteModal";
import AdminProfileModal from "@/components/modals/AdminProfileModal";
import Avatar from "@/components/ui/Avatar";



const adminNavItems = [
  { 
    icon: <Zap size={18} />, 
    label: 'DASHBOARD',
    href: '/admin',
    section: 'MAIN' },
  { 
    icon: <Clipboard size={18} />, 
    label: 'CURRICULUM',
    href: '/admin/curriculum',
    section: 'MAIN' },
  { 
    icon: <FileText size={18} />, 
    label: 'FORMS & PROTOCOLS',
    href: '/admin/forms-protocols',
    section: 'MANAGEMENT' },
  { 
    icon: <Users size={18} />, 
    label: 'MY ATHLETES',
    href: '/admin/users',
    section: 'MANAGEMENT',
    showBadge: true },
  { 
    icon: <Plus size={18} />, 
    label: 'ADD ATHLETE',
    href: '/admin/users?action=add',
    section: 'MANAGEMENT' },
  { 
    icon: <Clipboard size={18} />, 
    label: 'PROGRAMS',
    href: '/admin/programs',
    section: 'MANAGEMENT' },
  { 
    icon: <Trophy size={18} />, 
    label: 'COMMAND STAFF',
    href: '/admin/staff',
    section: 'MANAGEMENT' },
  { 
    icon: <Calendar size={18} />, 
    label: 'AVAILABILITY',
    href: '/admin/availability',
    section: 'MANAGEMENT' },
  { 
    icon: <CalendarDays size={18} />, 
    label: 'CALENDAR',
    href: '/admin/calendar',
    section: 'OPERATIONS' },
  { 
    icon: <Calendar size={18} />, 
    label: 'SCHEDULES',
    href: '/admin/schedules',
    section: 'OPERATIONS' },
  { 
    icon: <Zap size={18} />, 
    label: 'SESSION REQUESTS',
    href: '/admin/bookings',
    section: 'OPERATIONS' },
  { 
    icon: <BarChart3 size={18} />, 
    label: 'ANALYTICS',
    href: '/admin/analytics',
    section: 'OPERATIONS' },
  { 
    icon: <MessageSquare size={18} />, 
    label: 'CHAT TERMINAL',
    href: '/admin/chat',
    section: 'OPERATIONS' },
  { 
    icon: <Camera size={18} />, 
    label: 'GALLERY',
    href: '/gallery',
    section: 'OPERATIONS' },
  { 
    icon: <Settings size={18} />, 
    label: 'SETTINGS',
    href: '/admin/settings',
    section: 'SYSTEM' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut, supabase } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && user) {
      if (profile?.role !== 'superadmin') {
        router.push("/dashboard");
      } else {
        fetchPendingCount();
      }
    } else if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, profile, loading, router]);

  const fetchPendingCount = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "athlete")
      .eq("status", "pending");
    
    if (!error && data) {
      setPendingCount(data.length);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-green)]/20 border-t-[var(--accent-green)] animate-spin" />
          <div className="text-[10px] font-bold text-[var(--accent-green)] uppercase tracking-widest animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  // Group nav items by section
  const sections = ['MAIN', 'MANAGEMENT', 'OPERATIONS', 'SYSTEM'];

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) {
      return <span className="text-gray-400 font-sans text-xs">Dashboard</span>;
    }
    return (
      <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
        <Link href="/admin" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
        <ChevronRight size={12} className="text-gray-600" />
        <span className="text-[var(--accent-green)] font-semibold uppercase">
          {segments[segments.length - 1].replace(/-/g, ' ')}
        </span>
      </span>
    );
  };

  const userName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
    : user?.email?.split('@')[0] || 'Operator';

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
        <div className="space-y-8 flex-1 flex flex-col overflow-y-auto pr-1 custom-scrollbar">
          {/* Brand Logo */}
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 active-scale">
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

          {/* Admin Profile Box */}
          <div className="p-4 bg-[var(--bg-primary)]/20 border border-[var(--border-primary)]/50 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-[var(--accent-green)]/30 transition-all" onClick={() => setIsAdminProfileOpen(true)}>
             <Avatar 
                src={profile?.avatar_url}
                name={userName}
                role="superadmin"
                size="md"
             />
             <div className="min-w-0">
                <div className="text-sm font-extrabold text-[var(--text-primary)] truncate tracking-wide">{userName}</div>
                <div className="text-[10px] text-[var(--text-secondary)] font-medium truncate tracking-normal mt-0.5">Super Admin</div>
             </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4 flex-1">
            {sections.map((section) => (
              <div key={section} className="space-y-1">
                {section !== 'MAIN' && (
                  <div className={`font-display text-[var(--text-muted)] text-[9px] tracking-[0.3em] px-4 py-2 pb-1 uppercase`}>
                    {section}
                  </div>
                )}
                {adminNavItems.filter(item => item.section === section).map((item, i) => {
                  const active = pathname === item.href || (item.label === 'MY ATHLETES' && pathname.startsWith('/admin/users'));
                  const itemLabel = item.label.charAt(0).toUpperCase() + item.label.slice(1).toLowerCase();
                  return (
                    <Link 
                      key={i}
                      href={item.href}
                      onClick={(e) => {
                        if (item.label === 'ADD ATHLETE') {
                          e.preventDefault();
                          setIsAddModalOpen(true);
                        }
                        setSidebarOpen(false);
                      }}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-bold transition-all relative group active-scale ${
                        active 
                          ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/20 font-black' 
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      <span className={`${active ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors'}`}>
                        {item.icon}
                      </span>
                      <span className="tracking-wide">{itemLabel}</span>
                      {item.showBadge && pendingCount > 0 && (
                        <span className="ml-auto bg-[#f59e0b] text-black text-[9px] px-2 py-0.5 rounded-full font-black">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
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
                  System Online • <span className="text-[var(--accent-green)] font-semibold">{profile?.first_name || 'Admin'}</span>
                </h1>
             </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle variant="icon" />
            <NotificationDropdown />
            {/* Quick Add Button */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="active-scale px-4 md:px-6 py-2 md:py-3 bg-[var(--accent-green)] text-[var(--text-on-green)] font-button text-xs uppercase rounded-xl hover:bg-[var(--accent-green-dim)] transition-all shadow-[0_0_20px_var(--shadow-accent)]"
            >
              <span className="hidden xs:inline">Add Athlete</span>
              <Plus className="xs:hidden" size={20} />
            </button>
            <button 
              onClick={() => setIsAdminProfileOpen(true)}
              className="hidden xs:flex items-center gap-3 group ml-2 sm:px-4 sm:py-2 bg-transparent sm:bg-[var(--bg-primary)]/20 border-none sm:border border-[var(--border-primary)]/50 rounded-2xl hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-green)]/30 transition-all active-scale"
            >
               <div className="text-right hidden sm:block leading-tight">
                  <div className="text-sm font-extrabold text-[var(--text-primary)] tracking-wide">{userName}</div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-medium tracking-normal mt-0.5">
                    Super Admin
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

        <AddAthleteModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            // Dispatch custom event to refresh user inventory without full reload
            window.dispatchEvent(new CustomEvent('refresh-users'));
          }}
        />
        <AdminProfileModal isOpen={isAdminProfileOpen} onClose={() => setIsAdminProfileOpen(false)} />
      </main>
    </div>
  );
}
