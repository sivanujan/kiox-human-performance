"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  XSquare, 
  AlertCircle,
  Calendar,
  Activity,
  ArrowRight,
  Globe,
  Inbox
} from "lucide-react";
import { format } from "date-fns";
import Avatar from "@/components/ui/Avatar";
import { motion } from "framer-motion";
import { SkeletonRow, Skeleton } from "@/components/ui/Skeleton";

interface AdminBookingsPanelProps {
  hideTitle?: boolean;
}

export default function AdminBookingsPanel({ hideTitle = false }: AdminBookingsPanelProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [mockBookings, setMockBookings] = useState<any[]>([
    {
      id: "mock-b1",
      status: "PENDING",
      athlete: {
        first_name: "Marcus",
        last_name: "Rush",
        avatar_url: "",
        country_code: "US",
        weekly_load: 540,
        timezone: "America/New_York"
      },
      session: {
        scheduled_date: new Date().toISOString(),
        start_time: "10:30:00",
        title: "Live Recovery Mobility Matrix"
      },
      session_time_athlete_local: "10:30 AM EST"
    },
    {
      id: "mock-b2",
      status: "PENDING",
      athlete: {
        first_name: "Sarah",
        last_name: "Valentine",
        avatar_url: "",
        country_code: "GB",
        weekly_load: 680,
        timezone: "Europe/London"
      },
      session: {
        scheduled_date: new Date().toISOString(),
        start_time: "15:00:00",
        title: "Neuromuscular Strength Session"
      },
      session_time_athlete_local: "3:00 PM GMT"
    }
  ]);

  useEffect(() => {
    fetchBookings();
    const saved = localStorage.getItem("kiox_mock_bookings");
    if (saved) {
      try {
        setMockBookings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved mock bookings:", e);
      }
    }
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

  const handleAction = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED', isExternal = false) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status, isExternal })
      });
      const data = await res.json();
      if (!data.error) {
        fetchBookings(); // Refresh list
      }
    } catch (err) {
      console.error("Failed to update booking:", err);
    }
  };

  const handleMockAction = (bookingId: string, status: 'CONFIRMED' | 'CANCELLED') => {
    setMockBookings(prev => {
      const updated = prev.map(b => 
        b.id === bookingId ? { ...b, status } : b
      );
      localStorage.setItem("kiox_mock_bookings", JSON.stringify(updated));
      return updated;
    });
  };

  const filteredBookings = filter === 'PENDING' 
    ? bookings.filter(b => b.status === 'PENDING')
    : bookings.slice(0, 50);

  const displayedMockBookings = filter === 'PENDING'
    ? mockBookings.filter(b => b.status === 'PENDING')
    : mockBookings;

  const activeBookings = bookings.length > 0 ? bookings : mockBookings;
  const totalCount = activeBookings.length;
  const approvedCount = activeBookings.filter(b => b.status === 'CONFIRMED').length;
  const pendingCount = activeBookings.filter(b => b.status === 'PENDING').length;

  if (loading && bookings.length === 0) {
    return (
      <div className="w-full bg-bg-card border border-border-card rounded-[24px] md:rounded-[32px] p-5 md:p-8 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
        {/* Row skeletons */}
        {[1,2,3].map(i => <SkeletonRow key={i} />)}
      </div>
    );
  }

  return (
    <div className="w-full bg-bg-card border border-border-card rounded-[24px] md:rounded-[32px] p-5 md:p-8 relative overflow-hidden group">
      
      {/* Title Header */}
      {!hideTitle && (
        <div className="mb-6 relative z-10">
          <h3 className="text-text-primary font-display text-xl font-bold tracking-wide flex items-center gap-3">
            <Users size={20} className="text-accent-green" /> Session Requests
          </h3>
          <p className="text-text-secondary text-xs mt-1">Manage and approve incoming session requests</p>
        </div>
      )}

      {/* Quick Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 relative z-10">
        <div className="bg-bg-input border border-border-input rounded-2xl p-4 flex items-center justify-between hover:border-accent-green/10 transition-colors">
          <div>
            <span className="text-[10px] text-text-muted font-semibold tracking-wider block">Total Requests</span>
            <span className="text-xl md:text-2xl font-bold text-text-primary mt-1 block">{totalCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-bg-card border border-border-card flex items-center justify-center text-text-secondary">
            <Calendar size={16} />
          </div>
        </div>
        <div className="bg-bg-input border border-border-input rounded-2xl p-4 flex items-center justify-between hover:border-accent-green/10 transition-colors">
          <div>
            <span className="text-[10px] text-text-muted font-semibold tracking-wider block">Approved Sessions</span>
            <span className="text-xl md:text-2xl font-bold text-text-primary mt-1 block">{approvedCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center text-accent-green">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="bg-bg-input border border-border-input rounded-2xl p-4 flex items-center justify-between hover:border-accent-green/10 transition-colors">
          <div>
            <span className="text-[10px] text-text-muted font-semibold tracking-wider block">Pending Approval</span>
            <span className="text-xl md:text-2xl font-bold text-text-primary mt-1 block">{pendingCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock size={16} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-card w-full mb-6 relative z-10">
        <button 
          onClick={() => setFilter('PENDING')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            filter === 'PENDING' ? 'text-accent-green' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>Pending ({
            bookings.filter(b => b.status === 'PENDING').length > 0 
              ? bookings.filter(b => b.status === 'PENDING').length 
              : mockBookings.filter(b => b.status === 'PENDING').length
          })</span>
          {filter === 'PENDING' && (
            <motion.div 
              layoutId="activeTabUnderline" 
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-green" 
            />
          )}
        </button>
        <button 
          onClick={() => setFilter('ALL')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            filter === 'ALL' ? 'text-accent-green' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>All Logs</span>
          {filter === 'ALL' && (
            <motion.div 
              layoutId="activeTabUnderline" 
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-green" 
            />
          )}
        </button>
      </div>

      {/* Booking List */}
      <div className="space-y-4 relative z-10">
        {filteredBookings.length === 0 ? (
          <div className="space-y-4">
            {displayedMockBookings.length > 0 && filter === 'PENDING' && (
              <div className="p-2.5 px-4 bg-bg-input border border-border-input rounded-xl text-accent-green text-[10px] font-mono tracking-wider flex items-center gap-2">
                 <AlertCircle size={12} className="text-accent-green flex-shrink-0" />
                 <span>Standby Mode: Showing simulated booking requests. Click "Authorize" to accept.</span>
              </div>
            )}
            
            {displayedMockBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border-input rounded-2xl bg-bg-secondary/10">
                <div className="w-12 h-12 rounded-full bg-bg-input border border-border-input flex items-center justify-center text-text-muted mb-4">
                  <Inbox size={24} className="text-text-muted" />
                </div>
                <h3 className="text-text-primary font-bold text-base mb-1">No pending requests</h3>
                <p className="text-text-muted text-xs text-center max-w-sm mb-6">
                  There are currently no new session bookings awaiting staff authorization.
                </p>
                {filter === 'PENDING' && (
                  <button 
                    onClick={() => setFilter('ALL')}
                    className="px-4 py-2 bg-bg-input border border-border-input hover:border-accent-green/30 hover:bg-bg-card-hover text-text-secondary hover:text-accent-green text-xs font-bold rounded-xl transition-all"
                  >
                    View all logs
                  </button>
                )}
              </div>
            ) : (
              displayedMockBookings.map((b) => (
                <div 
                  key={b.id} 
                  className="bg-bg-card border border-border-card p-5 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:border-accent-green/20 transition-all group/item"
                >
                  {/* Left Column (span 4): Avatar + Name + Location + load stats */}
                  <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                    <Avatar src={b.athlete.avatar_url} name={`${b.athlete.first_name} ${b.athlete.last_name}`} size="md" role="athlete" />
                    <div className="min-w-0">
                      <h4 className="text-text-primary font-semibold text-sm tracking-normal flex items-center gap-2 truncate">
                         {b.athlete.first_name} {b.athlete.last_name}
                         {b.athlete.country_code && (
                           <span className="text-[9px] bg-bg-input border border-border-input px-1 rounded text-text-secondary font-mono">
                             {b.athlete.country_code}
                           </span>
                         )}
                      </h4>
                      <div className="flex flex-col gap-0.5 mt-1">
                         <span className="text-text-muted text-[10px] tracking-wide flex items-center gap-1.5 truncate">
                            <Globe size={10} /> {b.athlete.timezone?.split('/')[1]?.replace('_', ' ') || 'UTC'}
                         </span>
                         <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-bold tracking-wide flex items-center gap-1 ${
                              b.athlete.weekly_load > 600 ? 'text-amber-500' : 'text-accent-green'
                            }`}>
                               <Activity size={10} /> {b.athlete.weekly_load || 0} AU
                            </span>
                            <span className="text-[9px] text-text-muted font-mono">Load</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Column (span 4): Date + Session Info */}
                  <div className="md:col-span-4 flex flex-col gap-0.5 min-w-0 border-t md:border-t-0 md:border-l border-border-card pt-3 md:pt-0 md:pl-4">
                    <div className="text-text-muted text-[10px] tracking-wide mb-1 flex items-center gap-1.5">
                       <Calendar size={10} className="text-accent-green" /> 
                       <span>{b.session?.scheduled_date ? format(new Date(b.session.scheduled_date), 'MMM d, yyyy') : 'TBD'} • {b.session?.start_time?.slice(0, 5) || 'TBD'}</span>
                    </div>
                    <div className="text-text-primary font-display text-sm tracking-wide group-hover/item:text-accent-green transition-colors truncate" title={b.session.title}>
                       {b.session.title}
                    </div>
                    {b.session_time_athlete_local && (
                      <div className="mt-1 text-[10px] font-semibold text-accent-green/70 tracking-wide flex items-center gap-1.5">
                         <Clock size={10} /> Local: {b.session_time_athlete_local}
                      </div>
                    )}
                  </div>

                  {/* Right Column (span 4): Actions */}
                  <div className="md:col-span-4 flex items-center justify-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                     {b.status === 'PENDING' ? (
                       <div className="flex items-center gap-2 w-full md:w-auto">
                          <button 
                            onClick={() => handleMockAction(b.id, 'CANCELLED')}
                            className="h-10 w-10 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex-shrink-0"
                            title="Reject Booking"
                          >
                             <XSquare size={16} />
                          </button>
                          <button 
                            onClick={() => handleMockAction(b.id, 'CONFIRMED')}
                            className="h-10 px-4 bg-accent-green text-text-on-green font-semibold text-xs tracking-wide rounded-xl hover:bg-accent-green-dim transition-all shadow-[0_4px_12px_rgba(34,197,94,0.2)] flex items-center gap-1.5 flex-1 md:flex-none justify-center"
                          >
                             <CheckCircle2 size={12} />
                             <span>Authorize</span>
                          </button>
                       </div>
                     ) : (
                       <div className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-2 ${
                         b.status === 'CONFIRMED' ? 'bg-accent-green/10 text-accent-green border border-accent-green/30' : 
                         b.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border border-red-500/30' :
                         'bg-purple-500/10 text-purple-500 border border-purple-500/30'
                       }`}>
                          {b.status === 'CONFIRMED' ? <CheckCircle2 size={12} /> : b.status === 'CANCELLED' ? <XSquare size={12} /> : <Users size={12} />}
                          {b.status === 'CONFIRMED' ? 'Confirmed' : b.status === 'CANCELLED' ? 'Cancelled' : b.status}
                       </div>
                     )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          filteredBookings.map((b) => (
            <div 
              key={b.id} 
              className={`bg-bg-card border p-5 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:border-accent-green/20 transition-all group/item ${
                b.is_external ? 'border-purple-500/10 hover:border-purple-500/30' : 'border-border-card'
              }`}
            >
              {/* Left Column (span 4): Avatar + Name + Location + load stats */}
              <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                <Avatar src={b.athlete.avatar_url} name={`${b.athlete.first_name} ${b.athlete.last_name}`} size="md" role="athlete" />
                <div className="min-w-0">
                  <h4 className="text-text-primary font-semibold text-sm tracking-normal flex items-center gap-2 truncate">
                     {b.athlete.first_name} {b.athlete.last_name}
                     {b.athlete.country_code && (
                       <span className="text-[9px] bg-bg-input border border-border-input px-1 rounded text-text-secondary font-mono">
                         {b.athlete.country_code}
                       </span>
                     )}
                  </h4>
                  <div className="flex flex-col gap-0.5 mt-1">
                     <span className="text-text-muted text-[10px] tracking-wide flex items-center gap-1.5 truncate">
                        <Globe size={10} /> {b.athlete.timezone?.split('/')[1]?.replace('_', ' ') || 'UTC'}
                     </span>
                     {b.is_external ? (
                       <div className="mt-1">
                         <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[8px] font-black text-purple-400 uppercase tracking-widest">
                           External Player
                         </span>
                       </div>
                     ) : (
                       <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold tracking-wide flex items-center gap-1 ${
                            b.athlete.weekly_load > 600 ? 'text-amber-500' : 'text-accent-green'
                          }`}>
                             <Activity size={10} /> {b.athlete.weekly_load || 0} AU
                          </span>
                          <span className="text-[9px] text-text-muted font-mono">Load</span>
                       </div>
                     )}
                  </div>
                </div>
              </div>

              {/* Center Column (span 4): Date + Session Info */}
              <div className="md:col-span-4 flex flex-col gap-0.5 min-w-0 border-t md:border-t-0 md:border-l border-border-card pt-3 md:pt-0 md:pl-4">
                <div className="text-text-muted text-[10px] tracking-wide mb-1 flex items-center gap-1.5">
                   <Calendar size={10} className="text-accent-green" /> 
                   <span>{b.session?.scheduled_date ? format(new Date(b.session.scheduled_date), 'MMM d, yyyy') : 'TBD'} • {b.session?.start_time?.slice(0, 5) || 'TBD'}</span>
                </div>
                <div className="text-text-primary font-display text-sm tracking-wide group-hover/item:text-accent-green transition-colors truncate" title={b.session.title}>
                   {b.session.title}
                </div>
                {b.session_time_athlete_local && (
                  <div className="mt-1 text-[10px] font-semibold text-accent-green/70 tracking-wide flex items-center gap-1.5">
                     <Clock size={10} /> Local: {b.session_time_athlete_local}
                  </div>
                )}
                {b.notes && (
                  <div className="text-[9px] text-text-muted italic mt-1 truncate max-w-xs" title={b.notes}>
                    Notes: {b.notes}
                  </div>
                )}
              </div>

              {/* Right Column (span 4): Actions */}
              <div className="md:col-span-4 flex items-center justify-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                 {b.status === 'PENDING' ? (
                   <div className="flex items-center gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => handleAction(b.id, 'CANCELLED', b.is_external)}
                        className="h-10 w-10 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex-shrink-0"
                        title={b.is_external ? "Reject Booking" : "Reject Booking"}
                      >
                         <XSquare size={16} />
                      </button>
                      <button 
                        onClick={() => handleAction(b.id, 'CONFIRMED', b.is_external)}
                        className="h-10 px-4 bg-accent-green text-text-on-green font-semibold text-xs tracking-wide rounded-xl hover:bg-accent-green-dim transition-all shadow-[0_4px_12px_rgba(34,197,94,0.2)] flex items-center gap-1.5 flex-1 md:flex-none justify-center"
                      >
                         <CheckCircle2 size={12} />
                         <span>{b.is_external ? 'Confirm Payment' : 'Authorize'}</span>
                      </button>
                   </div>
                 ) : (
                   <div className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-2 ${
                     b.status === 'CONFIRMED' ? 'bg-accent-green/10 text-accent-green border border-accent-green/30' : 
                     b.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border border-red-500/30' :
                     'bg-purple-500/10 text-purple-500 border border-purple-500/30'
                   }`}>
                      {b.status === 'CONFIRMED' ? <CheckCircle2 size={12} /> : b.status === 'CANCELLED' ? <XSquare size={12} /> : <Users size={12} />}
                      {b.status === 'CONFIRMED' ? (b.is_external ? 'Paid & Confirmed' : 'Confirmed') : b.status === 'CANCELLED' ? 'Cancelled' : b.status}
                   </div>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      {filter === 'ALL' && bookings.length > 50 && (
        <div className="mt-6 pt-6 border-t border-border-card flex justify-center">
           <button className="text-[10px] font-bold text-text-muted tracking-wider flex items-center gap-2 hover:text-accent-green transition-all">
              View Historical Archive <ArrowRight size={12} />
           </button>
        </div>
      )}
    </div>
  );
}
