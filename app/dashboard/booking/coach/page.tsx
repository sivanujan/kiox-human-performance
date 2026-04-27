"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfToday } from "date-fns";
import { useCoachAvailability } from "@/app/hooks/useCoachAvailability";
import Avatar from "@/components/ui/Avatar";
import { useTimezone } from "@/hooks/useTimezone";
import TimezoneMismatch from "@/components/ui/TimezoneMismatch";
import { getOffsetLabel } from "@/lib/timezone";

export default function CoachBookingPage() {
  const { coaches, loading: loadingCoaches, error } = useCoachAvailability() as any;
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<any[]>([]);
  const [coachTimezone, setCoachTimezone] = useState('UTC');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { userTimezone, formatTimeOnly } = useTimezone();

  useEffect(() => {
    if (selectedCoach && selectedDate) {
      fetchSlots();
    }
  }, [selectedCoach, selectedDate]);

  const fetchSlots = async () => {
    if (!selectedCoach) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings/slots?coachId=${selectedCoach.id}&date=${selectedDate}`);
      const data = await res.json();
      setSlots(data.slots || []);
      setCoachTimezone(data.coach_timezone || 'UTC');
    } catch (err) {
      console.error("Failed to fetch slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async (slot: any) => {
    if (!selectedCoach) return;
    setBookingInProgress(true);
    try {
      const res = await fetch('/api/bookings/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: selectedCoach.id,
          date: selectedDate,
          startTime: slot.start_time,
          duration: selectedCoach.availability?.session_duration || 60,
          title: `Personal Training with ${selectedCoach.first_name}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Deployment Confirmed: See you on ${selectedDate} at ${slot.display_time}`);
        fetchSlots(); // Refresh slots
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Booking failed:", err);
    } finally {
      setBookingInProgress(false);
    }
  };

  const filteredCoaches = coaches.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const next7Days = [...Array(7)].map((_, i) => addDays(startOfToday(), i));

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-500 font-display uppercase tracking-widest">Error initializing coach matrix</p>
        <p className="text-gray-500 text-xs mt-2 uppercase">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div>
        <h2 className="font-display text-5xl text-white uppercase tracking-wider">Tactical Coach Selection</h2>
        <p className="text-[#22c55e] text-[10px] font-black uppercase tracking-[4px] mt-2 italic">Matrix Access // Human Performance Optimization</p>
        <div className="mt-4 flex items-center gap-2">
           <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Viewing times in:</span>
           <span className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg text-[#22c55e] text-[9px] font-black uppercase tracking-wider">
              {userTimezone} ({getOffsetLabel(userTimezone)})
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Coach Selection */}
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder="SEARCH OPERATIONAL STAFF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-xs text-white focus:border-[#22c55e] focus:outline-none transition-all uppercase font-bold tracking-widest"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingCoaches ? (
              [1,2,3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />)
            ) : (
              filteredCoaches.map((coach) => (
                <button 
                  key={coach.id}
                  onClick={() => setSelectedCoach(coach)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    selectedCoach?.id === coach.id ? 'bg-[#22c55e]/10 border-[#22c55e]' : 'bg-[#111] border-white/5 hover:border-white/20'
                  }`}
                >
                  <Avatar src={coach.avatar_url} name={coach.first_name} size="md" role="staff" />
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm tracking-wide uppercase">{coach.first_name} {coach.last_name}</h4>
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Coaching Specialist</p>
                  </div>
                  <ChevronRight size={16} className={selectedCoach?.id === coach.id ? 'text-[#22c55e]' : 'text-gray-700'} />
                </button>
              ))
            )}
            {!loadingCoaches && filteredCoaches.length === 0 && (
              <div className="py-20 text-center text-gray-700 uppercase font-black text-[10px] tracking-widest italic border border-dashed border-white/10 rounded-2xl bg-black/20">
                No operational staff detected in matrix
              </div>
            )}
          </div>
        </div>

        {/* Right: Calendar & Slots */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {selectedCoach ? (
              <motion.div 
                key="coach-selected"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Date Picker */}
                <div className="bg-[#111] border border-white/5 p-6 rounded-3xl">
                   <h3 className="text-gray-500 font-display text-[10px] tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
                     <CalendarIcon size={14} className="text-[#22c55e]" /> SELECT OPERATIONAL DATE
                   </h3>
                   <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                      {next7Days.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isSelected = selectedDate === dateStr;
                        return (
                          <button 
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`shrink-0 flex flex-col items-center justify-center w-20 py-4 rounded-2xl border transition-all ${
                              isSelected ? 'bg-[#22c55e] border-[#22c55e] text-black shadow-[0_10px_20px_rgba(34,197,94,0.3)]' : 'bg-black/40 border-white/5 text-white/40 hover:text-white'
                            }`}
                          >
                             <span className="text-[9px] font-black uppercase tracking-widest mb-1">{format(date, 'EEE')}</span>
                             <span className="text-lg font-display">{format(date, 'dd')}</span>
                          </button>
                        );
                      })}
                   </div>
                </div>

                {/* Slot Picker */}
                <div className="bg-[#111] border border-white/5 p-8 rounded-3xl min-h-[400px] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.02] font-display text-[100px] pointer-events-none uppercase">SLOTS</div>
                   
                   <div className="relative z-10">
                      <h3 className="text-gray-500 font-display text-[10px] tracking-[0.3em] uppercase mb-8 flex items-center gap-2">
                        <Clock size={14} className="text-[#22c55e]" /> AVAILABLE TIME SEGMENTS
                      </h3>

                      {slots.length > 0 && (
                        <div className="mb-6">
                           <TimezoneMismatch date={selectedDate} time={slots[0].start_time} coachTimezone={coachTimezone} />
                        </div>
                      )}

                      {successMessage && (
                        <div className="mb-8 p-4 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl text-[#22c55e] text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-3">
                           <CheckCircle2 size={16} /> {successMessage}
                        </div>
                      )}

                      {loadingSlots ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                           <Loader2 className="text-[#22c55e] animate-spin" size={32} />
                           <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest animate-pulse">Syncing Availability...</span>
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border border-dashed border-white/10 rounded-2xl bg-black/20">
                           <AlertCircle className="text-gray-700" size={32} />
                           <div>
                              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">No Operational Slots Detected</p>
                              <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest mt-1">Try another date or staff member</p>
                           </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {slots.map((slot, i) => (
                             <div 
                               key={i}
                               className={`p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                                 slot.is_available 
                                   ? 'bg-white/[0.02] border-white/5 hover:border-[#22c55e]/30 hover:bg-[#22c55e]/5' 
                                   : 'bg-black/40 border-white/5 opacity-50 grayscale'
                               }`}
                             >
                                <div>
                                   <div className="flex items-center gap-3 mb-1">
                                      <span className={`text-sm font-display tracking-wider ${slot.is_available ? 'text-white group-hover:text-[#22c55e]' : 'text-gray-500'}`}>
                                        {formatTimeOnly(slot.start_time, coachTimezone)}
                                      </span>
                                      <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                                         ({slot.display_time} Coach)
                                      </span>
                                      {slot.is_available && (
                                        <div className="px-2 py-0.5 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded text-[8px] font-black text-[#22c55e] uppercase tracking-widest">
                                           OPEN
                                        </div>
                                      )}
                                   </div>
                                   <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
                                      CAPACITY: {slot.current_bookings}/{slot.max_capacity} PERSONNEL
                                   </p>
                                </div>

                                {slot.is_available ? (
                                  <button 
                                    onClick={() => handleBook(slot)}
                                    disabled={bookingInProgress}
                                    className="px-6 py-2.5 bg-[#22c55e] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all transform active:scale-95 shadow-[0_5px_15px_rgba(34,197,94,0.2)]"
                                  >
                                    {bookingInProgress ? 'INIT...' : 'BOOK NOW'}
                                  </button>
                                ) : (
                                  <div className="text-[9px] text-gray-700 font-black uppercase tracking-[2px] px-4 py-2 border border-white/5 rounded-xl">
                                     DEP_FULL
                                  </div>
                                )}
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="no-coach"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[600px] flex flex-col items-center justify-center text-center space-y-6 border border-dashed border-white/10 rounded-[40px] bg-white/[0.01]"
              >
                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <User size={40} className="text-[#22c55e]" />
                 </div>
                 <div>
                    <h3 className="font-display text-2xl text-white uppercase tracking-wider mb-2">Initialize Coach Directive</h3>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[3px] max-w-xs mx-auto leading-relaxed">
                      Select an operational staff member from the left matrix to access their scheduling grid.
                    </p>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
