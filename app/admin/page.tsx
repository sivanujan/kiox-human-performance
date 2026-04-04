"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Users as UsersIcon, 
  Activity, 
  Clipboard, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Trophy,
  Dumbbell,
  Clock,
  Zap,
  LayoutDashboard
} from "lucide-react";
import { Anton } from "next/font/google";
import { useAuth } from "@/components/providers/AuthProvider";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

export default function AdminDashboard() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAthletes: 0,
    pendingApprovals: 0,
    totalStaff: 0,
    activePrograms: 0,
  });
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && profile?.role === 'superadmin') {
      fetchData();
    }
  }, [user, profile, authLoading]);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    
    try {
      const { data: profiles, error: profileError } = await supabase.from("profiles").select("*");
      if (profileError) throw profileError;

      const { data: programsData, error: progError } = await supabase.from("programs").select("*");
      const programsList = programsData || [];

      if (profiles) {
        const pending = profiles.filter((p: any) => p.status === 'pending' && p.role === 'athlete');
        const staffMembers = profiles.filter((p: any) => p.role === 'staff');
        const athletes = profiles.filter((p: any) => p.role === 'athlete');

        setPendingUsers(pending);
        setStaff(staffMembers);
        
        setStats({
          totalAthletes: athletes.length,
          pendingApprovals: pending.length,
          totalStaff: staffMembers.length,
          activePrograms: programsList.length
        });
      }

      setPrograms(programsList);
    } catch (error) {
      console.error("Critical Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, programId: string, staffId: string) => {
    setActionLoading(userId);
    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, programId, staffId, action: 'approve' })
    });

    if (res.ok) {
      await fetchData();
    }
    setActionLoading(null);
  };

  if (loading) {
     return (
       <div className="flex items-center justify-center p-20">
         <Loader2 className="text-[#22c55e] animate-spin" size={48} />
       </div>
     );
  }

  const statCards = [
    { label: 'TOTAL ATHLETES', value: stats.totalAthletes, icon: '👥', color: '#22c55e', trend: 'All registered athletes' },
    { label: 'PENDING APPROVALS', value: stats.pendingApprovals, icon: '⏳', color: '#f59e0b', trend: 'Awaiting review' },
    { label: 'ELITE STAFF', value: stats.totalStaff, icon: '🏋️', color: '#22c55e', trend: 'Active coaches' },
    { label: 'ACTIVE PROGRAMS', value: stats.activePrograms, icon: '📋', color: '#22c55e', trend: 'Running programs' },
  ];

  return (
    <div className="space-y-12">
      {/* STATS MATRIX */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {statCards.map((stat, i) => (
          <div 
            key={i}
            className="group relative bg-[#22c55e]/[0.03] border border-[#22c55e]/10 p-7 rounded-2xl overflow-hidden transition-all hover:bg-[#22c55e]/[0.06] hover:border-[#22c55e]/30 hover:-translate-y-0.5"
          >
            <div className="flex justify-between items-start mb-5">
              <div className={`${anton.className} text-[#444] text-[10px] tracking-[0.3em] uppercase`}>{stat.label}</div>
              <div className="w-[36px] h-[36px] rounded-xl bg-[#22c55e]/[0.08] border border-[#22c55e]/20 flex items-center justify-center text-lg">{stat.icon}</div>
            </div>
            <div className={`${anton.className} text-[48px] leading-none mb-2`} style={{ color: stat.color, textShadow: `0 0 20px ${stat.color}40` }}>
              {stat.value}
            </div>
            <div className="flex items-center gap-1 text-[#333] text-[11px] font-bold">
               <span className="text-[#22c55e]">↑</span> {stat.trend}
            </div>
            <div className={`${anton.className} absolute -bottom-2 -right-2 text-[80px] opacity-10 transition-opacity group-hover:opacity-20`}>{stat.value}</div>
          </div>
        ))}
      </motion.div>

      {/* PENDING APPROVALS REGISTRY */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#22c55e]/[0.02] border border-[#22c55e]/15 rounded-2xl overflow-hidden"
      >
        {/* Section Header */}
        <div className="px-7 py-5 border-b border-[#22c55e]/10 flex items-center justify-between bg-[#22c55e]/[0.03]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">⏳</div>
             <div>
                <h3 className={`${anton.className} text-white text-lg tracking-wider`}>PENDING PROFILE APPROVAL</h3>
                <p className="text-[#555] text-xs font-bold uppercase tracking-wider">Athletes awaiting review and program assignment</p>
             </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full font-black border text-[13px] tracking-widest ${anton.className} ${
            pendingUsers.length > 0 ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-[#22c55e]/10 border-[#22c55e] text-[#22c55e]'
          }`}>
            {pendingUsers.length} REQUESTS
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {pendingUsers.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
               <div className="text-5xl mb-4">✅</div>
               <h4 className={`${anton.className} text-[#22c55e] text-lg tracking-[0.1em] mb-1`}>ALL PROFILES SYNCHRONIZED</h4>
               <p className="text-[#444] text-sm uppercase font-black tracking-widest">No pending athlete approvals</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[2fr,1fr,1fr,1fr,auto] gap-4 px-7 py-3 border-b border-[#22c55e]/10">
                 {['ATHLETE', 'SPORT/POSITION', 'ASSIGN PROGRAM', 'ASSIGN STAFF', 'ACTIONS'].map((h, i) => (
                    <div key={i} className={`${anton.className} text-[#444] text-[10px] tracking-[0.25em] uppercase`}>{h}</div>
                 ))}
              </div>
              <div className="divide-y divide-[#22c55e]/10">
                {pendingUsers.map((user, i) => (
                  <div key={user.id} className="grid grid-cols-[2fr,1fr,1fr,1fr,auto] gap-4 px-7 py-5 items-center transition-colors hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                       <div className={`${anton.className} w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e] text-lg`}>
                         {user.first_name[0].toUpperCase()}
                       </div>
                       <div>
                          <p className="text-white font-bold text-sm uppercase tracking-wide">{user.first_name} {user.last_name}</p>
                          <p className="text-[#555] text-xs font-medium">{user.username || user.email}</p>
                       </div>
                    </div>

                    <div className="text-xs uppercase font-bold tracking-widest">
                       <p className="text-[#ccc] mb-0.5">{user.position_played || 'Position N/A'}</p>
                       <p className="text-[#555] text-[10px]">Deploy Ready</p>
                    </div>

                    <select
                      id={`prog-${user.id}`}
                      className="bg-[#111] border border-[#22c55e]/20 text-white px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest outline-none focus:border-[#22c55e]"
                    >
                      <option value="">Select Program</option>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>

                    <select
                      id={`staff-${user.id}`}
                      className="bg-[#111] border border-[#22c55e]/20 text-white px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest outline-none focus:border-[#22c55e]"
                    >
                      <option value="">Select Staff</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                    </select>

                    <div className="flex gap-2">
                       <button
                         onClick={() => {
                           const p = (document.getElementById(`prog-${user.id}`) as HTMLSelectElement).value;
                           const s = (document.getElementById(`staff-${user.id}`) as HTMLSelectElement).value;
                           handleApprove(user.id, p, s);
                         }}
                         disabled={!!actionLoading}
                         className={`${anton.className} bg-[#22c55e] text-black px-4 py-2 rounded-lg text-[11px] tracking-[0.1em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50`}
                       >
                         {actionLoading === user.id ? <Loader2 size={14} className="animate-spin" /> : '✓ APPROVE'}
                       </button>
                       <button className="bg-transparent border border-red-500/30 text-red-500 px-3 py-2 rounded-lg text-[11px] hover:bg-red-500/10 transition-all font-black uppercase">
                         ✕
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.section>

      {/* QUICK ACCESS CARDS */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        {[
          { icon: '👥', title: 'USER INVENTORY', desc: 'Manage all registered athletes and their profiles', href: '/admin/users' },
          { icon: '📋', title: 'ARCHITECTURE MATRIX', desc: 'Create and manage training programs', href: '/admin/programs' },
          { icon: '🏋️', title: 'COMMAND STAFF', desc: 'Manage coaching staff and assignments', href: '/admin/staff' },
        ].map((card, i) => (
          <div 
            key={i}
            onClick={() => router.push(card.href)}
            className="group bg-[#22c55e]/[0.03] border border-[#22c55e]/15 p-8 rounded-2xl cursor-pointer transition-all hover:bg-[#22c55e]/[0.06] hover:border-[#22c55e]/40 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(34,197,94,0.1)]"
          >
            <div className="flex gap-5">
              <div className="w-[48px] h-[48px] rounded-xl bg-[#22c55e]/[0.1] border border-[#22c55e]/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <div>
                <h4 className={`${anton.className} text-white text-[17px] tracking-wider mb-1`}>{card.title}</h4>
                <p className="text-[#444] text-xs font-bold uppercase tracking-wider mb-4 leading-relaxed">{card.desc}</p>
                <div className={`${anton.className} text-[#22c55e] text-[11px] tracking-[0.15em] flex items-center gap-1.5`}>
                  ADMIN ACCESS MODE <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* SYSTEM ACTIVITY LOG */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#22c55e]/[0.02] border border-[#22c55e]/15 p-8 rounded-2xl"
      >
        <h3 className={`${anton.className} text-[#22c55e] text-base tracking-[0.1em] mb-6 flex items-center gap-3 uppercase`}>
           <Zap size={18} fill="currentColor" className="animate-pulse" /> System Activity Log
        </h3>
        
        <div className="space-y-4">
          {[
            { time: 'Just now', text: 'Auth registry initialized', icon: '🔐' },
            { time: '2 mins ago', text: 'Admin command session started', icon: '⚡' },
            { time: '14 mins ago', text: 'User baseline synchronized', icon: '📡' },
            { time: '38 mins ago', text: 'Protocol matrix updated', icon: '📋' },
          ].map((activity, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-[#22c55e]/5 last:border-0 grow">
              <div className="w-10 h-10 rounded-lg bg-[#22c55e]/[0.08] flex items-center justify-center text-sm">{activity.icon}</div>
              <div className="flex-1">
                 <p className="text-white/80 text-[13px] font-bold uppercase tracking-widest">{activity.text}</p>
              </div>
              <div className="text-[#444] text-[10px] font-black uppercase tracking-[0.05em]">{activity.time}</div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
