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
  ShieldCheck,
  Globe,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfToday } from "date-fns";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";

export default function PublicBookingPage() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<any[]>([]);
  const [coachTimezone, setCoachTimezone] = useState('UTC');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<"coach" | "details">("coach");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  useEffect(() => {
    fetchCoaches();
  }, []);

  useEffect(() => {
    if (selectedCoach && selectedDate) {
      fetchSlots();
    }
  }, [selectedCoach, selectedDate]);

  const fetchCoaches = async () => {
    setLoadingCoaches(true);
    try {
      const res = await fetch("/api/public/coaches");
      const data = await res.json();
      if (!data.error) {
        setCoaches(data.coaches || []);
      }
    } catch (err) {
      console.error("Failed to fetch public coaches:", err);
    } finally {
      setLoadingCoaches(false);
    }
  };

  const fetchSlots = async () => {
    if (!selectedCoach) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/public/slots?coachId=${selectedCoach.id}&date=${selectedDate}`);
      const data = await res.json();
      setSlots(data.slots || []);
      setCoachTimezone(data.coach_timezone || 'UTC');
    } catch (err) {
      console.error("Failed to fetch public slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach || !selectedSlot || !playerName) return;
    setBookingInProgress(true);
    try {
      const res = await fetch('/api/public/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: selectedCoach.id,
          date: selectedDate,
          startTime: selectedSlot.start_time,
          duration: selectedCoach.availability?.session_duration || 60,
          title: `Personal Training: ${playerName} with ${selectedCoach.first_name}`,
          playerName,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Booking Transmitted! Date: ${selectedDate} at ${selectedSlot.display_time}. Check your email / contact admin to confirm your payment.`);
        setStep("coach");
        setSelectedSlot(null);
        setPlayerName("");
        setNotes("");
        fetchSlots(); // Refresh slots
        setTimeout(() => setSuccessMessage(null), 8000);
      } else {
        alert(data.error || "Booking failed");
      }
    } catch (err) {
      console.error("Booking failed:", err);
    } finally {
      setBookingInProgress(false);
    }
  };

  const filteredCoaches = coaches.filter((c: any) => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const next7Days = [...Array(7)].map((_, i) => addDays(startOfToday(), i));

  return (
    <div className="min-h-screen bg-[#060606] text-white flex flex-col items-center justify-start relative overflow-hidden">
      {/* Background grids */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(34,197,94,0.05)_0%,_transparent_70%)] blur-[80px]" />
      </div>

      <header className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <Link href="/" className="font-display font-black text-2xl tracking-widest text-white flex items-center gap-2">
          KIO<span className="text-[#22c55e]">-</span>X
        </Link>
        <Link href="/signin" className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-[#22c55e]/30 hover:bg-[#22c55e]/5 text-white text-xs font-bold rounded-xl transition-all">
          Client Login
        </Link>
      </header>

      <main className="w-full max-w-6xl mx-auto px-6 py-12 relative z-10 flex-1 flex flex-col justify-start">
        {/* Header Title */}
        <div className="mb-10 text-center md:text-left">
          <span className="text-[#22c55e] text-[10px] font-black uppercase tracking-[4px] italic block mb-2">OPERATIONAL BOOKING INTERFACE</span>
          <h1 className="font-display text-4xl md:text-5xl text-white uppercase tracking-wider font-bold">External Session Request</h1>
          <p className="text-gray-400 text-xs mt-2 max-w-xl">Reserve high-performance 1-on-1 coaching slots. Subject to admin approval and payment confirmation.</p>
        </div>

        {successMessage && (
          <div className="mb-8 p-6 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-3xl text-[#22c55e] text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-3">
            <CheckCircle2 size={20} />
            <div>
              <p className="font-black">{successMessage}</p>
              <p className="text-[10px] text-gray-400 mt-1 font-normal tracking-normal normal-case">Please complete payment and keep screenshots ready for verification.</p>
            </div>
          </div>
        )}

        {step === "coach" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Coach List */}
            <div className="space-y-6">
              <div className="bg-[#111] border border-white/5 p-6 rounded-3xl">
                <h3 className="text-gray-500 font-display text-[10px] tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
                  <Search size={14} className="text-[#22c55e]" /> Search Specialists
                </h3>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search coaches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-5 pr-6 py-4 text-xs text-white focus:border-[#22c55e] focus:outline-none transition-all uppercase font-bold tracking-wider"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {loadingCoaches ? (
                  [1,2,3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl border border-white/5" />)
                ) : (
                  filteredCoaches.map((coach: any) => (
                    <button 
                      key={coach.id}
                      onClick={() => {
                        setSelectedCoach(coach);
                        setSelectedSlot(null);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                        selectedCoach?.id === coach.id ? 'bg-[#22c55e]/10 border-[#22c55e]' : 'bg-[#111] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <Avatar src={coach.avatar_url} name={coach.first_name} size="md" role="staff" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm tracking-wide uppercase truncate">{coach.first_name} {coach.last_name}</h4>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-0.5">UEFA Licensed Specialist</p>
                      </div>
                      <ChevronRight size={16} className={selectedCoach?.id === coach.id ? 'text-[#22c55e]' : 'text-gray-700'} />
                    </button>
                  ))
                )}
                {!loadingCoaches && filteredCoaches.length === 0 && (
                  <div className="py-20 text-center text-gray-700 uppercase font-black text-[10px] tracking-widest italic border border-dashed border-white/10 rounded-2xl bg-black/20">
                    No coaches available at this time
                  </div>
                )}
              </div>
            </div>

            {/* Right: Date Picker & Slot Picker */}
            <div className="lg:col-span-2 space-y-6">
              {selectedCoach ? (
                <div className="space-y-6">
                  {/* Date selection */}
                  <div className="bg-[#111] border border-white/5 p-6 rounded-3xl">
                     <h3 className="text-gray-500 font-display text-[10px] tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
                       <CalendarIcon size={14} className="text-[#22c55e]" /> Select Date
                     </h3>
                     <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {next7Days.map((date) => {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const isSelected = selectedDate === dateStr;
                          return (
                            <button 
                              key={dateStr}
                              onClick={() => {
                                setSelectedDate(dateStr);
                                setSelectedSlot(null);
                              }}
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

                  {/* Slot picker */}
                  <div className="bg-[#111] border border-white/5 p-6 md:p-8 rounded-3xl min-h-[300px]">
                     <h3 className="text-gray-500 font-display text-[10px] tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
                       <Clock size={14} className="text-[#22c55e]" /> Choose Time Slot
                     </h3>

                     {loadingSlots ? (
                       <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <Loader2 className="text-[#22c55e] animate-spin" size={32} />
                          <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest animate-pulse">Syncing times...</span>
                       </div>
                     ) : slots.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border border-dashed border-white/10 rounded-2xl bg-black/20">
                          <AlertCircle className="text-gray-700" size={32} />
                          <div>
                             <p className="text-white/60 text-xs font-bold uppercase tracking-widest">No slots available on this day</p>
                             <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest mt-1">Please try selecting another date</p>
                          </div>
                       </div>
                     ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {slots.map((slot: any, i: number) => (
                            <div 
                              key={i}
                              className={`p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                                slot.is_available 
                                  ? 'bg-white/[0.02] border-white/5 hover:border-[#22c55e]/30' 
                                  : 'bg-black/40 border-white/5 opacity-50 grayscale'
                              }`}
                            >
                               <div>
                                  <div className="flex items-center gap-2.5">
                                     <span className="text-sm font-display tracking-wider text-white">
                                       {slot.display_time}
                                     </span>
                                     <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                                        ({slot.start_time.slice(0, 5)})
                                     </span>
                                  </div>
                                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                     Capacity: {slot.current_bookings}/{slot.max_capacity}
                                  </p>
                               </div>

                               {slot.is_available ? (
                                 <button 
                                   onClick={() => {
                                     setSelectedSlot(slot);
                                     setStep("details");
                                   }}
                                   className="px-4 py-2 bg-[#22c55e] text-black text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-white transition-all"
                                 >
                                   Select Slot
                                 </button>
                               ) : (
                                 <div className="text-[9px] text-gray-600 font-black uppercase tracking-[2px] px-4 py-2 border border-white/5 rounded-lg bg-white/5">
                                    Full
                                 </div>
                               )}
                            </div>
                          ))}
                       </div>
                     )}
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 border border-dashed border-white/10 rounded-[40px] bg-white/[0.01]">
                   <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                      <User size={40} className="text-[#22c55e]" />
                   </div>
                   <div>
                      <h3 className="font-display text-2xl text-white uppercase tracking-wider mb-2">Select a Coach</h3>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-[3px] max-w-xs mx-auto leading-relaxed">
                        Choose an operational coach from the left column to view their scheduling grid and select a slot.
                      </p>
                   </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6"
            >
              <h2 className="font-display text-2xl text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="text-[#22c55e]" size={20} /> Booking Details
              </h2>
              
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-2">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Session Overview</p>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-gray-600">Coach:</span> <span className="text-white font-black">{selectedCoach?.first_name} {selectedCoach?.last_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span> <span className="text-white font-black">{selectedDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Time Slot:</span> <span className="text-white font-black">{selectedSlot?.display_time}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Timezone:</span> <span className="text-[#22c55e] font-black">{coachTimezone}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleBook} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] mb-2 block">Player Full Name</label>
                  <input 
                    type="text"
                    required
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-xs focus:border-[#22c55e] transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] mb-2 block">Special Directives / Notes (Optional)</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Please specify any injuries, goals, or requests for the coach..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-xs focus:border-[#22c55e] transition-all outline-none min-h-[120px] resize-none"
                  />
                </div>

                <div className="p-4 bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-2xl flex gap-3 items-start">
                  <ShieldCheck className="text-[#22c55e] shrink-0 mt-0.5" size={16} />
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-relaxed">
                    <span className="text-white font-bold">Booking confirmation policy:</span> Bookings are stored as pending. An administrator will verify the slot and contact you for confirmation and payment details.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setStep("coach")}
                    className="flex-1 py-4 bg-white/5 text-white/50 text-xs font-bold uppercase tracking-[2px] rounded-2xl hover:bg-white/10 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    disabled={bookingInProgress || !playerName}
                    className="flex-[2] py-4 bg-[#22c55e] text-black text-xs font-bold uppercase tracking-[2px] rounded-2xl hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
                  >
                    {bookingInProgress ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Request Session
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
