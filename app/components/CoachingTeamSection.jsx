"use client";

import { useCoachAvailability } from '@/app/hooks/useCoachAvailability';
import { useOnlineStatus } from '@/app/hooks/useOnlineStatus';
import CoachStatusDot from './CoachStatusDot';
import { motion } from 'framer-motion';
import { User, MessageSquare } from 'lucide-react';

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

function CoachCard({ coach }) {
  const { isOnline, todaySchedule } = useOnlineStatus(coach.schedule);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-[#111] border border-white/5 rounded-2xl p-5 group hover:border-[#22c55e]/30 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e] font-display text-xl overflow-hidden">
            {coach.avatar_url ? (
              <img src={coach.avatar_url} alt={coach.first_name} className="w-full h-full object-cover" />
            ) : (
              coach.first_name?.[0]
            )}
          </div>
          <div>
            <h4 className="text-white font-display text-sm tracking-wider uppercase group-hover:text-[#22c55e] transition-colors">
              {coach.first_name} {coach.last_name}
            </h4>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-0.5">
              Coaching Staff
            </p>
          </div>
        </div>
        <CoachStatusDot isOnline={isOnline} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Today's Ops:</span>
          <span className={`text-[10px] font-bold uppercase ${isOnline ? 'text-[#22c55e]' : 'text-gray-400'}`}>
            {todaySchedule?.is_working ? `${formatTime(todaySchedule.start_time)} - ${formatTime(todaySchedule.end_time)}` : 'Not available today'}
          </span>
        </div>

        {/* Mini Schedule dots */}
        <div className="flex justify-between items-center gap-1">
          {DAYS_FULL.map((dayName, idx) => {
            const day = coach.schedule?.find(s => s.day_name === dayName);
            const isToday = dayName === todaySchedule?.day_name;
            return (
              <div 
                key={dayName}
                title={`${dayName}: ${day?.is_working ? 'Available' : 'Day Off'}`}
                className={`flex-1 h-1 rounded-full ${
                  isToday 
                    ? day?.is_working ? 'bg-[#22c55e]' : 'bg-gray-700' 
                    : day?.is_working ? 'bg-[#22c55e]/30' : 'bg-white/5'
                }`}
              />
            );
          })}
        </div>
        <div className="flex justify-between px-0.5">
          {DAYS_SHORT.map((d, i) => (
            <span key={i} className="text-[7px] font-black text-gray-600">{d}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function CoachingTeamSection() {
  const { coaches, loading } = useCoachAvailability();

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-40 bg-white/5 animate-pulse rounded-2xl" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-[#22c55e] font-display text-sm tracking-[0.2em] uppercase flex items-center gap-3">
          <User size={18} /> COACHING TEAM
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coaches.map((coach) => (
          <CoachCard key={coach.id} coach={coach} />
        ))}
      </div>
    </div>
  );
}
