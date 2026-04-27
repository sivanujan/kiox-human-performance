"use client";

import React from 'react';
import { useTimezone } from '@/hooks/useTimezone';
import { getOffsetLabel } from '@/lib/timezone';
import { Clock, Globe, AlertTriangle } from 'lucide-react';

interface TimeDisplayProps {
  date: string;
  time: string;
  endTime?: string;
  coachTimezone?: string;
}

export default function TimeDisplay({ date, time, endTime, coachTimezone = 'UTC' }: TimeDisplayProps) {
  const { userTimezone, formatToLocal, formatTimeOnly, getDiffLabel, isMismatch } = useTimezone();
  
  const localTime = formatToLocal(date, time, coachTimezone);
  const localTimeOnly = localTime.split(',').pop()?.trim() || '';
  const localDateOnly = localTime.split(',').slice(0, 2).join(',') || '';
  
  const coachTimeOnly = time;
  const coachEndTimeOnly = endTime;
  
  const localEndTimeOnly = endTime ? formatTimeOnly(endTime, coachTimezone) : null;
  const diffLabel = getDiffLabel(coachTimezone);
  const different = isMismatch(coachTimezone);
  
  const userOffset = getOffsetLabel(userTimezone);
  const coachOffset = getOffsetLabel(coachTimezone);

  return (
    <div className="space-y-4">
      {/* User Time (Large) */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Clock size={60} />
        </div>
        
        <div className="text-[10px] font-black text-[#22c55e] uppercase tracking-[3px] mb-2 flex items-center gap-2">
          <Globe size={12} /> Your Local Time
        </div>
        
        <div className="flex flex-col">
          <div className="text-3xl font-display text-white tracking-widest">
            {localTimeOnly} {localEndTimeOnly && ` - ${localEndTimeOnly}`}
          </div>
          <div className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
            {localDateOnly} // {userTimezone.replace('_', ' ')} ({userOffset})
          </div>
        </div>
      </div>

      {/* Coach Time & Diff (Smaller) */}
      {different && (
        <div className="flex flex-col gap-3 px-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Clock size={10} /> Coach Time
              </div>
              <div className="text-sm font-bold text-gray-300">
                {coachTimeOnly} {coachEndTimeOnly && ` - ${coachEndTimeOnly}`}
              </div>
              <div className="text-[10px] text-gray-500 uppercase font-bold">
                {coachTimezone.replace('_', ' ')} ({coachOffset})
              </div>
            </div>
            
            <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <AlertTriangle size={12} className="text-[#f59e0b]" />
              <span className="text-[10px] font-black text-[#f59e0b] uppercase tracking-wider">
                {diffLabel}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
