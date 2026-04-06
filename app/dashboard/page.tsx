"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  Target, 
  Ruler, 
  Weight, 
  Shield, 
  Calendar, 
  Zap, 
  Phone, 
  MapPin, 
  Mail,
  Trophy,
  Loader2,
  Clock,
  Star,
  Users,
  Clipboard
} from "lucide-react";
import { Anton, Orbitron } from "next/font/google";
import Link from "next/link";

const anton = Anton({ 
  weight: '400', 
  subsets: ['latin'] 
});

const orbitron = Orbitron({ subsets: ["latin"] });

export default function DashboardOverview() {
  const { user, profile, loading: authLoading } = useAuth();
  const [enrolledPrograms, setEnrolledPrograms] = useState<any[]>([]);
  const [upcomingAssessments, setUpcomingAssessments] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfileData();
    }
  }, [user, authLoading]);

  const fetchProfileData = async () => {
    if (!user) return;
    const [progRes, assessRes] = await Promise.all([
      fetch(`/api/admin/enrollments?userId=${user.id}`),
      fetch(`/api/admin/assessments?userId=${user.id}`)
    ]);
    
    const [progData, assessData] = await Promise.all([progRes.json(), assessRes.json()]);
    if (!progData.error) setEnrolledPrograms(progData);
    if (!assessData.error) setUpcomingAssessments(assessData);
  };

  const userName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Athlete';

  return (
    <div className="p-10">
      {/* STATUS BANNER */}
      {profile?.status === 'pending' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 mb-8 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock className="text-amber-500" size={24} />
          </div>
          <div>
            <div className={`${orbitron.className} text-amber-500 text-[10px] tracking-[4px] uppercase`}>
              Profile Under Review
            </div>
            <p className="text-white/40 text-[9px] mt-1 uppercase tracking-wider">
              Our coaching team is reviewing your profile. You will receive an update within 24-48 hours.
            </p>
          </div>
        </motion.div>
      )}

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { icon: <Calendar size={20} />, label: 'SESSIONS', value: '0', sub: 'Completed', color: '#00ff41' },
          { icon: <Clipboard size={20} />, label: 'PROGRAM', value: enrolledPrograms.length > 0 ? '1' : '0', sub: 'Assigned', color: '#00ff41' },
          { icon: <Activity size={20} />, label: 'PROGRESS', value: '0%', sub: 'This month', color: '#00ff41' },
          { icon: <Star size={20} />, label: 'RATING', value: 'N/A', sub: 'Performance', color: '#00ff41' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#111] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-[#00ff41]/20 transition-all"
          >
            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
              {stat.icon}
            </div>
            <div className="text-[9px] font-black text-white/30 tracking-[3px] uppercase mb-1">
              {stat.label}
            </div>
            <div className={`${orbitron.className} text-4xl text-[#00ff41] mb-1 drop-shadow-[0_0_15px_rgba(0,255,65,0.3)]`}>
              {stat.value}
            </div>
            <div className="text-[10px] text-white/20 uppercase tracking-widest">
              {stat.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* PERFORMANCE TIMELINE PREVIEW */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <div className="flex justify-between items-end mb-6">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00ff41]/10 border border-[#00ff41]/20 flex items-center justify-center text-[#00ff41]">
                <Calendar size={18} />
              </div>
              <div>
                 <h2 className={`${orbitron.className} text-xl text-white tracking-widest uppercase`}>Performance Timeline</h2>
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-[2px]">Mission Milestones & Evaluation Progress</p>
              </div>
           </div>
           <Link href="/dashboard/schedule" className="text-[9px] font-black text-[#00ff41] uppercase tracking-[2px] transition-all hover:tracking-[3px] flex items-center gap-2">
             Access Timeline Matrix <Target size={12} />
           </Link>
        </div>

        <div className="bg-[#111] border border-white/5 p-8 rounded-3xl relative overflow-hidden">
          {upcomingAssessments.length === 0 ? (
            <div className="py-8 text-center">
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px]">No upcoming evaluations detected in registry</p>
            </div>
          ) : (
            <div className="relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-white/5">
               {upcomingAssessments.slice(0, 2).map((a, i) => (
                 <div key={i} className="relative pl-10 mb-8 last:mb-0">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#111] border border-[#00ff41]/30 flex items-center justify-center z-10">
                       <div className="w-2 h-2 rounded-full bg-[#00ff41] shadow-[0_0_10px_#00ff41]" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl hover:border-[#00ff41]/20 transition-all group">
                       <div>
                          <div className="text-[8px] font-black text-[#00ff41]/60 uppercase tracking-[2px] mb-1">{a.assessment_type}</div>
                          <div className={`${orbitron.className} text-lg text-white uppercase tracking-wider`}>
                            {new Date(a.assessment_date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-4 mt-1.5">
                             <div className="flex items-center gap-1.5 text-[9px] font-black text-white/30 uppercase cursor-default">
                                <Clock size={12} className="text-[#00ff41]/40" /> {new Date(a.assessment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <div className="flex items-center gap-1.5 text-[9px] font-black text-white/30 uppercase cursor-default">
                                <Shield size={12} className="text-[#00ff41]/40" /> Elite Oversight
                             </div>
                          </div>
                       </div>
                       <div className="px-5 py-2 bg-[#00ff41]/10 border border-[#00ff41]/20 rounded-full group-hover:bg-[#00ff41]/20 transition-all text-center">
                          <span className={`${orbitron.className} text-[9px] text-[#00ff41] uppercase tracking-widest`}>{a.status}</span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* PROFILE CARD */}
        <div className="bg-[#111] border border-white/5 p-8 rounded-3xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2 text-[#00ff41]">
              <Shield size={16} />
              <span className="text-[10px] font-black uppercase tracking-[3px]">Identity Registry</span>
            </div>
            <Link href="/dashboard/profile" className="text-[#00ff41] text-[9px] font-black uppercase tracking-[2px] transition-all hover:tracking-[3px]">
              Edit Profile →
            </Link>
          </div>

          <div className="space-y-4">
            {[
              { label: 'FULL NAME', value: userName },
              { label: 'HANDLE', value: `@${profile?.username || 'not_set'}` },
              { label: 'BIRTH DATE', value: profile?.date_of_birth },
              { label: 'POSITION', value: profile?.position_played },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 grow">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[2px]">{row.label}</span>
                <span className="text-sm font-bold text-white uppercase tracking-wider">{row.value || '---'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PERFORMANCE VITALS */}
        <div className="bg-[#111] border border-white/5 p-8 rounded-3xl relative overflow-hidden">
          <div className="flex items-center gap-2 text-[#00ff41] mb-8">
            <Zap size={16} />
            <span className="text-[10px] font-black uppercase tracking-[3px]">Performance Vitals</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: 'HEIGHT', value: profile?.height, unit: 'CM', icon: <Ruler size={18} /> },
              { label: 'WEIGHT', value: profile?.weight, unit: 'KG', icon: <Weight size={18} /> },
            ].map((v, i) => (
              <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-5 text-center group hover:border-[#00ff41]/30 transition-all">
                 <div className="flex justify-center text-white/20 mb-2 group-hover:text-[#00ff41] transition-colors">{v.icon}</div>
                 <div className={`${orbitron.className} text-3xl text-white`}>
                   {v.value || '--'}
                   <span className="text-xs text-[#00ff41] ml-1 opacity-70">{v.unit}</span>
                 </div>
                 <div className="text-[8px] font-black text-white/20 uppercase tracking-[2px] mt-2">{v.label}</div>
              </div>
            ))}
          </div>

          {/* Strategic Goals */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-4 group hover:border-[#00ff41]/30 transition-all">
            <div className="text-[9px] font-black text-[#00ff41] tracking-[2px] uppercase mb-3">Strategic Goals</div>
            <div className="text-xs text-white/50 leading-relaxed italic grow uppercase tracking-wider font-medium">
              "{profile?.training_goals || 'No strategic goals established.'}"
            </div>
          </div>

          {/* Medical */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 group hover:border-[#00ff41]/30 transition-all">
            <div className="text-[9px] font-black text-[#00ff41] tracking-[2px] uppercase mb-2">Medical Baseline</div>
            <div className="text-[10px] text-white/30 uppercase font-medium">
              {profile?.medical_history || 'No pre-existing conditions reported.'}
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CONTACT CARD */}
        <div className="bg-[#111] border border-white/5 p-8 rounded-3xl relative overflow-hidden">
          <div className="text-[10px] font-black text-[#00ff41] uppercase tracking-[3px] mb-8">Connectivity</div>
          <div className="space-y-6">
            {[
              { icon: <Phone size={16} />, label: 'LIAISON', value: profile?.phone_number },
              { icon: <MapPin size={16} />, label: 'BASE', value: profile?.address },
              { icon: <Mail size={16} />, label: 'ENCRYPTION', value: user?.email },
            ].map((c, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group hover:border-[#00ff41]/50 transition-all">
                  <span className="text-[#00ff41]">{c.icon}</span>
                </div>
                <div className="truncate">
                  <div className="text-[8px] font-black text-white/20 tracking-[2px] uppercase">{c.label}</div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider mt-1 truncate">{c.value || 'Not Set'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ASSIGNED PROGRAM */}
        <div className="bg-[#111] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
          <div className="text-[10px] font-black text-[#00ff41] uppercase tracking-[3px] mb-8">Active Program</div>
          {enrolledPrograms.length > 0 ? (
            <div>
              <div className={`${orbitron.className} text-2xl text-white uppercase tracking-wider mb-2`}>
                {enrolledPrograms[0].program?.title}
              </div>
              <div className="flex items-center gap-2 mb-8">
                <span className="text-[9px] font-black text-[#00ff41] uppercase">{enrolledPrograms[0].program?.duration}</span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span className="text-[9px] font-black text-white/30 uppercase">{enrolledPrograms[0].program?.level}</span>
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-[2px]">Core Evolution</span>
                  <span className="text-[10px] font-black text-[#00ff41]">35%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div className="w-[35%] h-full bg-[#00ff41] rounded-full shadow-[0_0_10px_#00ff41]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 flex flex-col items-center">
               <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4 text-white/10">
                 <Clipboard size={32} />
               </div>
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[2px] mb-6">No protocol assigned yet</p>
               <Link href="/dashboard/booking" className="inline-flex px-6 py-3 bg-[#00ff41] text-black text-[9px] font-black uppercase tracking-[2px] rounded-lg hover:bg-white transition-all shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                 Book Assessment →
               </Link>
            </div>
          )}
        </div>

        {/* EMERGENCY PROTOCOL */}
        <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-3xl relative overflow-hidden group">
          <div className="text-[10px] font-black text-red-500 uppercase tracking-[3px] mb-8 flex items-center gap-2">
            <Shield size={14} /> Emergency Protocol
          </div>
          <div className="space-y-4">
            {[
              { label: 'CONTACT LIAISON', value: profile?.emergency_contact_name },
              { label: 'LOCKED FREQUENCY', value: profile?.emergency_contact_phone },
            ].map((e, i) => (
              <div key={i} className="bg-black/30 border border-red-500/5 p-4 rounded-xl">
                <div className="text-[8px] font-black text-red-500/60 uppercase tracking-[2px] mb-1">{e.label}</div>
                <div className="text-sm font-bold text-white uppercase tracking-wider">{e.value || 'Not set'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
