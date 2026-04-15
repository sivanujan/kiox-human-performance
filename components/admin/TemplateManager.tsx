"use client";

import { useState, useEffect } from "react";
import { 
  Zap, 
  Trash2, 
  Plus, 
  Save, 
  Clock, 
  Calendar, 
  MapPin, 
  Users, 
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Anton } from "next/font/google";
import { format, startOfWeek, addDays } from "date-fns";

const anton = Anton({ weight: '400', subsets: ['latin'] });

export default function TemplateManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      if (!data.error) setTemplates(data);
    } catch (err) {
      console.error("Templates fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async () => {
    const newT = {
      title: "NEW OPS SESSION",
      day_of_week: 1,
      start_time: "10:00",
      duration_minutes: 60,
      session_type: "STRENGTH",
      max_capacity: 20,
      location: "HQ FIELD"
    };

    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newT)
      });
      const data = await res.json();
      if (!data.error) fetchTemplates();
    } catch (err) {
      console.error("Failed to add template:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/templates?id=${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  const handleSave = async (id: string, updates: any) => {
    setSaving(true);
    try {
      await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      setMsg({ text: "BLUEPRINT SYNCHRONIZED", type: 'success' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ text: "SYNC FAILED", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const generateNextWeek = async () => {
    setGenLoading(true);
    setMsg(null);
    try {
      // Find following Monday
      const nextMon = startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 });
      const res = await fetch('/api/admin/sessions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mondayDate: format(nextMon, 'yyyy-MM-dd') })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMsg({ text: `SUCCESS: ${data.count} SESSIONS DEPLOYED`, type: 'success' });
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setGenLoading(false);
    }
  };

  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

  if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin text-[#22c55e] mx-auto" size={32} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h3 className={`${anton.className} text-3xl text-white uppercase tracking-wider flex items-center gap-3`}>
               <Zap className="text-[#22c55e]" size={24} /> Operational Blueprint
            </h3>
            <p className="text-white/30 text-[9px] font-black uppercase tracking-[3px] mt-1">Define recurring weekly tactical operations</p>
         </div>

         <div className="flex gap-4">
            <button 
              onClick={generateNextWeek}
              disabled={genLoading}
              className="px-6 py-4 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-[10px] font-black uppercase tracking-[2px] rounded-xl hover:bg-[#22c55e] hover:text-black transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
            >
               {genLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
               DEPLOY NEXT WEEK
            </button>
            <button 
              onClick={handleAddTemplate}
              className="px-6 py-4 bg-white text-black text-[10px] font-black uppercase tracking-[2px] rounded-xl hover:bg-[#22c55e] transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
            >
               <Plus size={16} /> NEW MODULE
            </button>
         </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-[2px] flex items-center gap-3 border ${
          msg.type === 'success' ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
        }`}>
           {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
           {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {templates.map((t) => (
          <div key={t.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[24px] hover:border-[#22c55e]/30 transition-all group">
             <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 items-end">
                {/* Title */}
                <div className="col-span-1 lg:col-span-2 space-y-2">
                   <label className="text-white/20 text-[8px] font-black tracking-widest uppercase">Operational Title</label>
                   <input 
                     defaultValue={t.title}
                     onBlur={(e) => handleSave(t.id, { title: e.target.value })}
                     className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold uppercase focus:border-[#22c55e] outline-none"
                   />
                </div>

                {/* Day */}
                <div className="space-y-2">
                   <label className="text-white/20 text-[8px] font-black tracking-widest uppercase">Cycle Day</label>
                   <select 
                     value={t.day_of_week}
                     onChange={(e) => handleSave(t.id, { day_of_week: parseInt(e.target.value) })}
                     className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold uppercase focus:border-[#22c55e] outline-none cursor-pointer"
                   >
                      {days.map((d, i) => <option key={i} value={i} className="bg-[#111]">{d}</option>)}
                   </select>
                </div>

                {/* Time */}
                <div className="space-y-2">
                   <label className="text-white/20 text-[8px] font-black tracking-widest uppercase">Start Time</label>
                   <input 
                     type="time"
                     defaultValue={t.start_time.slice(0, 5)}
                     onBlur={(e) => handleSave(t.id, { start_time: e.target.value })}
                     className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold focus:border-[#22c55e] outline-none"
                     style={{ colorScheme: 'dark' }}
                   />
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                   <label className="text-white/20 text-[8px] font-black tracking-widest uppercase">Capacity</label>
                   <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" size={14} />
                      <input 
                        type="number"
                        defaultValue={t.max_capacity}
                        onBlur={(e) => handleSave(t.id, { max_capacity: parseInt(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white font-bold focus:border-[#22c55e] outline-none"
                      />
                   </div>
                </div>

                {/* Delete */}
                <div className="flex justify-end">
                   <button 
                     onClick={() => handleDelete(t.id)}
                     className="p-4 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                   >
                      <Trash2 size={18} />
                   </button>
                </div>
             </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="py-20 text-center text-white/10 uppercase font-black text-[10px] tracking-[4px] border border-dashed border-white/5 rounded-[32px]">
             No operational modules detected. Initialize blueprint.
          </div>
        )}
      </div>
    </div>
  );
}
