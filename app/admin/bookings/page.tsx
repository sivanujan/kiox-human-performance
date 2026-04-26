"use client";

import AdminBookingsPanel from "@/components/admin/AdminBookingsPanel";
import { motion } from "framer-motion";
import { Zap, ShieldAlert } from "lucide-react";

export default function AdminBookingsPage() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-white font-display text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <Zap className="text-[#22c55e]" size={36} /> Mission Control
          </h1>
          <p className="text-gray-400 font-label mt-2 text-xs md:text-sm tracking-[0.2em] uppercase">
            System Authority // Global Booking Oversight
          </p>
        </div>
        
        <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-2xl px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center text-black shadow-[0_0_15px_#22c55e]">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-white font-bold text-[10px] uppercase tracking-wider">Access Level</div>
            <div className="text-[#22c55e] font-black text-xs uppercase tracking-widest">Global Admin</div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AdminBookingsPanel />
      </motion.div>
      
      <div className="bg-[#111] border border-white/5 rounded-3xl p-8 border-dashed">
         <p className="text-gray-500 text-[10px] font-black uppercase tracking-[3px] text-center">
            System-wide deployment authority active. All actions are cryptographically signed.
         </p>
      </div>
    </div>
  );
}
