"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Users, 
  ShieldCheck, 
  Briefcase, 
  Mail, 
  Phone, 
  Activity, 
  ChevronRight, 
  Loader2,
  Calendar
} from "lucide-react";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

export default function CommandStaff() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/signin");
      } else if (profile?.role !== 'superadmin') {
        router.push("/dashboard");
      } else {
        fetchStaffData();
      }
    }
  }, [user, profile, authLoading, router]);

  const fetchStaffData = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (!data.error) {
      setAllUsers(data);
      const staffList = data.filter((p: any) => p.role === 'staff' || p.role === 'superadmin');
      setStaff(staffList);
    }
    setLoading(false);
  };

  const getAssignedAthletes = (staffId: string) => {
    return allUsers.filter(p => p.assigned_staff === staffId && p.role === 'athlete');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="text-[#22c55e] animate-spin" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] pt-[120px] pb-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="text-[#22c55e]" size={16} />
            <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px]">Elite Performance Command</span>
          </div>
          <h1 className={`${anton.className} text-5xl md:text-7xl text-white uppercase tracking-wider`}>Command Staff</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence>
            {staff.map((member, i) => {
              const assigned = getAssignedAthletes(member.id);
              return (
                <motion.div 
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#111] border border-white/10 p-8 rounded-3xl hover:border-[#22c55e]/30 transition-all group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Briefcase size={120} />
                  </div>

                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#22c55e]/30 to-[#22c55e]/10 border-2 border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.2)] flex items-center justify-center text-2xl font-['Anton'] text-[#22c55e]">
                      {member.first_name ? member.first_name[0].toUpperCase() : 'S'}
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-[8px] font-black uppercase tracking-widest rounded-full">{member.role}</span>
                    </div>
                  </div>

                  <div className="relative z-10 mb-8">
                    <h3 className="text-3xl font-bold uppercase tracking-wider mb-2 text-white">{member.first_name} {member.last_name}</h3>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-white/40">
                        <Mail size={14} className="text-[#22c55e]" />
                        <span className="text-[10px] font-black uppercase tracking-[1px]">{member.username}</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/40">
                        <Phone size={14} className="text-[#22c55e]" />
                        <span className="text-[10px] font-black uppercase tracking-[1px]">{member.phone_number || 'No contact provided'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 border-t border-white/5 pt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">Active Roster Assignments</h4>
                      <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[1px]">{assigned.length} Athletes</span>
                    </div>
                    
                    <div className="space-y-3">
                      {assigned.length === 0 ? (
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[2px] italic">No active assignments</p>
                      ) : (
                        assigned.map((athlete, idx) => (
                          <div key={athlete.id} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-[#22c55e]/5 group/item transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider">{athlete.first_name} {athlete.last_name}</span>
                            </div>
                            <button className="text-white/20 group-hover/item:text-[#22c55e] transition-colors">
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
