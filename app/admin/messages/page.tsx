"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Search, 
  User, 
  MoreVertical, 
  Send, 
  Shield, 
  Clock, 
  Check, 
  CheckCheck,
  Zap,
  Activity,
  Loader2
} from "lucide-react";
import { Anton } from "next/font/google";
import { useAuth } from "@/components/providers/AuthProvider";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

export default function AdminMessages() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && user && profile?.role === 'superadmin') {
      setLoading(false);
    }
  }, [user, profile, authLoading]);

  const mockChats = [
    { id: 1, name: 'Thanarasan Sivanujan', role: 'Athlete', lastMsg: 'I have completed the speed phase.', time: 'Just now', status: 'active' },
    { id: 2, name: 'Coach Alex', role: 'Staff', lastMsg: 'Schedules updated for week 4.', time: '14m ago', status: 'away' },
    { id: 3, name: 'Thing Today', role: 'Athlete', lastMsg: 'Need to reschedule my lab test.', time: '2h ago', status: 'active' },
    { id: 4, name: 'System Monitor', role: 'Global', lastMsg: 'New registration request received.', time: '5h ago', status: 'system' },
  ];

  if (loading) {
     return (
       <div className="flex items-center justify-center p-20">
         <Loader2 className="text-[#22c55e] animate-spin" size={48} />
       </div>
     );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Sidebar: Conversation List */}
      <aside className="w-[380px] flex flex-col bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 space-y-4">
           <div className="flex items-center justify-between">
              <h2 className={`${anton.className} text-white text-xl tracking-wider uppercase`}>Communications</h2>
              <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e]">
                 <MessageSquare size={16} />
              </div>
           </div>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                 placeholder="Search Protocols..."
                 className="w-full bg-black border border-white/5 rounded-xl pl-12 pr-4 py-3 text-xs text-white outline-none focus:border-[#22c55e]/30 font-bold uppercase tracking-widest placeholder:text-white/10"
              />
           </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-4 space-y-2">
           {mockChats.map((chat) => (
              <motion.div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-center gap-4 group ${
                  selectedChat?.id === chat.id 
                    ? 'bg-[#22c55e]/10 border-[#22c55e]/20' 
                    : 'bg-white/[0.02] border-transparent hover:bg-white/[0.04]'
                }`}
              >
                <div className="relative">
                   <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center">
                      <User size={20} className={selectedChat?.id === chat.id ? 'text-[#22c55e]' : 'text-white/20'} />
                   </div>
                   <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#111] ${
                      chat.status === 'active' ? 'bg-[#22c55e]' : 
                      chat.status === 'away' ? 'bg-amber-500' : 'bg-blue-500'
                   }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start mb-0.5">
                      <p className="text-sm font-bold text-white uppercase tracking-wide truncate">{chat.name}</p>
                      <span className="text-[9px] font-black text-white/10 uppercase">{chat.time}</span>
                   </div>
                   <p className="text-[10px] text-white/30 truncate uppercase font-medium">{chat.lastMsg}</p>
                </div>
              </motion.div>
           ))}
        </div>
      </aside>

      {/* Main: Message Window */}
      <main className="flex-1 bg-[#111] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
         {selectedChat ? (
            <>
               {/* Chat Header */}
               <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center">
                        <User size={24} className="text-[#22c55e]" />
                     </div>
                     <div>
                        <h3 className={`${anton.className} text-xl text-white tracking-widest uppercase`}>{selectedChat.name}</h3>
                        <p className="text-[11px] font-black text-[#555] uppercase tracking-[2px]">{selectedChat.role} • Active Sync</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-[2px]">View Profile</div>
                     <button className="text-white/20 hover:text-[#22c55e] transition-colors"><MoreVertical size={20} /></button>
                  </div>
               </div>

               {/* Chat Bubbles */}
               <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                  <div className="flex flex-col items-center mb-12">
                     <span className="px-4 py-1.5 bg-white/5 rounded-full text-[9px] font-black text-white/20 uppercase tracking-[3px]">Secure Command Channel Encrypted</span>
                  </div>

                  <div className="flex gap-4 max-w-[80%]">
                     <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><User size={14} className="text-white/20" /></div>
                     <div className="bg-white/5 border border-white/10 p-5 rounded-2xl rounded-tl-none">
                        <p className="text-sm text-white/60 leading-relaxed uppercase tracking-wide font-medium">Platform status nominal. All biometrics synchronized for the next 24 hour deployment window.</p>
                        <p className="text-[9px] font-black text-white/10 mt-3 uppercase tracking-widest">10:42 AM • VERIFIED</p>
                     </div>
                  </div>

                  <div className="flex gap-4 max-w-[80%] ml-auto flex-row-reverse text-right">
                     <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center shrink-0"><Shield size={14} className="text-[#22c55e]" /></div>
                     <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 p-5 rounded-2xl rounded-tr-none">
                        <p className="text-sm text-[#22c55e] leading-relaxed uppercase tracking-wide font-medium">Understood. Proceed with the scheduled VO2 max evaluation milestone at 14:00 hours.</p>
                        <div className="flex items-center justify-end gap-2 mt-3 text-[9px] font-black text-[#22c55e]/40 uppercase tracking-widest">
                           10:45 AM • SENT <CheckCheck size={10} />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Message Input */}
               <div className="p-8 border-t border-white/5 bg-black/20">
                  <div className="relative">
                     <input 
                        placeholder="Secure command input..."
                        className="w-full bg-[#111] border border-white/10 rounded-2xl pl-6 pr-16 py-5 text-sm text-white outline-none focus:border-[#22c55e] transition-all font-sans font-bold uppercase tracking-widest placeholder:text-white/10"
                     />
                     <button className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-[#22c55e] text-black flex items-center justify-center hover:bg-white transition-all">
                        <Send size={20} />
                     </button>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-[9px] font-black text-white/10 uppercase tracking-[2px]">
                     <span className="flex items-center gap-2"><Zap size={10} className="text-[#f59e0b]" /> High Speed Protocol</span>
                     <span className="flex items-center gap-2"><Shield size={10} className="text-[#22c55e]" /> Elite Auth Level</span>
                  </div>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
               <div className="w-24 h-24 rounded-3xl border border-dashed border-white/50 flex items-center justify-center mb-6">
                  <MessageSquare size={48} className="text-white" />
               </div>
               <h3 className={`${anton.className} text-3xl text-white tracking-[0.2em] uppercase mb-2`}>Intel Hub</h3>
               <p className="text-xs font-black text-white uppercase tracking-[4px]">Select an active protocol for briefing</p>
            </div>
         )}
      </main>
    </div>
  );
}
