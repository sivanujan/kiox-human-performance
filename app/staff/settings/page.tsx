"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck,
  Lock,
  ArrowLeft,
  Loader2,
  Trophy
} from "lucide-react";
import { Anton, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";

const anton = Anton({ weight: '400', subsets: ['latin'] });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export default function StaffSettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile?.role !== 'staff' && profile?.role !== 'superadmin')) {
        router.push("/signin");
      } else {
        setLoading(false);
      }
    }
  }, [user, profile, authLoading, router]);

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

      <div className="container mx-auto max-w-4xl relative z-10">
        <Link 
          href="/staff" 
          className="inline-flex items-center gap-2 text-white/40 hover:text-[#22c55e] transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[2px]">Back to Roster</span>
        </Link>

        <div className="mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="text-[#22c55e]" size={16} />
            <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px]">Staff Authority</span>
          </div>
          <h1 className={`${plusJakarta.className} text-5xl md:text-6xl font-bold uppercase tracking-wider`}>Security Settings</h1>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-[3px] mt-4">Manage your administrative credentials and portal access</p>
        </div>

        <div className="space-y-8">
          {/* Account Security */}
          <section className="bg-[#111] border border-white/5 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                <ShieldCheck className="text-[#22c55e]" size={18} />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-[3px]">Digital Identity</h3>
            </div>
            
            <div className="space-y-6">
                <div className="flex items-center justify-between p-8 bg-black/40 border border-white/5 rounded-2xl group hover:border-[#22c55e]/30 transition-all">
                  <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#22c55e] transition-colors">
                        <Lock size={24} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-[2px] mb-1">Access Protocol</p>
                        <p className="text-sm font-bold text-white uppercase tracking-widest leading-none mt-1">••••••••••••••••</p>
                        <p className="text-[10px] text-white/20 uppercase font-bold tracking-[1px] mt-3">Last updated: Secured</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setPasswordModalOpen(true)}
                    className="px-8 py-4 bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-xl text-[#22c55e] text-[10px] font-black uppercase tracking-[2px] hover:bg-[#22c55e] hover:text-black transition-all"
                  >
                    Change Code →
                  </button>
                </div>

                <div className="p-8 bg-[#22c55e]/5 border border-[#22c55e]/10 rounded-2xl">
                   <p className="text-[10px] text-white/40 uppercase font-black tracking-[1px] leading-relaxed">
                     Staff members are responsible for maintaining the confidentiality of their access credentials. All portal activity is logged under your unique digital signature for quality and security assurance.
                   </p>
                </div>
            </div>
          </section>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={passwordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
      />
    </main>
  );
}
