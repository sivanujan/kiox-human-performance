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
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-[#111] border border-[#22c55e]/10 rounded-2xl overflow-hidden mb-4 transition-all hover:border-[#22c55e]/20">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full px-6 py-5 bg-transparent border-none flex justify-between items-center cursor-pointer transition-colors ${
          open ? 'border-b border-[#22c55e]/10' : ''
        }`}
      >
        <span className="text-[#22c55e] font-['Anton'] text-sm tracking-[0.2em] uppercase">
          {title}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-[#22c55e]"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
