"use client";

import React from 'react';
import { useTimezone } from '@/hooks/useTimezone';
import { AlertTriangle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimezoneMismatchProps {
  date: string;
  time: string;
  coachTimezone: string;
}

export default function TimezoneMismatch({ date, time, coachTimezone }: TimezoneMismatchProps) {
  const { formatToLocal, userTimezone } = useTimezone();
  
  const localTimeStr = formatToLocal(date, time, coachTimezone);
  const hourMatch = localTimeStr.match(/(\d{2}):/);
  const hour = hourMatch ? parseInt(hourMatch[1]) : 12;
  
  const isAntiSocial = hour < 6 || hour >= 22;

  if (!isAntiSocial) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <AlertTriangle size={40} />
        </div>
        
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/20 flex items-center justify-center text-[#f59e0b] shrink-0">
            <Clock size={20} />
          </div>
          <div className="space-y-2">
            <h4 className="text-[12px] font-black text-[#f59e0b] uppercase tracking-[2px]">Timezone Notice</h4>
            <p className="text-sm text-white/70 leading-relaxed">
              This session is at <span className="text-white font-black">{hour}:00</span> in your local time ({userTimezone.split('/')[1]?.replace('_', ' ')}).
            </p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Coach time: {time} ({coachTimezone.split('/')[1]?.replace('_', ' ')})
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
