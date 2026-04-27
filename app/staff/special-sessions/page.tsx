"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Plus, Users, Calendar, Clock, Send, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function SpecialSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    time: "10:00",
    capacity: 5,
    category: "TACTICAL",
    broadcast: true
  });

  useEffect(() => {
    fetchSpecialSessions();
  }, []);

  const fetchSpecialSessions = async () => {
    try {
      const res = await fetch('/api/athlete/bookings'); // We'll filter for is_special
      const data = await res.json();
      if (!data.error) {
        setSessions(data.filter((s: any) => s.is_special));
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/special-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setMsg({ text: "SPECIAL SESSION INITIALIZED & BROADCASTED", type: 'success' });
      setFormData({
        title: "",
        date: format(new Date(), 'yyyy-MM-dd'),
        time: "10:00",
        capacity: 5,
        category: "TACTICAL",
        broadcast: true
      });
      fetchSpecialSessions();
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-amber-500/10 rounded-xl">
                <Zap className="text-amber-500" size={20} />
             </div>
             <span className="text-[10px] font-black text-amber-500 uppercase tracking-[5px]">Elite Operations</span>
          </div>
          <h1 className="font-display text-6xl md:text-8xl text-white uppercase tracking-wider">
             Special Ops
          </h1>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-[4px] mt-6 leading-relaxed max-w-2xl">
             Deploy high-impact training windows and broadcast to the global matrix.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Creator Form */}
        <div className="lg:col-span-1">
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 sticky top-24">
            <h3 className="text-white font-display text-xl uppercase tracking-widest mb-8 flex items-center gap-3">
              <Plus className="text-amber-500" size={20} /> Initialize Session
            </h3>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Operation Title</label>
                <input 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-amber-500/50 outline-none transition-all font-bold tracking-wide"
                  placeholder="E.G. MIDNIGHT DRILLS"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-amber-500/50 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Time</label>
                  <input 
                    type="time"
                    required
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-amber-500/50 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Capacity</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-amber-500/50 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-amber-500/50 outline-none transition-all font-bold uppercase tracking-widest"
                  >
                    <option value="TACTICAL">TACTICAL</option>
                    <option value="STRENGTH">STRENGTH</option>
                    <option value="CONDITIONING">CONDITIONING</option>
                    <option value="RECOVERY">RECOVERY</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                <input 
                  type="checkbox"
                  checked={formData.broadcast}
                  onChange={e => setFormData({...formData, broadcast: e.target.checked})}
                  className="w-4 h-4 rounded border-white/10 accent-amber-500"
                />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Broadcast to all athletes</span>
              </div>

              <button 
                type="submit"
                disabled={isCreating}
                className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black uppercase tracking-[3px] text-[11px] transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(245,158,11,0.2)] active:scale-95 disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Deploy Operation
              </button>

              {msg && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl text-[9px] font-black uppercase tracking-[2px] text-center border ${
                    msg.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}
                >
                  {msg.text}
                </motion.div>
              )}
            </form>
          </div>
        </div>

        {/* Sessions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-gray-400 font-display text-sm uppercase tracking-[0.3em] flex items-center gap-3">
               <Calendar size={18} /> Active Deployments
             </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
          ) : sessions.length === 0 ? (
            <div className="p-12 border border-dashed border-white/5 rounded-[32px] text-center">
               <p className="text-white/20 text-[10px] font-black uppercase tracking-[3px]">No active special operations detected.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sessions.map((session) => (
                <motion.div 
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6"
                >
                  <div className="flex items-center gap-6 w-full">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center">
                       <span className="text-amber-500 text-[10px] font-black uppercase">{format(new Date(session.scheduled_date), 'EEE')}</span>
                       <span className="text-white text-xl font-display">{format(new Date(session.scheduled_date), 'dd')}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] font-black text-amber-500 uppercase tracking-widest">{session.session_type}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} /> {session.start_time.substring(0, 5)}
                        </span>
                      </div>
                      <h4 className="text-white font-display text-2xl uppercase tracking-wider">{session.title}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                     <div className="text-center">
                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">OPERATIONAL LOAD</div>
                        <div className="text-white font-display text-xl flex items-center justify-center gap-2">
                           <Users size={16} className="text-amber-500" />
                           {session.confirmed_count} / {session.max_capacity}
                        </div>
                     </div>
                     <button className="p-4 hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all rounded-2xl border border-transparent hover:border-red-500/20">
                        <Trash2 size={20} />
                     </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
