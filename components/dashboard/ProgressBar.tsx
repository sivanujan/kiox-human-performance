'use client'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  color?: string
  height?: number
  showValue?: boolean
}

export default function ProgressBar({
  value,
  color = 'var(--accent-green)',
  height = 6,
  showValue = false }: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value))
  const isCssVar = color.startsWith('var(')
  const shadowColor = isCssVar ? `color-mix(in srgb, ${color} 37.5%, transparent)` : `${color}60`

  return (
    <div className="w-full">
      {showValue && (
        <div className="flex justify-end mb-1">
          <span className="text-[10px] font-display text-accent-green tracking-widest">{clampedValue}%</span>
        </div>
      )}
      <div 
        className="bg-bg-secondary border border-border-primary/20 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{
            height: '100%',
            backgroundColor: color,
            boxShadow: `0 0 12px ${shadowColor}`
          }}
          className="rounded-full"
        />
      </div>
    </div>
  )
}
