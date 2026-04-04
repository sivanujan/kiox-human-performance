"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Filter, 
  ChevronDown, 
  Loader2,
  Trophy,
  Activity,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  Zap,
  Target,
  User,
  ExternalLink
} from "lucide-react";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

const ROLES = ['athlete', 'staff', 'superadmin'];
const STATUSES = ['pending', 'approved', 'rejected', 'active'];

export default function UserInventory() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [assessmentDate, setAssessmentDate] = useState("");
  const [assessmentType, setAssessmentType] = useState("Initial Evaluation");
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && profile?.role === 'superadmin') {
      fetchProfiles();
    }
  }, [user, profile, authLoading]);

  const fetchProfiles = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (!data.error) setProfiles(data);
    
    // Also fetch programs for the assignment modal
    const progRes = await fetch("/api/admin/programs");
    const progData = await progRes.json();
    if (!progData.error) setPrograms(progData);
    
    setLoading(false);
  };

  const handleAssignProgram = async () => {
    if (!selectedAthlete || !selectedProgramId) return;
    setActionLoading(true);
    const res = await fetch("/api/admin/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedAthlete.id,
        programId: selectedProgramId
      })
    });
    
    if (res.ok) {
      setIsActionModalOpen(false);
      setSelectedProgramId("");
    } else {
      const data = await res.json();
      alert(data.error || "Assignment Failed");
    }
    setActionLoading(false);
  };

  const handleBookAssessment = async () => {
    if (!selectedAthlete || !assessmentDate) return;
    setActionLoading(true);
    const res = await fetch("/api/admin/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedAthlete.id,
        assessmentDate,
        assessmentType,
        staffId: user?.id
      })
    });
    
    if (res.ok) {
      setIsActionModalOpen(false);
      setAssessmentDate("");
    } else {
      const data = await res.json();
      alert(data.error || "Booking Failed");
    }
    setActionLoading(false);
  };

  const handleUpdate = async (userId: string, updates: any) => {
    setUpdatingId(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...updates })
    });
    
    if (res.ok) {
      fetchProfiles();
    }
    setUpdatingId(null);
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = (p.first_name + " " + p.last_name + " " + p.username).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
     return (
       <div className="flex items-center justify-center p-20">
         <Loader2 className="text-[#22c55e] animate-spin" size={48} />
       </div>
     );
  }

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-8 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-[#22c55e]" size={16} />
            <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px]">Global Registry Management</span>
          </div>
          <h1 className={`${anton.className} text-5xl text-white uppercase tracking-wider`}>User Inventory</h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Database..."
              className="w-full md:w-64 bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm text-white focus:border-[#22c55e] outline-none transition-all font-sans font-bold uppercase tracking-widest placeholder:text-white/10"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-[#22c55e] outline-none font-sans font-bold uppercase tracking-widest"
          >
            <option value="all">Every Role</option>
            <option value="athlete">Athletes</option>
            <option value="staff">Staff</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
      </div>

      {/* Table Management View */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden overflow-x-auto relative shadow-2xl">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#22c55e]/[0.03] border-b border-[#22c55e]/10">
              <th className={`px-8 py-5 ${anton.className} text-[#444] text-[10px] tracking-[0.25em] uppercase`}>ATHLETE IDENTITY</th>
              <th className={`px-6 py-5 ${anton.className} text-[#444] text-[10px] tracking-[0.25em] uppercase`}>ENTERPRISE ROLE</th>
              <th className={`px-6 py-5 ${anton.className} text-[#444] text-[10px] tracking-[0.25em] uppercase`}>SYSTEM STATUS</th>
              <th className={`px-8 py-5 ${anton.className} text-[#444] text-[10px] tracking-[0.25em] uppercase text-right`}>ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#22c55e]/5">
            <AnimatePresence>
              {filteredProfiles.map((user_profile, i) => (
                <motion.tr 
                  key={user_profile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="transition-colors hover:bg-white/[0.01] group"
                >
                  {/* Athlete Identity */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center relative`}>
                         {user_profile.role === 'superadmin' ? <ShieldCheck size={18} className="text-[#22c55e]" /> : 
                          user_profile.role === 'staff' ? <Trophy size={18} className="text-[#22c55e]" /> : <User size={18} className="text-white/20" />}
                         
                         {updatingId === user_profile.id && (
                           <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                             <Loader2 size={12} className="animate-spin text-[#22c55e]" />
                           </div>
                         )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-wide group-hover:text-[#22c55e] transition-colors">{user_profile.first_name} {user_profile.last_name}</p>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[2px]">@{user_profile.username || 'not_set'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Enterprise Role toggles */}
                  <td className="px-6 py-5">
                    <div className="flex gap-1.5">
                      {ROLES.map(role => (
                        <button 
                          key={role}
                          onClick={() => handleUpdate(user_profile.id, { role })}
                          className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg border transition-all ${user_profile.role === role ? 'bg-[#22c55e] text-black border-[#22c55e]' : 'bg-black/20 text-white/40 border-white/5 hover:border-[#22c55e]/30'}`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* System Status toggles */}
                  <td className="px-6 py-5">
                    <div className="flex gap-1.5 overflow-x-auto">
                      {STATUSES.map(status => (
                        <button 
                          key={status}
                          onClick={() => handleUpdate(user_profile.id, { status })}
                          className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg border transition-all ${user_profile.status === status ? 'bg-[#22c55e] text-black border-[#22c55e]' : 'bg-black/20 text-white/40 border-white/5 hover:border-[#22c55e]/30'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Actions column */}
                  <td className="px-8 py-5 text-right">
                    {user_profile.role === 'athlete' ? (
                      <button 
                        onClick={() => {
                          setSelectedAthlete(user_profile);
                          setIsActionModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#22c55e]/5 border border-[#22c55e]/30 rounded-xl text-[#22c55e] text-[9px] font-black uppercase tracking-[2px] hover:bg-[#22c55e] hover:text-black transition-all"
                      >
                        <Layers size={14} /> Manage Protocol
                      </button>
                    ) : (
                      <span className="text-[8px] font-black text-white/10 uppercase tracking-[2px]">No Protocols For {user_profile.role}</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {isActionModalOpen && selectedAthlete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:pb-24 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActionModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Zap size={120} />
              </div>
              
              <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-8 text-left">
                  <div>
                    <h3 className="text-[10px] font-black text-[#22c55e] uppercase tracking-[3px] mb-2">Protocol Configuration</h3>
                    <p className="text-xl font-bold text-white uppercase">{selectedAthlete.first_name} {selectedAthlete.last_name}</p>
                  </div>
                  <button onClick={() => setIsActionModalOpen(false)} className="text-white/20 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-widest bg-white/5 px-3 py-1 rounded-full">Close</button>
                </div>

                <div className="space-y-10 text-left">
                  {/* Assign Program */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white/40">
                      <Layers size={14} className="text-[#22c55e]" />
                      <span className="text-[9px] font-black uppercase tracking-[2px]">Active Training Protocol</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                      <select 
                        value={selectedProgramId}
                        onChange={e => setSelectedProgramId(e.target.value)}
                        className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none uppercase font-bold"
                      >
                        <option value="">Select Architecture...</option>
                        {programs.map(p => (
                          <option key={p.id} value={p.id}>{p.title} ({p.duration})</option>
                        ))}
                      </select>
                      <button 
                        disabled={actionLoading || !selectedProgramId}
                        onClick={handleAssignProgram}
                        className="bg-[#22c55e] text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] hover:bg-[#4ade80] transition-all disabled:opacity-30"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={14} /> : "Initialize"}
                      </button>
                    </div>
                  </div>

                  {/* Book Assessment */}
                  <div className="space-y-4 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-2 text-white/40">
                      <Target size={14} className="text-[#22c55e]" />
                      <span className="text-[9px] font-black uppercase tracking-[2px]">Performance Evaluation</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select 
                        value={assessmentType}
                        onChange={e => setAssessmentType(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none uppercase font-bold"
                      >
                        <option value="Initial Evaluation">Initial Evaluation</option>
                        <option value="Monthly Progress">Monthly Progress</option>
                        <option value="Advanced Biometrics">Advanced Biometrics</option>
                        <option value="Capacities Test">Capacities Test</option>
                      </select>
                      <input 
                        type="datetime-local"
                        value={assessmentDate}
                        onChange={e => setAssessmentDate(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none font-bold"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <button 
                      disabled={actionLoading || !assessmentDate}
                      onClick={handleBookAssessment}
                      className="w-full bg-white text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-[2px] hover:bg-[#22c55e] transition-all disabled:opacity-30 text-center"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={14} /> : "Schedule Evaluation Protocol"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
