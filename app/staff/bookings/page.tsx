"use client";

import AdminBookingsPanel from "@/components/admin/AdminBookingsPanel";
import { motion } from "framer-motion";
import { Calendar, ShieldCheck } from "lucide-react";

export default function StaffBookingsPage() {
  return (
    <div className="min-h-[calc(100vh-180px)] flex flex-col justify-between gap-10">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-white font-display text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                <Calendar className="text-[#22c55e]/80" size={28} /> Session Requests
              </h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e]/80 text-[11px] font-medium tracking-wide">
                <ShieldCheck size={13} className="text-[#22c55e]/70" />
                <span>Authorized Staff</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Manage and approve incoming session requests
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AdminBookingsPanel hideTitle={true} />
        </motion.div>
      </div>
      
      <div className="bg-[#111] border border-white/5 rounded-3xl p-6 border-dashed mt-auto">
         <p className="text-gray-500 text-[10px] font-medium tracking-wider text-center">
            All deployments are logged and monitored in the Tactical Performance Hub
         </p>
      </div>
    </div>
  );
}
