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
  const getTrendIcon = () => {
    if (trend === 'up' || trend === '↑') return <TrendingUp size={14} className="text-[#22c55e]" />
    if (trend === 'down' || trend === '↓') return <TrendingDown size={14} className="text-[#ef4444]" />
    return <Minus size={14} className="text-gray-500" />
  }

  return (
    <motion.div
      whileHover={{ y: -2, borderColor: `${color}40` }}
      className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4 transition-all"
    >
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border"
        style={{ 
          backgroundColor: `${color}10`,
          borderColor: `${color}20`,
          color: color
        }}
      >
        <span className="text-xl">{icon}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold text-gray-400 tracking-[2px] uppercase mb-1">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-display text-white tracking-wider">
            {value}
          </span>
          {unit && (
            <span className="text-[10px] font-bold text-gray-500 uppercase">
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
