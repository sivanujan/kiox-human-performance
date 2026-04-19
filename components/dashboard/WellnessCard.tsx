'use client'
import { motion } from 'framer-motion'
import ProgressBar from './ProgressBar'

interface WellnessCardProps {
  label: string
  value: string | number
  icon: string
  progress?: number
  color?: string
  invert?: boolean
}

export default function WellnessCard({
  label,
  value,
  icon,
  progress,
  color = '#22c55e',
  invert = false
}: WellnessCardProps) {
  // Logic for color based on progress if inverted (e.g. soreness: high progress is bad)
  const finalColor = invert && progress && progress > 60 ? '#ef4444' : color

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-black/30 border border-white/5 rounded-2xl p-5 group flex flex-col justify-between h-[120px] transition-all hover:border-white/10"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-[9px] font-bold text-gray-400 tracking-[2px] uppercase">
          {label}
        </div>
        <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
      </div>

      <div>
        <div 
          className="text-xl font-display tracking-wider mb-2"
          style={{ color: finalColor }}
        >
          {value}
        </div>
        {progress !== undefined && (
          <ProgressBar 
            value={progress} 
            color={finalColor} 
            height={4} 
          />
        )}
      </div>
    </motion.div>
  )
}
