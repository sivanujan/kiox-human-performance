"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, X } from "lucide-react";
import { Anton } from "next/font/google";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

const faqs = [
  {
    question: "Where are you located?",
    answer: "We are based in Berlin, Germany and work with athletes worldwide across Europe, Australia and beyond."
  },
  {
    question: "Who is KIO-X for?",
    answer: "KIO-X is designed for serious athletes — from youth players to professional players in top leagues like Bundesliga, La Liga and Premier League."
  },
  {
    question: "What services do you offer?",
    answer: "We offer elite training programs including Legs & Speed, Goalkeeper training, Functional training, Technique refinement and Match Day preparation."
  },
  {
    question: "How do I get started?",
    answer: "Simply fill out our contact form or reach out via Instagram @kioyo.performance. We will assess your current level and create a personalized training plan for you."
  },
  {
    question: "Do you offer online training?",
    answer: "Yes! We work with athletes globally through both in-person sessions in Berlin and online remote coaching programs."
  },
  {
    question: "How much does it cost?",
    answer: "Pricing depends on your individual assessment and training requirements. Contact us to discuss a plan that fits your goals and budget."
  },
  {
    question: "Do you work with youth players?",
    answer: "Absolutely. We have dedicated programs for youth development including U12 and U13 age groups with our certified DFB Football-Base Trainer."
  },
  {
    question: "What languages do you coach in?",
    answer: "Our coaches are multilingual and work in German, French and English to support athletes from across Europe."
  },
];

const FAQItem = ({ faq, isOpen, toggle, index }: { faq: any, isOpen: boolean, toggle: () => void, index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="mb-3"
    >
      <div 
        onClick={toggle}
        className={`bg-[#111111] border-[1px] border-[rgba(34,197,94,0.15)] rounded-[12px] p-[20px_24px] cursor-pointer transition-all duration-300 group hover:border-l-[4px] hover:border-l-[#22c55e] ${isOpen ? 'border-[#22c55e30]' : ''}`}
      >
        <div className="flex justify-between items-center gap-4">
          <h4 className="text-white font-bold text-[15px] select-none">
            {faq.question}
          </h4>
          <div className="text-[#22c55e] flex-shrink-0 transition-transform duration-300">
            {isOpen ? (
              <motion.div initial={{ rotate: -90 }} animate={{ rotate: 0 }}><Minus size={18} /></motion.div>
            ) : (
              <motion.div initial={{ rotate: 90 }} animate={{ rotate: 0 }}><Plus size={18} /></motion.div>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-[rgba(34,197,94,0.1)]">
                <p className="text-[#888888] text-[14px] leading-[1.6] font-medium font-sans">
                  {faq.answer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function FAQModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden"
        >
          {/* Background Decor */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
            backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          {/* Close Area (Click to close outside) */}
          <div className="absolute inset-0 z-0 cursor-pointer" onClick={onClose} />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-[800px] max-h-[85vh] bg-[#080808] border border-[rgba(34,197,94,0.2)] rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[rgba(34,197,94,0.1)] bg-[#0A0A0A]">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-[1px] w-[20px] bg-gradient-to-r from-transparent to-[#22c55e]"></div>
                  <span className="text-[#22c55e] text-[10px] tracking-[0.4em] font-medium uppercase font-sans">SUPPORT</span>
                </div>
                <h2 className={`${anton.className} text-white text-[28px] sm:text-[32px] font-black leading-none uppercase tracking-tight`}>
                   FAQ <span className="text-[#22c55e]">& INFO</span>
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#22c55e] hover:bg-[#22c55e]/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable FAQ Accordion */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="w-full">
                {faqs.map((faq, index) => (
                  <FAQItem 
                    key={index}
                    faq={faq}
                    isOpen={openIndex === index}
                    toggle={() => toggle(index)}
                    index={index}
                  />
                ))}
              </div>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}
