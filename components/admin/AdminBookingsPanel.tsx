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
  ArrowRight
} from "lucide-react";
import { Anton } from "next/font/google";
import { format } from "date-fns";
import Avatar from "@/components/ui/Avatar";

const anton = Anton({ weight: '400', subsets: ['latin'] });

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
    <div className="bg-[#111] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 font-['Anton'] text-8xl pointer-events-none uppercase">OPS</div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
        <div>
          <h3 className="text-white font-['Anton'] text-xl tracking-wider uppercase flex items-center gap-3">
            <Users size={20} className="text-[#22c55e]" /> DEPLOYMENT LOGS
          </h3>
          <p className="text-white/30 text-[9px] font-black uppercase tracking-[3px] mt-1">Real-time athlete presence oversight</p>
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
          <div className="py-12 text-center text-white/10 uppercase font-black text-[10px] tracking-widest italic border border-dashed border-white/10 rounded-2xl">
             No active requests requiring authorization
          </div>
        ) : (
          filteredBookings.map((b) => (
            <div key={b.id} className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-[#22c55e]/20 transition-all group/item">
               {/* Athlete Info */}
               <div className="flex items-center gap-4">
                  <Avatar src={b.athlete.avatar_url} name={`${b.athlete.first_name} ${b.athlete.last_name}`} size="md" role="athlete" />
                  <div>
                    <h4 className="text-white font-bold text-sm tracking-wide uppercase">{b.athlete.first_name} {b.athlete.last_name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                       <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                         b.athlete.weekly_load > 600 ? 'text-amber-500' : 'text-[#22c55e]'
                       }`}>
                          <Activity size={10} /> {b.athlete.weekly_load || 0} AU
                       </span>
                       <span className="text-white/20 text-[8px] font-black uppercase tracking-[2px]">ID: {b.id.slice(0,8).toUpperCase()}</span>
                    </div>
                  </div>
               </div>

               {/* Session Context */}
               <div className="flex-1 md:px-6 border-l md:border-l-white/5">
                  <div className="text-white/20 text-[8px] font-black tracking-widest uppercase mb-1 flex items-center gap-2">
                     <Calendar size={10} /> {format(new Date(b.session.scheduled_date), 'MMM d')} // {b.session.scheduled_time.slice(0, 5)}
                  </div>
                  <div className="text-white/80 font-['Anton'] text-sm uppercase tracking-wider group-hover/item:text-[#22c55e] transition-colors line-clamp-1">
                     {b.session.title}
                  </div>
               </div>

               {/* Stats & Actions */}
               <div className="flex items-center gap-4 w-full md:w-auto">
                  {b.status === 'PENDING' ? (
                    <div className="flex items-center gap-2 grow">
                       <button 
                         onClick={() => handleAction(b.id, 'CANCELLED')}
                         className="flex-1 md:flex-none p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                         title="Reject Booking"
                       >
                          <XSquare size={18} />
                       </button>
                       <button 
                         onClick={() => handleAction(b.id, 'CONFIRMED')}
                         className="flex-1 md:flex-none px-6 py-3 bg-[#22c55e] text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-[0_5px_15px_rgba(34,197,94,0.3)] flex items-center gap-2"
                       >
                          <CheckCircle2 size={14} /> AUTHORIZE
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
           <button className="text-[9px] font-black text-white/20 uppercase tracking-[3px] flex items-center gap-2 hover:text-[#22c55e] transition-all">
              VIEW HISTORICAL ARCHIVE <ArrowRight size={12} />
           </button>
        </div>
      )}
    </div>
  );
}
