"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import NotificationDropdown from "@/components/NotificationDropdown";
import ThemeToggle from "@/components/ThemeToggle";
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
  ChevronRight,
  Activity,
  Menu,
  X,
  Camera,
  MessageSquare,
  FileText
} from "lucide-react";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import { useTrainingReminders } from "@/hooks/useTrainingReminders";

const athleteNavItems = [
  { icon: <LayoutDashboard size={18} />, label: 'OVERVIEW', href: '/dashboard' },
  { icon: <UserIcon size={18} />, label: 'MY PROFILE', href: '/dashboard/profile' },
  { icon: <Clipboard size={18} />, label: 'MY PROGRAM', href: '/dashboard/program' },
  { icon: <Calendar size={18} />, label: 'CALENDAR', href: '/dashboard/calendar' },
  { icon: <BarChart3 size={18} />, label: 'PROGRESS', href: '/dashboard/progress' },
  { icon: <MessageSquare size={18} />, label: 'CHAT TERMINAL', href: '/dashboard/chat' },
  { icon: <Target size={18} />, label: 'BOOK SESSION', href: '/dashboard/booking/coach', badge: 'NEW' },
  { icon: <Settings size={18} />, label: 'SETTINGS', href: '/dashboard/settings' },
  { icon: <Clipboard size={18} />, label: 'CURRICULUM', href: '/dashboard/curriculum' },
  { icon: <FileText size={18} />, label: 'DOCUMENTS', href: '/dashboard/forms-protocols' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut, supabase } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [teams, setTeams] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasActiveInjury, setHasActiveInjury] = useState(false);
  const [childProfile, setChildProfile] = useState<any>(null);

  // Initialize training reminders
  useTrainingReminders();

  // Fetch child profile details if logged in as a parent
  useEffect(() => {
    if (profile?.role === 'parent' && profile.parent_of) {
      const fetchChildProfile = async () => {
        try {
          const res = await fetch(`/api/user/profile-lookup?id=${profile.parent_of}`);
          const data = await res.json();
          if (data && !data.error) {
            setChildProfile(data);
          }
        } catch (err) {
          console.error("Layout Child Profile Fetch Error:", err);
        }
      };
      fetchChildProfile();
    }
  }, [profile]);

  // Check and watch active injuries in real-time
  useEffect(() => {
    if (user && supabase) {
      const athleteId = profile?.role === 'parent' ? profile.parent_of : user.id;
      if (!athleteId) return;

      const checkInjury = async () => {
        try {
          const { data, error } = await supabase
            .from('athlete_injury_logs')
            .select('id')
            .eq('athlete_id', athleteId)
            .neq('status', 'Cleared')
            .limit(1);
          
          if (!error && data && data.length > 0) {
            setHasActiveInjury(true);
          } else {
            // Also check profile or child profile training status
            let isInjured = false;
            if (profile?.role === 'parent') {
              try {
                const res = await fetch(`/api/user/profile-lookup?id=${athleteId}`);
                const cp = await res.json();
                if (cp && !cp.error && (cp.training_status?.toUpperCase() === 'INJURED' || cp.injury_risk?.toUpperCase() === 'HIGH')) {
                  isInjured = true;
                }
              } catch (err) {
                console.error("Layout Injury Check cp query error:", err);
              }
            } else {
              isInjured = profile?.training_status?.toUpperCase() === 'INJURED' || profile?.injury_risk?.toUpperCase() === 'HIGH';
            }

            setHasActiveInjury(isInjured);
          }
        } catch (e) {
          console.error("Layout Injury Check Error:", e);
        }
      };
      
      checkInjury();
      
      // Setup realtime listener for injury logs and profiles table changes
      const channel = supabase
        .channel(`injury_layout_watch_${athleteId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'athlete_injury_logs', filter: `athlete_id=eq.${athleteId}` },
          () => { checkInjury(); }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${athleteId}` },
          () => { checkInjury(); }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, profile?.id, profile?.parent_of, profile?.training_status, profile?.injury_risk, supabase]);

  // Route security redirection: Redirect injured user to dashboard overview if they try to access other routes
  useEffect(() => {
    if (hasActiveInjury && pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  }, [hasActiveInjury, pathname, router]);

  // Route security redirection for external users
  useEffect(() => {
    if (profile?.role === 'external') {
      const allowedPaths = ['/dashboard', '/dashboard/calendar', '/dashboard/chat', '/dashboard/settings'];
      if (!allowedPaths.includes(pathname)) {
        router.push('/dashboard');
      }
    }
  }, [profile?.role, pathname, router]);

  useEffect(() => {
    console.log("[KIO-X REDIRECT DETECTOR] loading =", loading, "| user =", user?.id, "| profile =", profile);
    if (!loading) {
      if (!user) {
        console.log("[KIO-X REDIRECT DETECTOR] No active session. Sending to /signin.");
        router.push("/signin");
      } else if (profile?.role === 'superadmin') {
        console.log("[KIO-X REDIRECT DETECTOR] User is Superadmin. Redirecting to /admin.");
        router.push("/admin");
      } else if (profile?.role === 'staff' || profile?.role === 'medical') {
        console.log(`[KIO-X REDIRECT DETECTOR] User has elevated role: ${profile.role}. Redirecting to /staff.`);
        router.push("/staff");
      } else {
        console.log(`[KIO-X REDIRECT DETECTOR] User role is: ${profile?.role || 'athlete'} (fallback). Displaying Athlete Dashboard.`);
        fetchTeams();
      }
    }
  }, [user, profile, loading, router]);

  // Close sidebar on navigation change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="text-[var(--accent-green)] animate-spin" size={48} />
      </div>
    );
  }

  const userTeam = teams.find(t => t.id === profile?.team_id);
  const userName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Elite Performer';
  const status = profile?.status || 'OPTIMIZED';

  const getBreadcrumbs = () => {
    switch (pathname) {
      case '/dashboard':
        return <span className="text-gray-400 font-sans text-xs">Dashboard</span>;
      case '/dashboard/profile':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/dashboard" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">My Profile</span>
          </span>
        );
      case '/dashboard/program':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/dashboard" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">My Program</span>
          </span>
        );
      case '/dashboard/calendar':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/dashboard" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Calendar</span>
          </span>
        );
      case '/dashboard/progress':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/dashboard" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Progress</span>
          </span>
        );
      case '/dashboard/chat':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/dashboard" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Chat Terminal</span>
          </span>
        );
      case '/dashboard/booking/coach':
      case '/dashboard/booking':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/dashboard" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Book Session</span>
          </span>
        );
      case '/dashboard/settings':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/dashboard" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Settings</span>
          </span>
        );
      case '/dashboard/curriculum':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/dashboard" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Curriculum</span>
          </span>
        );
      case '/dashboard/forms-protocols':
        return (
          <span className="text-gray-400 font-sans text-xs flex items-center gap-1">
            <Link href="/dashboard" className="hover:text-[var(--accent-green)] transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-[var(--accent-green)] font-semibold">Forms & Protocols</span>
          </span>
        );
      default:
        return <span className="text-gray-400 font-sans text-xs">Dashboard</span>;
    }
  };

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
            <Link href="/dashboard" className="flex items-center gap-3 active-scale">
              <div className="w-9 h-9 rounded-xl border border-[var(--border-primary)]/50 bg-[var(--bg-primary)]/50 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="KIO-X" width={28} height={28} className="object-contain" priority unoptimized={true} />
              </div>
              <span className={`font-display text-lg font-black tracking-[3px] text-[var(--text-primary)]`}>KIO-X</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded bg-[var(--bg-primary)]/50 border border-[var(--border-primary)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X size={16} />
            </button>
          </div>

          {/* User Profile Block */}
          <div className="p-4 bg-[var(--bg-primary)]/20 border border-[var(--border-primary)]/50 rounded-2xl flex items-center gap-4">
             <Avatar 
                src={profile?.avatar_url}
                name={userName}
                role="athlete"
                size="md"
             />
             <div className="min-w-0">
                <div className="text-sm font-extrabold text-[var(--text-primary)] truncate tracking-wide">{userName}</div>
                <div className="text-[10px] text-[var(--text-secondary)] font-medium truncate tracking-normal mt-0.5">
                  {profile?.role === 'parent' ? 'Parent Monitor' : profile?.role === 'external' ? 'External Guest' : 'Elite Performer'}
                </div>
             </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {(() => {
              const isParent = profile?.role === 'parent';
              const isExternal = profile?.role === 'external';
              const navItems = isExternal ? [
                { icon: athleteNavItems[0].icon, label: 'Overview', href: '/dashboard' },
                { icon: athleteNavItems[3].icon, label: 'Calendar', href: '/dashboard/calendar' },
                { icon: athleteNavItems[5].icon, label: 'Chat Terminal', href: '/dashboard/chat' },
                { icon: athleteNavItems[7].icon, label: 'Settings', href: '/dashboard/settings' },
              ] : isParent ? [
                { icon: athleteNavItems[0].icon, label: 'Overview', href: '/dashboard' },
                { icon: athleteNavItems[1].icon, label: 'My Profile', href: '/dashboard/profile' },
                { icon: athleteNavItems[2].icon, label: "Child's Program", href: '/dashboard/program' },
                { icon: athleteNavItems[3].icon, label: "Child's Calendar", href: '/dashboard/calendar' },
                { icon: athleteNavItems[4].icon, label: "Child's Progress", href: '/dashboard/progress' },
                { icon: athleteNavItems[5].icon, label: 'Chat Terminal', href: '/dashboard/chat' },
                { icon: athleteNavItems[7].icon, label: 'Settings', href: '/dashboard/settings' },
              ] : [
                { icon: athleteNavItems[0].icon, label: 'Overview', href: '/dashboard' },
                { icon: athleteNavItems[1].icon, label: 'My Profile', href: '/dashboard/profile' },
                { icon: athleteNavItems[2].icon, label: 'My Program', href: '/dashboard/program' },
                { icon: athleteNavItems[3].icon, label: 'Calendar', href: '/dashboard/calendar' },
                { icon: athleteNavItems[4].icon, label: 'Progress', href: '/dashboard/progress' },
                { icon: athleteNavItems[5].icon, label: 'Chat Terminal', href: '/dashboard/chat' },
                { icon: athleteNavItems[6].icon, label: 'Book Session', href: '/dashboard/booking/coach', badge: 'NEW' },
                { icon: athleteNavItems[9].icon, label: 'Forms & Protocols', href: '/dashboard/forms-protocols' },
                { icon: athleteNavItems[7].icon, label: 'Settings', href: '/dashboard/settings' },
              ];

              return navItems.map((item, i) => {
                const active = pathname === item.href || (item.href === '/dashboard/booking/coach' && pathname.startsWith('/dashboard/booking'));
                const isDisabled = hasActiveInjury && item.href !== '/dashboard';
                return (
                  <Link 
                    key={i}
                    href={isDisabled ? '#' : item.href}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                      }
                    }}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-bold transition-all relative group active-scale ${
                      active 
                        ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/20 font-black' 
                        : isDisabled
                          ? 'text-[var(--text-muted)] cursor-not-allowed opacity-20 pointer-events-none'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <span className={`${active ? 'text-[var(--accent-green)]' : isDisabled ? 'text-red-500/30' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors'}`}>
                      {item.icon}
                    </span>
                    <span className="tracking-wide">{item.label}</span>
                    {item.badge && !isDisabled && (
                      <span className="ml-auto bg-red-500 text-white text-[7px] px-1.5 py-0.5 rounded-sm font-black animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    {isDisabled && (
                      <span className="ml-auto text-[7px] font-black tracking-widest text-red-500/60 bg-red-500/10 border border-red-500/25 px-1.5 py-0.5 rounded uppercase">
                         Locked
                      </span>
                    )}
                  </Link>
                );
              });
            })()}
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
                  System Online • <span className="text-[var(--accent-green)] font-semibold">{profile?.first_name || 'Protocol'}</span>
                   {profile?.role === 'parent' && (
                      <span className="text-[var(--text-muted)] text-[9px] font-black tracking-[2px] ml-2">
                        (MONITORING: {childProfile ? `${childProfile.first_name} ${childProfile.last_name || ''}`.toUpperCase() : 'CHILD'})
                      </span>
                   )}
                </h1>
             </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle variant="icon" />
            <NotificationDropdown />
            <Link href="/dashboard/profile" className="flex items-center gap-3 group sm:px-4 sm:py-2 bg-transparent sm:bg-[var(--bg-primary)]/20 border-none sm:border border-[var(--border-primary)]/50 rounded-2xl hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-green)]/30 transition-all active-scale">
               <div className="text-right hidden sm:block leading-tight">
                  <div className="text-sm font-extrabold text-[var(--text-primary)] tracking-wide">{userName}</div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-medium tracking-normal mt-0.5">
                    {status}
                  </div>
               </div>
               <Avatar 
                  src={profile?.avatar_url}
                  name={userName}
                  size="md"
                  className="group-hover:border-[var(--border-active)] transition-all"
               />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="relative z-10 p-4 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
