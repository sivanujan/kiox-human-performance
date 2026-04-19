"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface TacticalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  loading?: boolean;
}

export default function TacticalModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  maxWidth = "max-w-xl",
  loading = false
}: TacticalModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Background Grid - Desktop Only */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none hidden md:block" style={{ 
            backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          {/* Modal Container */}
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`relative z-10 w-full ${maxWidth} bg-[#080808] border-t md:border border-[rgba(34,197,94,0.2)] rounded-t-[32px] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[env(safe-area-inset-bottom)+90vh] pb-[env(safe-area-inset-bottom)]`}
          >
            {/* Header / Mobile Drag-handle */}
            <div className="md:hidden w-full flex justify-center py-3">
               <div className="w-12 h-1 bg-white/10 rounded-full" />
            </div>

            <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-br from-[#0A0A0A] to-black relative">
               <button 
                 onClick={onClose}
                 disabled={loading}
                 className="absolute top-6 right-6 md:top-8 md:right-8 text-gray-500 hover:text-white transition-colors disabled:opacity-50 active-scale"
               >
                 <X className="w-5 h-5 md:w-6 md:h-6" />
               </button>

                <div>
                  {subtitle && (
                    <div className="flex items-center gap-2 mb-1 text-[9px] md:text-[10px] font-black tracking-[3px] md:tracking-[4px] uppercase text-[#22c55e]">
                      {subtitle}
                    </div>
                  )}
                  <h2 className="font-display text-2xl md:text-3xl text-white uppercase tracking-wider">
                    {title}
                  </h2>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar md:scrollbar-hide">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
