"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Search, 
  Filter, 
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Activity,
  ChevronRight
} from "lucide-react";
import { Anton } from "next/font/google";
import { useAuth } from "@/components/providers/AuthProvider";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

export default function AdminSchedules() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && user && profile?.role === 'superadmin') {
      fetchSchedules();
    }
  }, [user, profile, authLoading]);

  const fetchSchedules = async () => {
    if (!supabase) return;
    setLoading(true);
    
    try {
      // Fetch all assessments with user and staff info
      const { data, error } = await supabase
        .from("assessments")
        .select(`
          *,
          user:profiles!assessments_user_id_fkey(first_name, last_name, username),
          staff:profiles!assessments_staff_id_fkey(first_name, last_name)
        `)
        .order('assessment_date', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error("Schedule Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = assessments.filter(s => {
    const userName = `${s.user?.first_name} ${s.user?.last_name} ${s.user?.username}`.toLowerCase();
    const type = (s.assessment_type || "").toLowerCase();
    const matchesSearch = userName.includes(searchQuery.toLowerCase()) || type.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
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
            <CalendarIcon className="text-[#22c55e]" size={16} />
            <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px]">Operational Timeline</span>
          </div>
          <h1 className={`${anton.className} text-5xl text-white uppercase tracking-wider`}>Global Schedules</h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Schedule..."
              className="w-full md:w-64 bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm text-white focus:border-[#22c55e] outline-none transition-all font-sans font-bold uppercase tracking-widest placeholder:text-white/10"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-[#22c55e] outline-none font-sans font-bold uppercase tracking-widest"
          >
            <option value="all">Every Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Timeline Registry */}
      <div className="space-y-4">
        {filteredSchedules.length === 0 ? (
          <div className="bg-[#111] border border-white/5 py-20 rounded-3xl text-center">
            <div className="text-4xl mb-4">📅</div>
            <p className={`${anton.className} text-white/20 text-lg uppercase tracking-[3px]`}>No matching milestones found</p>
          </div>
        ) : (
          filteredSchedules.map((milestone, i) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#111] border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#22c55e]/30 transition-all group relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#22c55e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Left Side: Date & Identity */}
              <div className="flex items-start gap-6 flex-1">
                <div className="flex flex-col items-center justify-center w-[70px] h-[70px] rounded-2xl bg-black/40 border border-white/5 shrink-0">
                  <span className={`${anton.className} text-[#22c55e] text-2xl leading-none`}>
                    {new Date(milestone.assessment_date).getDate()}
                  </span>
                  <span className="text-[10px] font-black text-white/40 uppercase">
                    {new Date(milestone.assessment_date).toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      milestone.status === 'completed' ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' :
                      milestone.status === 'processing' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    }`}>
                      {milestone.status}
                    </div>
                    <span className="text-[10px] text-white/20 uppercase font-bold">
                       {new Date(milestone.assessment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white uppercase tracking-wider">{milestone.assessment_type}</h4>
                  <div className="flex items-center gap-2 text-xs text-white/40 font-bold uppercase tracking-widest">
                    <User size={12} className="text-[#22c55e]" /> 
                    {milestone.user?.first_name} {milestone.user?.last_name}
                  </div>
                </div>
              </div>

              {/* Center: Oversight */}
              <div className="flex-1 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-[2px] mb-2">Assignee/Staff Oversight</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center">
                    <Activity size={14} className="text-[#22c55e]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-widest">{milestone.staff?.first_name} {milestone.staff?.last_name || 'Unassigned'}</p>
                    <p className="text-[10px] text-[#555] font-black uppercase">Technical Supervisor</p>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                 <button className="h-[44px] px-6 border border-white/10 rounded-xl text-[10px] font-black text-white/40 uppercase tracking-[2px] transition-all hover:bg-white hover:text-black hover:border-white">
                    View Data Profile
                 </button>
                 <button className="h-[44px] w-[44px] border border-white/10 rounded-xl flex items-center justify-center text-white/20 transition-all hover:text-[#22c55e] hover:border-[#22c55e]/30">
                    <ChevronRight size={20} />
                 </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
