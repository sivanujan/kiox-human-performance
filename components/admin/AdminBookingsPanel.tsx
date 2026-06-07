"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  XSquare, 
  AlertCircle,
  Loader2,
  Calendar,
  ChevronRight,
  User,
  Activity,
  ArrowRight,
  Globe
} from "lucide-react";
import { format } from "date-fns";
import Avatar from "@/components/ui/Avatar";


export default function AdminBookingsPanel() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings');
      const data = await res.json();
      if (!data.error) setBookings(data);
    } catch (err) {
      console.error("Failed to fetch admin bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED') => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status })
      });
      const data = await res.json();
      if (!data.error) {
        fetchBookings(); // Refresh list
      }
    } catch (err) {
      console.error("Failed to update booking:", err);
    }
  };

  const filteredBookings = filter === 'PENDING' 
    ? bookings.filter(b => b.status === 'PENDING')
    : bookings.slice(0, 50);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-black/20 border border-white/5 rounded-3xl">
        <Loader2 className="text-[#22c55e] animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="w-full bg-[#111] border border-white/5 rounded-[24px] md:rounded-[32px] p-5 md:p-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 font-display text-8xl pointer-events-none uppercase">OPS</div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
        <div>
          <h3 className="text-white font-display text-xl tracking-wider uppercase flex items-center gap-3">
            <Users size={20} className="text-[#22c55e]" /> SESSION REQUESTS
          </h3>
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-[3px] mt-1">Manage upcoming athlete sessions</p>
        </div>

        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
           <button 
             onClick={() => setFilter('PENDING')}
             className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
               filter === 'PENDING' ? 'bg-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'text-white/40 hover:text-white'
             }`}
           >
             PENDING ({bookings.filter(b => b.status === 'PENDING').length})
           </button>
           <button 
             onClick={() => setFilter('ALL')}
             className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
               filter === 'ALL' ? 'bg-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'text-white/40 hover:text-white'
             }`}
           >
             ALL LOGS
           </button>
        </div>
      </div>

      {/* Booking List */}
      <div className="space-y-4 relative z-10">
        {filteredBookings.length === 0 ? (
          <div className="space-y-4">
            <div className="p-2.5 px-4 bg-[#1a1a1a] border border-white/5 rounded-xl text-[#00ff88] text-[10px] font-mono tracking-wider flex items-center gap-2">
               <AlertCircle size={12} className="text-[#00ff88] flex-shrink-0" />
               <span>Standby Mode: Showing simulated booking requests. Click "AUTHORIZE" to accept.</span>
            </div>
            
            {[
              {
                id: "mock-b1",
                status: "PENDING",
                athlete: {
                  first_name: "MARCUS",
                  last_name: "RUSH",
                  avatar_url: "",
                  country_code: "US",
                  weekly_load: 540,
                  timezone: "America/New_York"
                },
                session: {
                  scheduled_date: new Date().toISOString(),
                  start_time: "10:30:00",
                  title: "LIVE RECOVERY MOBILITY MATRIX"
                },
                session_time_athlete_local: "10:30 AM EST"
              },
              {
                id: "mock-b2",
                status: "PENDING",
                athlete: {
                  first_name: "SARAH",
                  last_name: "VALENTINE",
                  avatar_url: "",
                  country_code: "GB",
                  weekly_load: 680,
                  timezone: "Europe/London"
                },
                session: {
                  scheduled_date: new Date().toISOString(),
                  start_time: "15:00:00",
                  title: "NEUROMUSCULAR STRENGTH SESSION"
                },
                session_time_athlete_local: "3:00 PM GMT"
              }
            ].map((b) => (
              <div 
                key={b.id} 
                className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:border-[#22c55e]/20 transition-all group/item"
              >
                {/* Left Column (span 4): Avatar + Name + Location + load stats */}
                <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                  <Avatar src={b.athlete.avatar_url} name={`${b.athlete.first_name} ${b.athlete.last_name}`} size="md" role="athlete" />
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-sm tracking-wide uppercase flex items-center gap-2 truncate">
                       {b.athlete.first_name} {b.athlete.last_name}
                       {b.athlete.country_code && (
                         <span className="text-[9px] bg-white/5 border border-white/10 px-1 rounded text-gray-400 font-mono">
                           {b.athlete.country_code}
                         </span>
                       )}
                    </h4>
                    <div className="flex flex-col gap-0.5 mt-1">
                       <span className="text-gray-500 text-[9px] font-black uppercase tracking-[1px] flex items-center gap-1.5 truncate">
                          <Globe size={10} /> {b.athlete.timezone?.split('/')[1]?.replace('_', ' ') || 'UTC'}
                       </span>
                       <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${
                            b.athlete.weekly_load > 600 ? 'text-amber-500' : 'text-[#00ff88]'
                          }`}>
                             <Activity size={10} /> {b.athlete.weekly_load || 0} AU
                          </span>
                          <span className="text-[8px] text-gray-500 font-mono tracking-wider">LOAD</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Center Column (span 4): Date + Session Info */}
                <div className="md:col-span-4 flex flex-col gap-0.5 min-w-0 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                  <div className="text-gray-500 text-[9px] font-black tracking-widest uppercase mb-1 flex items-center gap-1.5">
                     <Calendar size={10} className="text-[#00ff88]" /> 
                     <span>{b.session?.scheduled_date ? format(new Date(b.session.scheduled_date), 'MMM d, yyyy') : 'TBD'} // {b.session?.start_time?.slice(0, 5) || 'TBD'}</span>
                  </div>
                  <div className="text-white/80 font-display text-sm uppercase tracking-wider group-hover/item:text-[#22c55e] transition-colors truncate" title={b.session.title}>
                     {b.session.title}
                  </div>
                  {b.session_time_athlete_local && (
                    <div className="mt-1 text-[9px] font-bold text-[#00ff88]/60 uppercase tracking-widest flex items-center gap-1.5">
                       <Clock size={10} /> Local: {b.session_time_athlete_local}
                    </div>
                  )}
                </div>

                {/* Right Column (span 4): Reject + Authorize actions */}
                <div className="md:col-span-4 flex items-center justify-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                   <div className="flex items-center gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => alert("Simulated: Booking Rejected")}
                        className="h-10 w-10 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex-shrink-0"
                        title="Reject Booking"
                      >
                         <XSquare size={16} />
                      </button>
                      <button 
                        onClick={() => alert("Simulated: Booking Authorized")}
                        className="h-10 px-4 bg-[#00ff88] text-black font-mono text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-[0_4px_12px_rgba(0,255,136,0.2)] flex items-center gap-1.5 flex-1 md:flex-none justify-center"
                      >
                         <CheckCircle2 size={12} />
                         <span>AUTHORIZE</span>
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          filteredBookings.map((b) => (
            <div 
              key={b.id} 
              className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:border-[#22c55e]/20 transition-all group/item"
            >
              {/* Left Column (span 4): Avatar + Name + Location + load stats */}
              <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                <Avatar src={b.athlete.avatar_url} name={`${b.athlete.first_name} ${b.athlete.last_name}`} size="md" role="athlete" />
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-sm tracking-wide uppercase flex items-center gap-2 truncate">
                     {b.athlete.first_name} {b.athlete.last_name}
                     {b.athlete.country_code && (
                       <span className="text-[9px] bg-white/5 border border-white/10 px-1 rounded text-gray-400 font-mono">
                         {b.athlete.country_code}
                       </span>
                     )}
                  </h4>
                  <div className="flex flex-col gap-0.5 mt-1">
                     <span className="text-gray-500 text-[9px] font-black uppercase tracking-[1px] flex items-center gap-1.5 truncate">
                        <Globe size={10} /> {b.athlete.timezone?.split('/')[1]?.replace('_', ' ') || 'UTC'}
                     </span>
                     <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${
                          b.athlete.weekly_load > 600 ? 'text-amber-500' : 'text-[#00ff88]'
                        }`}>
                           <Activity size={10} /> {b.athlete.weekly_load || 0} AU
                        </span>
                        <span className="text-[8px] text-gray-500 font-mono tracking-wider">LOAD</span>
                     </div>
                  </div>
                </div>
              </div>

              {/* Center Column (span 4): Date + Session Info */}
              <div className="md:col-span-4 flex flex-col gap-0.5 min-w-0 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                <div className="text-gray-500 text-[9px] font-black tracking-widest uppercase mb-1 flex items-center gap-1.5">
                   <Calendar size={10} className="text-[#00ff88]" /> 
                   <span>{b.session?.scheduled_date ? format(new Date(b.session.scheduled_date), 'MMM d, yyyy') : 'TBD'} // {b.session?.start_time?.slice(0, 5) || 'TBD'}</span>
                </div>
                <div className="text-white/80 font-display text-sm uppercase tracking-wider group-hover/item:text-[#22c55e] transition-colors truncate" title={b.session.title}>
                   {b.session.title}
                </div>
                {b.session_time_athlete_local && (
                  <div className="mt-1 text-[9px] font-bold text-[#00ff88]/60 uppercase tracking-widest flex items-center gap-1.5">
                     <Clock size={10} /> Local: {b.session_time_athlete_local}
                  </div>
                )}
              </div>

              {/* Right Column (span 4): Actions */}
              <div className="md:col-span-4 flex items-center justify-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                 {b.status === 'PENDING' ? (
                   <div className="flex items-center gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => handleAction(b.id, 'CANCELLED')}
                        className="h-10 w-10 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex-shrink-0"
                        title="Reject Booking"
                      >
                         <XSquare size={16} />
                      </button>
                      <button 
                        onClick={() => handleAction(b.id, 'CONFIRMED')}
                        className="h-10 px-4 bg-[#00ff88] text-black font-mono text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-[0_4px_12px_rgba(0,255,136,0.2)] flex items-center gap-1.5 flex-1 md:flex-none justify-center"
                      >
                         <CheckCircle2 size={12} />
                         <span>AUTHORIZE</span>
                      </button>
                   </div>
                 ) : (
                   <div className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                     b.status === 'CONFIRMED' ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30' : 
                     b.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border border-red-500/30' :
                     'bg-purple-500/10 text-purple-500 border border-purple-500/30'
                   }`}>
                      {b.status === 'CONFIRMED' ? <CheckCircle2 size={12} /> : b.status === 'CANCELLED' ? <XSquare size={12} /> : <Users size={12} />}
                      {b.status}
                   </div>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      {filter === 'ALL' && bookings.length > 50 && (
        <div className="mt-6 pt-6 border-t border-white/5 flex justify-center">
           <button className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] flex items-center gap-2 hover:text-[#22c55e] transition-all">
              VIEW HISTORICAL ARCHIVE <ArrowRight size={12} />
           </button>
        </div>
      )}
    </div>
  );
}
