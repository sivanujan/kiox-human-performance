'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral' | string
  color?: string
}

export default function MetricCard({
  label,
  value,
  unit,
  icon,
  trend,
  color = '#22c55e'
}: MetricCardProps) {
  const getThemeColor = (c: string) => {
    if (c === '#22c55e' || c === '#00ff87' || c === '#00a855') {
      return 'var(--accent-green)'
    }
    return c
  }

  const resolvedColor = getThemeColor(color)

  const getTrendIcon = () => {
    if (trend === 'up' || trend === '↑') return <TrendingUp size={14} className="text-accent-green" />
    if (trend === 'down' || trend === '↓') return <TrendingDown size={14} className="text-[#ef4444]" />
    return <Minus size={14} className="text-text-muted" />
  }

  return (
    <motion.div
      whileHover={{ y: -2, borderColor: `color-mix(in srgb, ${resolvedColor} 40%, transparent)` }}
      className="bg-bg-card border border-border-card rounded-2xl p-5 flex items-center gap-4 transition-all hover:bg-bg-card-hover"
    >
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border"
        style={{ 
          backgroundColor: `color-mix(in srgb, ${resolvedColor} 10%, transparent)`,
          borderColor: `color-mix(in srgb, ${resolvedColor} 20%, transparent)`,
          color: resolvedColor
        }}
      >
        <span className="text-xl">{icon}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold text-text-secondary tracking-[2px] uppercase mb-1">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-display text-text-primary tracking-wider">
            {value}
          </span>
          {unit && (
            <span className="text-[10px] font-bold text-text-muted uppercase">
              {unit}
            </span>
          )}
          {trend && (
            <div className="ml-auto">
              {getTrendIcon()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
