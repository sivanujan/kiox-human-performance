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
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import Avatar from "@/components/ui/Avatar";

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
        <Loader2 className="text-[#00ff88] animate-spin" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] pt-[120px] pb-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="text-[#00ff88]" size={16} />
            <span className="text-[10px] font-black text-[#00ff88] uppercase tracking-[4px]">Elite Performance Command</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl text-white font-black uppercase tracking-tight">
            Command Staff <span className="text-2xl md:text-3xl text-gray-500 font-bold">({staff.length})</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {staff.map((member, i) => {
              const assigned = getAssignedAthletes(member.id);
              const isSuperAdmin = member.role === 'superadmin';

              return (
                <motion.div 
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-[#111] border border-white/10 border-t-2 p-5 rounded-3xl transition-all group overflow-hidden relative hover:border-[#00ff88]/30 hover:shadow-[0_0_12px_rgba(0,255,136,0.15)] ${isSuperAdmin ? 'border-t-[#00ff88]' : 'border-t-gray-500/30'}`}
                >
                  {/* Subtle Background watermark */}
                  <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity pointer-events-none">
                    <Briefcase size={80} />
                  </div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <Avatar 
                      src={member.avatar_url}
                      name={`${member.first_name} ${member.last_name}`}
                      role={member.role}
                      size="lg"
                      className={`border-2 border-[#00ff88]/50 !w-16 !h-16 xl:!w-14 xl:!h-14 ${isSuperAdmin ? 'shadow-[0_0_20px_rgba(0,255,136,0.25)]' : ''}`}
                    />
                    <div className="text-right">
                      {isSuperAdmin ? (
                        <span className="px-3 py-1.5 bg-[#00ff88] text-black text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_10px_rgba(0,255,136,0.25)]">
                          {member.role}
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-transparent border border-white/20 text-white/60 text-[9px] font-black uppercase tracking-widest rounded-full">
                          {member.role}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 mb-6">
                    <h3 className="text-xl xl:text-lg font-bold uppercase tracking-wider mb-3 text-white truncate">{member.first_name} {member.last_name}</h3>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between text-white/40 bg-white/[0.01] border border-white/5 rounded-xl px-3 py-1.5 hover:bg-white/[0.03] transition-all">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail size={12} className="text-[#00ff88] flex-shrink-0" />
                          <span className="text-xs xl:text-[10px] font-black uppercase tracking-[1px] text-white/60 select-all truncate">{member.username}</span>
                        </div>
                        <a 
                          href={`mailto:${member.username}`}
                          className="w-6 h-6 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-[#00ff88] hover:border-[#00ff88]/30 transition-all flex items-center justify-center flex-shrink-0 active-scale"
                          title="Send Email"
                        >
                          <Mail size={10} />
                        </a>
                      </div>
                      <div className="flex items-center justify-between text-white/40 bg-white/[0.01] border border-white/5 rounded-xl px-3 py-1.5 hover:bg-white/[0.03] transition-all">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone size={12} className="text-[#00ff88] flex-shrink-0" />
                          <span className="text-xs xl:text-[10px] font-black uppercase tracking-[1px] text-white/60 select-all truncate">{member.phone_number || 'No contact'}</span>
                        </div>
                        {member.phone_number && (
                          <a 
                            href={`tel:${member.phone_number}`}
                            className="w-6 h-6 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-[#00ff88] hover:border-[#00ff88]/30 transition-all flex items-center justify-center flex-shrink-0 active-scale"
                            title="Call Staff"
                          >
                            <Phone size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 border-t border-white/5 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">Assignments</h4>
                      <span className="text-[10px] font-black text-[#00ff88] uppercase tracking-[1px]">{assigned.length} Athletes</span>
                    </div>
                    
                    <div className="space-y-2.5">
                      {assigned.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-4 px-3 border border-dashed border-white/10 rounded-2xl bg-black/20 text-center">
                          <Users size={14} className="text-gray-600 mb-1" />
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-[2px]">No Active Assignments</p>
                        </div>
                      ) : (
                        assigned.map((athlete) => (
                          <div key={athlete.id} className="flex items-center justify-between bg-white/5 border border-white/10 p-2.5 rounded-xl hover:bg-[#00ff88]/5 hover:border-[#00ff88]/20 group/item transition-all">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar 
                                src={athlete.avatar_url}
                                name={`${athlete.first_name} ${athlete.last_name}`}
                                role={athlete.role}
                                size="sm"
                                className="!w-7 !h-7 text-[10px]"
                              />
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider group-hover/item:text-[#00ff88] transition-colors truncate">{athlete.first_name} {athlete.last_name}</span>
                            </div>
                            <button className="text-gray-500 group-hover/item:text-[#00ff88] transition-colors flex-shrink-0">
                              <ChevronRight size={12} />
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
