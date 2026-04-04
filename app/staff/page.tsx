"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Activity, 
  Trophy, 
  Calendar, 
  ExternalLink, 
  Loader2,
  Dumbbell
} from "lucide-react";
import { Anton } from "next/font/google";
import { useAuth } from "@/components/providers/AuthProvider";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

export default function StaffPortal() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/signin");
      } else if (profile?.role !== 'staff' && profile?.role !== 'superadmin') {
        router.push("/dashboard");
      } else {
        fetchAssignedAthletes(user.id);
      }
    }
  }, [user, profile, authLoading, router]);

  const fetchAssignedAthletes = async (staffId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("assigned_staff", staffId)
      .eq("role", "athlete");
    
    if (data) setAthletes(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="text-[#22c55e] animate-spin" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] pt-[120px] pb-20 px-6 relative overflow-hidden text-white font-sans">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="text-[#22c55e]" size={16} />
            <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px]">Elite Performance Staff</span>
          </div>
          <h1 className={`${anton.className} text-5xl md:text-7xl uppercase tracking-wider`}>Athlete Roster</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {athletes.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-[#111] border border-white/5 rounded-3xl">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[3px]">No active athlete assignments detected</p>
            </div>
          ) : (
            athletes.map((athlete, i) => (
              <motion.div 
                key={athlete.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#111] border border-white/10 p-8 rounded-3xl hover:border-[#22c55e]/30 transition-all group pointer-events-auto"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Activity className="text-[#22c55e]" size={20} />
                  </div>
                  <span className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-[8px] font-black uppercase tracking-widest rounded-full">{athlete.status}</span>
                </div>

                <h3 className="text-xl font-bold uppercase tracking-widest mb-2">{athlete.first_name} {athlete.last_name}</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[1px] mb-6">Position: {athlete.position_played}</p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-white/60">
                    <Dumbbell size={14} className="text-[#22c55e]" />
                    <span className="text-[9px] font-black uppercase tracking-[1px]">Assigning: Speed Matrix α</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                    <Calendar size={14} className="text-[#22c55e]" />
                    <span className="text-[9px] font-black uppercase tracking-[1px]">Next Session: TBA</span>
                  </div>
                </div>

                <button 
                  onClick={() => router.push(`/athlete/${athlete.id}`)}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[2px] hover:bg-[#22c55e] hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  Analyze Profile <ExternalLink size={14} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
