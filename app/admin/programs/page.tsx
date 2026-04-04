"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clipboard,
  Plus,
  Trash2,
  Package,
  Zap,
  Layers,
  Clock,
  DollarSign,
  Loader2,
  CheckCircle2,
  Users
} from "lucide-react";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

const CATEGORIES = ['Speed & Agility', 'Strength', 'Goalkeeper', 'Technique', 'Nutrition', 'Psychology', 'Full Program'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

export default function ArchitectureMatrix() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newProgram, setNewProgram] = useState({
    title: "",
    description: "",
    duration: "",
    level: "Intermediate",
    category: "Speed & Agility",
    price: "",
    max_athletes: ""
  });
  const [btnLoading, setBtnLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/signin");
      } else if (profile?.role !== 'superadmin') {
        router.push("/dashboard");
      } else {
        fetchPrograms();
      }
    }
  }, [user, profile, authLoading, router]);

  const fetchPrograms = async () => {
    const res = await fetch("/api/admin/programs");
    const data = await res.json();
    if (!data.error) setPrograms(data);
    setLoading(false);
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setBtnLoading(true);
    const res = await fetch("/api/admin/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newProgram,
        price: parseFloat(newProgram.price) || 0,
        max_athletes: parseInt(newProgram.max_athletes) || 0
      })
    });

    if (res.ok) {
      setIsAdding(false);
      setNewProgram({ title: "", description: "", duration: "", level: "Intermediate", category: "Speed & Agility", price: "", max_athletes: "" });
      fetchPrograms();
    }
    setBtnLoading(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/programs?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchPrograms();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="text-[#22c55e] animate-spin" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] pt-[120px] pb-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="text-[#22c55e]" size={16} />
              <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px]">Elite Catalog Management</span>
            </div>
            <h1 className={`${anton.className} text-5xl md:text-7xl text-white uppercase tracking-wider`}>Architecture Matrix</h1>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="px-8 py-4 bg-[#22c55e] text-black text-[11px] font-black uppercase tracking-[2px] rounded-xl flex items-center gap-2 hover:bg-[#4ade80] transition-all"
          >
            {isAdding ? "Cancel Matrix" : <><Plus size={18} /> New Architecture</>}
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <form onSubmit={handleAddProgram} className="bg-[#111] border border-[#22c55e]/20 p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Program Title</label>
                    <input 
                      required
                      value={newProgram.title}
                      onChange={e => setNewProgram({...newProgram, title: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Description</label>
                    <textarea 
                      required
                      value={newProgram.description}
                      onChange={e => setNewProgram({...newProgram, description: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none h-32"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Category</label>
                      <select 
                        value={newProgram.category}
                        onChange={e => setNewProgram({...newProgram, category: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none uppercase"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Difficulty Level</label>
                      <select 
                        value={newProgram.level}
                        onChange={e => setNewProgram({...newProgram, level: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none uppercase"
                      >
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Duration</label>
                      <input 
                        required
                        value={newProgram.duration}
                        onChange={e => setNewProgram({...newProgram, duration: e.target.value})}
                        placeholder="e.g. 12 Weeks"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Program Price ($)</label>
                      <input
                        required
                        type="number"
                        value={newProgram.price}
                        onChange={e => setNewProgram({...newProgram, price: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Max Athletes</label>
                      <input
                        required
                        type="number"
                        value={newProgram.max_athletes}
                        onChange={e => setNewProgram({...newProgram, max_athletes: e.target.value})}
                        placeholder="e.g. 20"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    disabled={btnLoading}
                    className="w-full py-4 bg-white text-black text-[11px] font-black uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-all disabled:opacity-50"
                  >
                    {btnLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Initialize Architecture</>}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((program, i) => (
            <motion.div 
              key={program.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111] border border-white/10 p-8 rounded-3xl hover:border-[#22c55e]/30 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center">
                  <Package className="text-[#22c55e]" size={20} />
                </div>
                <button 
                  onClick={() => handleDelete(program.id)}
                  className="text-white/20 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-[8px] font-black uppercase tracking-widest rounded">{program.category}</span>
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/50 text-[8px] font-black uppercase tracking-widest rounded">{program.level}</span>
              </div>

              <h3 className="text-2xl font-bold uppercase tracking-wider mb-2 text-white">{program.title}</h3>
              <p className="text-[12px] text-white/40 leading-relaxed mb-8 uppercase line-clamp-2">{program.description}</p>

              <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="text-[#22c55e]" size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[1px] text-white/60">{program.duration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="text-[#22c55e]" size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[1px] text-white/60">${program.price}.00</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="text-[#22c55e]" size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[1px] text-white/60">{program.max_athletes}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
