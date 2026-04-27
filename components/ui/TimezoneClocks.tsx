"use client";

import React, { useState, useEffect } from 'react';
import { getCurrentTimeIn, getOffsetLabel } from '@/lib/timezone';
import { Clock, Globe } from 'lucide-react';

const DEFAULT_ZONES = [
  { name: 'Your Time', tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { name: 'Sri Lanka', tz: 'Asia/Colombo' },
  { name: 'Toronto', tz: 'America/Toronto' },
  { name: 'Lagos', tz: 'Africa/Lagos' },
];

export default function TimezoneClocks() {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTimes = () => {
      const newTimes: Record<string, string> = {};
      DEFAULT_ZONES.forEach(zone => {
        newTimes[zone.tz] = getCurrentTimeIn(zone.tz);
      });
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={14} className="text-[#22c55e]" />
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[3px]">Global Ops Time</span>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {DEFAULT_ZONES.map((zone) => (
          <div key={zone.tz} className="flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-[#22c55e] transition-colors">
                {zone.name}
              </span>
              <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter">
                {zone.tz.split('/')[1]?.replace('_', ' ') || zone.tz} ({getOffsetLabel(zone.tz)})
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-white group-hover:text-[#22c55e] transition-colors">
              {times[zone.tz] || '--:--'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
