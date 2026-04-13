"use client";

import React from 'react';

interface LoadProgressBarProps {
  current: number;
  target?: number;
  showLabels?: boolean;
}

export default function LoadProgressBar({ current, target = 650, showLabels = true }: LoadProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);
  
  const getLoadColor = (load: number) => {
    if (load < 500) return '#3b82f6';  // blue - under
    if (load <= 650) return '#22c55e'; // green - optimal  
    if (load <= 800) return '#f59e0b'; // orange - high
    return '#ef4444';                  // red - danger
  };

  const color = getLoadColor(current);

  return (
    <div className="w-full space-y-1.5">
      {showLabels && (
        <div className="flex justify-between items-end px-1">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest whitespace-nowrap">
            {current} AU <span className="text-white/10">/ {target} TARGET</span>
          </span>
          <span 
            className="text-[10px] font-['Anton'] tracking-wider"
            style={{ color: color }}
          >
            {Math.round((current / target) * 100)}%
          </span>
        </div>
      )}
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div 
          className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color,
            boxShadow: current > 800 ? `0 0 15px ${color}44` : 'none'
          }}
        />
      </div>
    </div>
  );
}
