'use client'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

interface CardData {
  label: string
  value: string | number
  icon: string
  color: string
  stars?: number
}

interface SwipeableCardsProps {
  cards: CardData[]
}

export default function SwipeableCards({ cards }: SwipeableCardsProps) {
  return (
    <div className="overflow-x-auto pb-6 scrollbar-hide -mx-2 px-2 md:-mx-0 md:px-0">
      <div className="flex gap-4 min-w-max">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="w-[200px] h-[130px] bg-[#111] border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between group cursor-default"
          >
            {/* Background Icon */}
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity">
              {card.icon}
            </div>

            <div>
              <div className="text-[10px] font-bold text-gray-400 tracking-[2px] uppercase mb-3">
                {card.label}
              </div>
              <div 
                className="text-2xl font-display tracking-wider"
                style={{ color: card.color, textShadow: `0 0 20px ${card.color}40` }}
              >
                {card.value}
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
               {card.stars !== undefined && (
                 <div className="flex gap-1">
                   {[...Array(5)].map((_, idx) => (
                     <Star 
                       key={idx} 
                       size={10} 
                       fill={idx < card.stars! ? card.color : 'transparent'} 
                       className={idx < card.stars! ? '' : 'text-gray-700'}
                     />
                   ))}
                 </div>
               )}
               <span className="text-lg ml-auto">{card.icon}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
