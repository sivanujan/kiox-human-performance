"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import NotificationDropdown from "@/components/NotificationDropdown";
import { 
  Loader2, 
  Bell, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Clipboard, 
  Calendar, 
  BarChart3, 
  ShieldAlert, 
  Settings,
  Trophy,
  Zap,
  Plus,
  ArrowRight,
  Camera
} from "lucide-react";
import { Anton } from "next/font/google";
import AddAthleteModal from "@/components/modals/AddAthleteModal";
import AdminProfileModal from "@/components/modals/AdminProfileModal";
import Avatar from "@/components/ui/Avatar";


const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

const adminNavItems = [
  { 
    icon: <Zap size={18} />, 
    label: 'CONTROL CENTER',
    href: '/admin',
    section: 'MAIN',
  },
  { 
    icon: <Users size={18} />, 
    label: 'USER INVENTORY',
    href: '/admin/users',
    section: 'MANAGEMENT',
    showBadge: true,
  },
  { 
    icon: <Plus size={18} />, 
    label: 'ADD ATHLETE',
    href: '/admin/users?action=add',
    section: 'MANAGEMENT',
  },
  { 
    icon: <Clipboard size={18} />, 
    label: 'PROGRAMS',
    href: '/admin/programs',
    section: 'MANAGEMENT',
  },
  { 
    icon: <Trophy size={18} />, 
    label: 'COMMAND STAFF',
    href: '/admin/staff',
    section: 'MANAGEMENT',
  },
  { 
    icon: <Calendar size={18} />, 
    label: 'SCHEDULES',
    href: '/admin/schedules',
    section: 'OPERATIONS',
  },
  { 
    icon: <BarChart3 size={18} />, 
    label: 'ANALYTICS',
    href: '/admin/analytics',
    section: 'OPERATIONS',
  },
  { 
    icon: <Settings size={18} />, 
    label: 'SETTINGS',
    href: '/admin/settings',
    section: 'SYSTEM',
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut, supabase } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false);

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
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="text-[#22c55e] animate-spin" size={48} />
      </div>
    );
  }

  // Group nav items by section
  const sections = ['MAIN', 'MANAGEMENT', 'OPERATIONS', 'SYSTEM'];

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">
      {/* Sidebar */}
      <aside className="w-[260px] h-screen bg-[#0a0a0a] border-r border-[#22c55e]/15 fixed left-0 top-0 z-[100] flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-[#22c55e]/10">
          <Link href="/" className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border border-white/10 bg-black/50 flex items-center justify-center overflow-hidden">
                <Image src="/newlogo.png" alt="KIO-X" width={32} height={32} priority className="w-8 h-8 object-contain" />
             </div>
             <span className={`${anton.className} text-2xl tracking-widest text-white`}>KIO-X</span>
          </Link>
        </div>

        {/* Profile Block */}
        <motion.div 
          onClick={() => setIsAdminProfileOpen(true)}
          whileHover={{ x: 5, backgroundColor: "rgba(34, 197, 94, 0.05)" }}
          className="p-5 border-b border-[#22c55e]/10 cursor-pointer transition-colors group"
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
            <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px] border-2 border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.4)]">
               <Camera size={24} className="text-[#22c55e] mb-1 animate-pulse" />
               <span className="text-[8px] font-black text-white uppercase tracking-widest">MODIFY</span>
            </div>
            
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#22c55e] border-2 border-[#0a0a0a] flex items-center justify-center text-black shadow-[0_4px_10px_rgba(34,197,94,0.3)] z-20">
               <Zap size={12} fill="currentColor" />
            </div>
          </div>
          <div className={`${anton.className} text-[15px] text-white mb-0.5 uppercase tracking-wide group-hover:text-[#22c55e] transition-colors`}>
            {profile?.first_name} {profile?.last_name || 'KIO-X ADMIN'}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#22c55e]/10 border border-[#22c55e] text-[#22c55e] rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
            <Zap size={10} fill="currentColor" /> SUPER ADMIN
          </div>
        </motion.div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4">
          {sections.map((section) => (
            <div key={section}>
              {section !== 'MAIN' && (
                <div className={`${anton.className} text-[#333] text-[10px] tracking-[0.3em] px-5 py-4 pb-1 uppercase`}>
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
                    }}
                    className={`flex items-center gap-3 px-5 py-3 text-[12px] font-black tracking-[0.1em] uppercase transition-all border-l-[3px] ${
                      isActive 
                        ? 'bg-[#22c55e]/5 border-[#22c55e] text-[#22c55e]' 
                        : 'border-transparent text-[#555] hover:text-[#ccc] hover:bg-white/5'
                    }`}
                  >
                    <span className={isActive ? 'text-[#22c55e]' : 'text-current'}>{item.icon}</span>
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
        <div className="p-6 border-t border-[#22c55e]/10">
          <button
            onClick={handleSignOut}
            className="w-full py-3 border border-white/10 rounded-xl text-[10px] text-[#555] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:border-[#22c55e]/30 hover:text-[#22c55e] transition-all"
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
        <header className="sticky top-0 z-[50] bg-[#080808]/95 backdrop-blur-xl border-b border-[#22c55e]/10 px-10 h-[80px] flex items-center justify-between">
          <div>
            <div className={`text-[#22c55e] text-[12px] font-bold tracking-[0.2em] uppercase mb-0.5`}>Elite Access Authority</div>
            <h1 className={`${anton.className} text-2xl text-white uppercase tracking-wider`}>
              Control Center
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown />
            {/* Quick Add Button */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className={`px-6 py-2.5 bg-[#22c55e] text-black text-[15px] font-black tracking-wide uppercase rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]`}
            >
              Add Athlete
            </button>

          </div>
        </header>

        {/* Page Content */}
        <div className="relative z-10 px-10 py-8">
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
