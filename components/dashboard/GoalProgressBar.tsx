'use client'
import { motion } from 'framer-motion'
import ProgressBar from './ProgressBar'

interface GoalProgressBarProps {
  label: string
  current: number
  target: number
  unit?: string
  change?: string
  invert?: boolean
}

export default function GoalProgressBar({
  label,
  current,
  target,
  unit = '',
  change,
  invert = false
}: GoalProgressBarProps) {
  const percentage = Math.min(100, (current / target) * 100)
  
  // Logic for color: green if meeting target, red if not.
  // Invert means lower is better (e.g. fatigue)
  const isMeetingTarget = invert ? current <= target : current >= target
  const color = isMeetingTarget ? '#22c55e' : '#f59e0b'

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between items-end mb-2">
        <div>
          <div className="text-[10px] font-bold text-gray-400 tracking-[2px] uppercase">
            {label}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-display text-white">
              {current}{unit}
            </span>
            <span className="text-[10px] font-bold text-gray-700 uppercase">
              Target: {target}{unit}
            </span>
          </div>
        </div>
        
        {change && (
          <div className={`text-[10px] font-bold tracking-widest ${change.startsWith('+') ? 'text-[#22c55e]' : 'text-gray-400'}`}>
            {change}
          </div>
        )}
      </div>

      <div className="relative pt-1">
        <ProgressBar value={percentage} color={color} height={8} />
        
        {/* Target Marker */}
        <div 
          className="absolute top-0 w-0.5 h-3 bg-white/40 shadow-[0_0_8px_white]"
          style={{ left: '100%', marginLeft: '-2px' }}
        />
      </div>
    </div>
  )
}
