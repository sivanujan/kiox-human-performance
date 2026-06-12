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
  Camera,
  Menu,
  X as CloseIcon,
  MessageSquare
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
        <Loader2 className="text-[var(--accent-green)] animate-spin" size={48} />
      </div>
    );
  }

  // Group nav items by section
  const sections = ['MAIN', 'MANAGEMENT', 'OPERATIONS', 'SYSTEM'];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex overflow-hidden">
      {/* Sidebar Overlay - Mobile Only */}
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
        fixed inset-y-0 left-0 z-[150] w-[260px] bg-[var(--bg-sidebar)] border-r border-[var(--border-primary)] 
        flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border border-white/10 bg-black/50 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="KIO-X" width={32} height={32} priority className="w-8 h-8 object-contain" />
             </div>
             <span className={`font-display text-2xl tracking-widest text-[var(--accent-green)]`}>KIO-X</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white transition-colors">
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Profile Block */}
        <motion.div 
          onClick={() => setIsAdminProfileOpen(true)}
          whileHover={{ x: 5, backgroundColor: "rgba(34, 197, 94, 0.05)" }}
          className="p-5 border-b border-[var(--border-primary)] cursor-pointer transition-colors group"
          title="Click to Modify Profile"
        >
          <div className="relative inline-block mb-3">
            <Avatar 
              src={profile?.avatar_url}
              name={`${profile?.first_name} ${profile?.last_name}`}
              role="superadmin"
              size="xl"
            />
            {/* Upload Overlay - Admin Style */}
            <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px] border-2 border-[var(--accent-green)] shadow-[0_0_20px_var(--shadow-accent-glow)]">
               <Camera size={24} className="text-[var(--accent-green)] mb-1 animate-pulse" />
               <span className="text-[8px] font-black text-white uppercase tracking-widest">MODIFY</span>
            </div>
            
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[var(--accent-green)] border-2 border-[var(--bg-sidebar)] flex items-center justify-center text-[var(--text-on-green)] shadow-[0_4px_10px_var(--shadow-accent)] z-20">
               <Zap size={12} fill="currentColor" />
            </div>
          </div>
          <div className={`font-display text-[15px] text-[var(--text-primary)] mb-0.5 uppercase tracking-wide group-hover:text-[var(--accent-green)] transition-colors`}>
            {profile?.first_name} {profile?.last_name || 'KIO-X ADMIN'}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--accent-green)]/10 border border-[var(--accent-green)] text-[var(--accent-green)] rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
            <Zap size={10} fill="currentColor" /> SUPER ADMIN
          </div>
        </motion.div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4">
          {sections.map((section) => (
            <div key={section}>
              {section !== 'MAIN' && (
                <div className={`font-display text-[var(--text-muted)] text-[10px] tracking-[0.3em] px-5 py-4 pb-1 uppercase`}>
                  {section}
                </div>
              )}
              {adminNavItems.filter(item => item.section === section).map((item, i) => {
                const isActive = pathname === item.href;
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
                    className={`flex items-center gap-3 px-5 py-3 text-[12px] font-black tracking-[0.1em] uppercase transition-all border-l-[3px] ${
                      isActive 
                        ? 'bg-[var(--accent-green)]/5 border-[var(--accent-green)] text-[var(--accent-green)]' 
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                    }`}
                  >
                    <span className={isActive ? 'text-[var(--accent-green)]' : 'text-current'}>{item.icon}</span>
                    {item.label}
                    {item.showBadge && pendingCount > 0 && (
                      <span className="ml-auto bg-[#f59e0b] text-black text-[10px] px-2 py-0.5 rounded-full font-black">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-6 border-t border-[var(--border-primary)]">
          <button
            onClick={handleSignOut}
            className="active-scale w-full py-3 border border-white/10 rounded-xl text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:border-[var(--accent-green)]/30 hover:text-[var(--accent-green)] transition-all"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-[260px] min-h-screen relative overflow-y-auto bg-[var(--bg-secondary)]">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ 
          backgroundImage: 'linear-gradient(var(--accent-green) 1px, transparent 1px), linear-gradient(90deg, var(--accent-green) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} />

        {/* Responsive Header Bar */}
        <header className="sticky top-0 z-[100] bg-[var(--bg-header)] backdrop-blur-xl border-b border-[var(--border-primary)] px-4 md:px-10 h-[70px] md:h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-[var(--accent-green)] active-scale transition-all"
            >
              <Menu size={20} />
            </button>
            <div className="hidden xs:block">
              <div className={`text-[var(--accent-green)] text-[9px] md:text-[12px] font-bold tracking-[0.2em] uppercase mb-0.5`}>Elite Access Authority</div>
              <h1 className={`font-display text-lg md:text-2xl text-[var(--text-primary)] uppercase tracking-wider truncate max-w-[150px] md:max-w-none`}>
                {pathname === '/admin' ? 'Control Center' : pathname.split('/').pop()?.replace(/-/g, ' ')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <NotificationDropdown />
            {/* Quick Add Button */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className={`active-scale px-4 md:px-6 py-2 md:py-2.5 bg-[var(--bg-button-primary)] text-[var(--text-on-green)] text-[12px] md:text-[15px] font-black tracking-wide uppercase rounded-xl hover:bg-white transition-all shadow-[0_0_20px_var(--shadow-accent)]`}
            >
              <span className="hidden xs:inline">Add Athlete</span>
              <Plus className="xs:hidden" size={20} />
            </button>
            <button 
              onClick={() => setIsAdminProfileOpen(true)}
              className="hidden xs:flex items-center gap-3 group ml-2"
            >
               <Avatar 
                  src={profile?.avatar_url}
                  name={`${profile?.first_name} ${profile?.last_name}`}
                  size="md"
                  className="group-hover:border-[var(--accent-green)] transition-all"
               />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="relative z-10 px-4 md:px-10 py-6 md:py-8">
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
