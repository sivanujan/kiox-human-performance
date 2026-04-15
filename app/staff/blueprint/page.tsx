"use client";

import { motion } from "framer-motion";
import { Zap, Monitor } from "lucide-react";
import { Anton } from "next/font/google";
import TemplateManager from "@/components/admin/TemplateManager";

const anton = Anton({ weight: '400', subsets: ['latin'] });

export default function BlueprintPage() {
  return (
    <div className="pt-10 pb-20 px-6 md:px-10 max-w-7xl mx-auto space-y-12 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ 
        backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', 
        backgroundSize: '40px 40px' 
      }} />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-[#22c55e]/10 rounded-xl">
                <Zap className="text-[#22c55e]" size={20} />
             </div>
             <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[5px]">Operational Logistics</span>
          </div>
          <h1 className={`${anton.className} text-6xl md:text-8xl text-white uppercase tracking-wider`}>
             Operational Blueprint
          </h1>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-[4px] mt-6 leading-relaxed max-w-2xl">
             Define master operational definitions and deploy the recurring weekly schedule across the KIO-X matrix.
          </p>
        </div>

        <div className="flex bg-[#111] border border-white/5 rounded-2xl p-6 items-center gap-4">
           <Monitor className="text-[#22c55e]" size={24} />
           <div>
              <div className="text-[9px] font-black text-white/30 uppercase tracking-[2px]">SYNC STATUS</div>
              <div className="text-[#22c55e] font-black text-xs uppercase tracking-widest">REALTIME_CONNECTED</div>
           </div>
        </div>
      </div>

      {/* Main Manager */}
      <div className="relative z-10 bg-[#111] border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl">
         <TemplateManager />
      </div>

      {/* Protocol Notice */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 opacity-40">
         <div className="p-8 border border-white/5 rounded-[32px] bg-white/[0.01]">
            <h4 className="text-white font-['Anton'] text-sm tracking-widest uppercase mb-4">Template Integrity</h4>
            <p className="text-[10px] text-white leading-relaxed uppercase tracking-widest">
               Modifying the blueprint affects all future deployments generated from those modules. Maintain operational standardisation.
            </p>
         </div>
         <div className="p-8 border border-white/5 rounded-[32px] bg-white/[0.01]">
            <h4 className="text-white font-['Anton'] text-sm tracking-widest uppercase mb-4">Deployment Sync</h4>
            <p className="text-[10px] text-white leading-relaxed uppercase tracking-widest">
               Generating sessions for next week will notify all athletes assigned to those specific tactical windows.
            </p>
         </div>
      </div>
    </div>
  );
}
