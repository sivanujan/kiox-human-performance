'use client'

interface StatusBadgeProps {
  label: string
  value: string | number
  color?: string
  colors?: Record<string, string>
}

export default function StatusBadge({ 
  label, 
  value, 
  color,
  colors 
}: StatusBadgeProps) {
  // Determine final color based on value or default
  const valLower = String(value).toLowerCase()
  const finalColor = color || (colors && colors[valLower]) || '#22c55e'

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-input border border-border-input rounded-lg">
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-text-muted tracking-[1px] uppercase">{label}</span>
        <div className="flex items-center gap-1.5">
          <div 
            className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]"
            style={{ color: finalColor, backgroundColor: 'currentColor' }}
          />
          <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">{value}</span>
        </div>
      </div>
    </div>
  )
}
