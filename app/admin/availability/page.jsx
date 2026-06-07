"use client";

import { useState } from 'react';
import { useCoachAvailability } from '@/app/hooks/useCoachAvailability';
import { useOnlineStatus } from '@/app/hooks/useOnlineStatus';
import CoachAvailabilityEditor from '@/app/components/CoachAvailabilityEditor';
import CoachStatusDot from '@/app/components/CoachStatusDot';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Calendar, ChevronRight, Search, Zap, Loader2 } from 'lucide-react';

function CoachListItem({ coach, isSelected, onClick }) {
  const { isOnline, todaySchedule } = useOnlineStatus(coach.schedule);
  const activeDaysCount = coach.schedule?.filter(s => s.is_working).length || 0;

  return (
    <motion.div
      whileHover={{ x: 5 }}
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all hover:bg-[#00ff88]/5 hover:border-[#00ff88]/20 ${
        isSelected 
          ? 'bg-[#00ff88]/10 border-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.1)]' 
          : 'bg-black/40 border-white/5'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-[#00ff88] font-display text-lg overflow-hidden">
            {coach.avatar_url ? (
              <img src={coach.avatar_url} alt={coach.first_name} className="w-full h-full object-cover" />
            ) : (
              coach.first_name?.[0]
            )}
          </div>
          <div>
            <h4 className={`text-sm font-display tracking-wider uppercase flex items-center gap-2 ${isSelected ? 'text-[#00ff88]' : 'text-white'}`}>
              {coach.first_name} {coach.last_name}
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-[#00ff88] shadow-[0_0_8px_#00ff88]' : 'bg-gray-600'}`} />
            </h4>
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">
                {todaySchedule?.is_working ? `${todaySchedule.start_time} - ${todaySchedule.end_time}` : 'Day Off'}
              </span>
              <span className="text-[8px] font-black text-[#00ff88]/60 uppercase tracking-widest">
                {activeDaysCount} {activeDaysCount === 1 ? 'day' : 'days'} active
              </span>
            </div>
          </div>
        </div>
        {isSelected && <ChevronRight className="text-[#00ff88]" size={16} />}
      </div>
    </motion.div>
  );
}

export default function AvailabilityAdminPage() {
  const { coaches, loading, error, saveSchedule } = useCoachAvailability();
  const [selectedCoachId, setSelectedCoachId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCoach = coaches.find(c => c.id === selectedCoachId);
  
  const filteredCoaches = coaches.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && coaches.length === 0) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="text-[#00ff88] animate-spin" size={48} />
      <p className="text-[10px] font-black text-[#00ff88] uppercase tracking-[4px] animate-pulse">Synchronizing Staff Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-[#00ff88] rounded-full shadow-[0_0_10px_#00ff88]" />
          <h1 className="font-display text-3xl text-white uppercase tracking-wider">Coach Availability</h1>
        </div>
        <p className="text-gray-500 text-[11px] font-black uppercase tracking-[3px] ml-4">
          Set working hours and operational status for coaching staff
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Coach List */}
        <div className="lg:col-span-4 bg-[#111] border border-white/5 p-6 rounded-3xl space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH COACH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-[10px] font-black text-white uppercase tracking-widest focus:border-[#00ff88]/50 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredCoaches.map((coach) => (
              <CoachListItem 
                key={coach.id} 
                coach={coach} 
                isSelected={selectedCoachId === coach.id}
                onClick={() => setSelectedCoachId(coach.id)}
              />
            ))}
            {filteredCoaches.length === 0 && (
              <div className="py-20 text-center text-gray-600 font-display text-sm uppercase tracking-widest italic">
                No coaches found
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="lg:col-span-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 relative overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ 
              backgroundImage: 'linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }} />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCoachId || 'empty'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <CoachAvailabilityEditor 
                  coach={selectedCoach} 
                  onSave={saveSchedule} 
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute top-0 right-0 p-8 opacity-[0.02] font-display text-9xl pointer-events-none uppercase">
              OPS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
