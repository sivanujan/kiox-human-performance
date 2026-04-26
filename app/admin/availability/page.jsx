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

  return (
    <motion.div
      whileHover={{ x: 5 }}
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected 
          ? 'bg-[#22c55e]/10 border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
          : 'bg-black/40 border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e] font-display text-lg overflow-hidden">
            {coach.avatar_url ? (
              <img src={coach.avatar_url} alt={coach.first_name} className="w-full h-full object-cover" />
            ) : (
              coach.first_name?.[0]
            )}
          </div>
          <div>
            <h4 className={`text-sm font-display tracking-wider uppercase ${isSelected ? 'text-[#22c55e]' : 'text-white'}`}>
              {coach.first_name} {coach.last_name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <CoachStatusDot isOnline={isOnline} size="sm" />
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                {todaySchedule?.is_working ? `${todaySchedule.start_time} - ${todaySchedule.end_time}` : 'Day Off'}
              </span>
            </div>
          </div>
        </div>
        {isSelected && <ChevronRight className="text-[#22c55e]" size={16} />}
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
      <Loader2 className="text-[#22c55e] animate-spin" size={48} />
      <p className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px] animate-pulse">Synchronizing Staff Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e]" />
          <h1 className="font-display text-3xl text-white uppercase tracking-wider">Coach Availability</h1>
        </div>
        <p className="text-gray-500 text-[11px] font-black uppercase tracking-[3px] ml-4">
          Set working hours and operational status for coaching staff
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Coach List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH COACH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-xl pl-12 pr-4 py-4 text-[10px] font-black text-white uppercase tracking-widest focus:border-[#22c55e]/50 focus:outline-none transition-all"
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
              backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', 
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

            <div className="absolute top-0 right-0 p-8 opacity-5 font-display text-9xl pointer-events-none uppercase">
              OPS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
