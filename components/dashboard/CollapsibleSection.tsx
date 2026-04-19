'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-[#111] border border-[#22c55e]/10 rounded-2xl overflow-hidden mb-4 transition-all hover:border-[#22c55e]/20 group/collapsible">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full px-5 py-4 md:px-6 md:py-5 bg-transparent border-none flex justify-between items-center cursor-pointer transition-colors active-scale min-h-[52px] ${
          open ? 'border-b border-[#22c55e]/10 bg-white/[0.01]' : 'hover:bg-white/[0.02]'
        }`}
      >
        <span className="text-[#22c55e] font-display text-[11px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase truncate pr-4">
          {title}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'circOut' }}
          className="text-[#22c55e]/60 group-hover/collapsible:text-[#22c55e] shrink-0"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 md:p-6 lg:p-8 bg-black/20">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
