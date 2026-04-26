"use client";

import { motion } from 'framer-motion';

export default function CoachStatusDot({ isOnline, size = "md", showLabel = false }) {
  const dotSize = size === "sm" ? "w-2 h-2" : size === "lg" ? "w-4 h-4" : "w-3 h-3";
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`${dotSize} rounded-full ${isOnline ? 'bg-[#22c55e]' : 'bg-[#444444]'}`} />
        {isOnline && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ 
              opacity: 0, 
              scale: 1.8 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeOut"
            }}
            className={`absolute inset-0 rounded-full bg-[#22c55e] z-0`}
          />
        )}
      </div>
      {showLabel && (
        <span className={`text-[10px] font-black tracking-widest uppercase ${isOnline ? 'text-[#22c55e]' : 'text-gray-500'}`}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      )}
    </div>
  );
}
