"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  Search, 
  User, 
  Shield, 
  MoreVertical,
  Circle,
  Plus,
  Loader2,
  Lock
} from "lucide-react";
import { Anton } from "next/font/google";

const anton = Anton({ weight: '400', subsets: ['latin'] });

export default function MessagesPage() {
  const { user, profile } = useAuth();

  return (
    <div className="h-[calc(100vh-80px)] flex bg-[#0d0d0d] overflow-hidden">
      {/* Sidebar: Conversations */}
      <div className="w-[320px] border-r border-white/5 bg-[#0a0a0a] flex flex-col">
         <div className="p-6 border-b border-white/5 space-y-4">
            <h2 className={`${anton.className} text-xl text-white uppercase tracking-wider`}>Comms Hub</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input 
                type="text" 
                placeholder="Search Protocol Leads" 
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-[10px] text-white focus:border-[#22c55e] outline-none transition-all placeholder:text-white/10 font-bold tracking-widest uppercase"
              />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto">
            {[
              { name: 'Performance Team', last: 'Protocol 4 initialized.', time: '2h', active: true, unread: 2 },
              { name: 'Biometric Lab', last: 'Symmetry markers ready.', time: '1d', unread: 0 },
              { name: 'Medical Staff', last: 'Registry approved.', time: '3d', unread: 0 },
            ].map((chat, i) => (
              <div key={i} className={`p-5 flex gap-4 cursor-pointer hover:bg-white/5 transition-all border-b border-white/5 ${chat.active ? 'bg-[#22c55e]/5' : ''}`}>
                 <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative shrink-0">
                    <User size={20} className="text-[#22c55e]" />
                    {chat.active && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#0a0a0a]" />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] font-black text-white uppercase tracking-[2px] truncate">{chat.name}</span>
                       <span className="text-[8px] font-bold text-white/20 uppercase">{chat.time}</span>
                    </div>
                    <p className="text-[10px] text-white/40 truncate uppercase font-medium">{chat.last}</p>
                 </div>
                 {chat.unread > 0 && (
                   <div className="w-4 h-4 rounded-full bg-[#22c55e] flex items-center justify-center translate-y-2">
                      <span className="text-[8px] font-black text-black">{chat.unread}</span>
                   </div>
                 )}
              </div>
            ))}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-[#0a0a0a]/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e] flex items-center justify-center text-[#22c55e]">
                 <Shield size={20} />
              </div>
              <div>
                 <h3 className="text-[11px] font-black text-white uppercase tracking-[3px]">Performance Team</h3>
                 <div className="flex items-center gap-2 text-[8px] font-black text-[#22c55e] uppercase">
                    <Circle size={6} fill="currentColor" className="animate-pulse" /> Live Support
                 </div>
              </div>
           </div>
           <button className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all">
              <MoreVertical size={20} />
           </button>
        </div>

        {/* Messages Placeholder */}
        <div className="flex-1 p-10 flex flex-col items-center justify-center text-center opacity-20">
           <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
              <Lock size={32} />
           </div>
           <h3 className={`${anton.className} text-2xl uppercase tracking-wider mb-2 text-white`}>Encrypted Channel</h3>
           <p className="text-sm uppercase tracking-widest max-w-xs font-semibold">
              Performance communications are end-to-end encrypted. Protocol history is building...
           </p>
        </div>

        {/* Input Bar */}
        <div className="p-6 border-t border-white/5 bg-[#0a0a0a]/50">
           <div className="relative flex gap-4">
              <button className="p-4 bg-white/5 rounded-xl border border-white/10 text-white/20 hover:text-[#22c55e] transition-all">
                 <Plus size={20} />
              </button>
              <input 
                disabled
                type="text" 
                placeholder="Message locked until initialization complete..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-10 py-4 text-xs text-white/30 italic outline-none transition-all placeholder:text-white/10"
              />
              <button disabled className="p-4 bg-[#22c55e]/20 rounded-xl border border-[#22c55e]/10 text-black/30">
                 <Send size={20} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
