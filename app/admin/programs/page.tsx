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
  Users,
  Calendar,
  X,
  Edit2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";


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
    startDate: "",
    endDate: "",
    level: "Intermediate",
    category: "Speed & Agility",
    price: "",
    max_athletes: "",
    coach_id: "",
    weekly_commitment: 4,
    recovery_blocks: 3,
    session_time: "",
    syllabus: [] as { title: string; status: string; duration?: string }[],
    assigned_athletes: [] as string[]
  });
  const [staff, setStaff] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(CATEGORIES);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const getBannerGradient = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("strength")) {
      return "from-[#00ff88]/60 to-transparent";
    } else if (cat.includes("nutrition")) {
      return "from-teal-400/60 to-transparent";
    } else {
      // Speed, Goalkeeper, Elite, etc.
      return "from-amber-400/60 to-transparent";
    }
  };

  const getCategoryBadgeStyle = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("strength")) {
      return "bg-[#00ff88]/15 border-[#00ff88]/40 text-[#00ff88]";
    } else if (cat.includes("nutrition")) {
      return "bg-teal-500/15 border-teal-500/40 text-teal-400";
    } else if (cat.includes("psychology") || cat.includes("mindset")) {
      return "bg-purple-500/15 border-purple-500/40 text-purple-400";
    } else if (cat.includes("technique")) {
      return "bg-blue-500/15 border-blue-500/40 text-blue-400";
    } else {
      return "bg-amber-500/15 border-amber-500/40 text-amber-400";
    }
  };
  
  // Schedule Management
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<any | null>(null);
  const [programSchedule, setProgramSchedule] = useState<any[]>([]);
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 1,
    start_time: "10:00",
    title: "",
    duration_minutes: 60
  });

  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && (profile?.role === 'superadmin' || profile?.role === 'staff' || profile?.role === 'medical')) {
        fetchPrograms();
        fetchUsers();
      } else if (!user || profile) {
        // If auth is settled but user isn't superadmin or doesn't exist, stop loading
        setLoading(false);
      }
    }
  }, [user, profile, authLoading, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!data.error) {
        setStaff(data.filter((u: any) => u.role === 'staff' || u.role === 'superadmin' || u.role === 'medical'));
        setAthletes(data.filter((u: any) => u.role === 'athlete'));
      }
    } catch (error) {
      console.error("Users Fetch Error:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/admin/programs");
      const data = await res.json();
      if (!data.error) {
        setPrograms(data);
        const dbCategories = data.map((p: any) => p.category).filter(Boolean);
        const uniqueCats = Array.from(new Set([...CATEGORIES, ...dbCategories]));
        setDynamicCategories(uniqueCats);
      }
    } catch (error) {
      console.error("Program Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setBtnLoading(true);

    const programData = {
      ...newProgram,
      duration: newProgram.startDate && newProgram.endDate 
        ? `${new Date(newProgram.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(newProgram.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : "TBD",
      price: parseFloat(newProgram.price) || 0,
      max_athletes: parseInt(newProgram.max_athletes) || 0
    };

    const url = "/api/admin/programs";
    const method = editingId ? "PATCH" : "POST";
    const body = editingId ? { ...programData, id: editingId } : programData;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      setIsAdding(false);
      setEditingId(null);
      setIsCustomCategory(false);
      setCustomCategory("");
      setNewProgram({ title: "", description: "", startDate: "", endDate: "", level: "Intermediate", category: "Speed & Agility", price: "", max_athletes: "", coach_id: "", weekly_commitment: 4, recovery_blocks: 3, session_time: "", syllabus: [], assigned_athletes: [] });
      fetchPrograms();
    }
    setBtnLoading(false);
  };

  const handleEditClick = (program: any) => {
    let parsedStart = "";
    let parsedEnd = "";
    
    if (program.duration && program.duration.includes(" - ")) {
      try {
        const parts = program.duration.split(" - ");
        if (parts.length === 2) {
          const endDateStr = parts[1];
          const yearMatch = endDateStr.match(/\d{4}/);
          const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
          
          const startDateStr = `${parts[0]} ${year}`;
          const sDate = new Date(startDateStr);
          const eDate = new Date(endDateStr);
          
          if (!isNaN(sDate.getTime())) parsedStart = sDate.toISOString().split("T")[0];
          if (!isNaN(eDate.getTime())) parsedEnd = eDate.toISOString().split("T")[0];
        }
      } catch (e) {
        console.error("Failed to parse duration dates:", e);
      }
    }

    setEditingId(program.id);
    setNewProgram({
      title: program.title,
      description: program.description,
      startDate: parsedStart,
      endDate: parsedEnd,
      level: program.level,
      category: program.category,
      price: program.price.toString(),
      max_athletes: program.max_athletes.toString(),
      coach_id: program.coach_id || "",
      weekly_commitment: program.weekly_commitment || 4,
      recovery_blocks: program.recovery_blocks || 3,
      session_time: program.session_time || "",
      syllabus: program.syllabus || [],
      assigned_athletes: program.user_programs 
        ? program.user_programs.filter((up: any) => up.status === 'active').map((up: any) => up.user_id) 
        : []
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/programs?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchPrograms();
  };

  const fetchSchedule = async (programId: string) => {
    const res = await fetch(`/api/coach/program-schedule?programId=${programId}`);
    const data = await res.json();
    if (!data.error) setProgramSchedule(data);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/coach/program-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newSchedule, program_id: activeProgram.id })
    });
    if (res.ok) {
      setNewSchedule({ day_of_week: 1, start_time: "10:00", title: "", duration_minutes: 60 });
      fetchSchedule(activeProgram.id);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    const res = await fetch(`/api/coach/program-schedule?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchSchedule(activeProgram.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="text-[#22c55e] animate-spin" size={48} />
      </div>
    );
  }

  // Filter programs based on selected options and search text
  const filteredPrograms = programs
    .filter(program => profile?.role === 'superadmin' || profile?.role === 'medical' || program.coach_id === user?.id)
    .filter(program => {
      const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            program.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || program.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

  return (
    <main className="min-h-screen bg-[#080808] pt-[120px] pb-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="mb-6 border-b border-white/5 pb-4 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="text-[#22c55e]" size={16} />
              <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px]">Elite Catalog Management</span>
            </div>
            <div className="flex items-baseline gap-4">
              <h1 className={`font-display text-5xl md:text-7xl text-white uppercase tracking-wider`}>Architecture Matrix</h1>
              <span className="text-[11px] font-black text-white/50 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full uppercase tracking-widest leading-none">
                {filteredPrograms.length} {filteredPrograms.length === 1 ? "Program" : "Programs"}
              </span>
            </div>
          </div>
          {profile?.role !== 'medical' && (
            <button 
              onClick={() => {
                const nextAdding = !isAdding;
                setIsAdding(nextAdding);
                if (!nextAdding) {
                  setEditingId(null);
                  setIsCustomCategory(false);
                  setCustomCategory("");
                }
              }}
              className="px-8 py-4 bg-[#22c55e] text-black text-[11px] font-black uppercase tracking-[2px] rounded-xl flex items-center gap-2 hover:bg-[#4ade80] transition-all"
            >
              {isAdding ? "Cancel Matrix" : <><Plus size={18} /> New Architecture</>}
            </button>
          )}
        </div>

        {/* Search Input & Filter Dropdown */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00ff88] outline-none placeholder:text-white/20"
            />
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-48 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00ff88] outline-none uppercase font-bold tracking-wider text-[11px]"
            >
              <option value="all">All Categories</option>
              {dynamicCategories.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <form onSubmit={handleAddProgram} className="bg-[#111] border border-[#22c55e]/20 p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full mb-4">
                  <h2 className="text-[#22c55e] font-display text-2xl uppercase tracking-tighter">
                    {editingId ? "Modify Existing Architecture" : "Initialize New Architecture"}
                  </h2>
                </div>
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
                      {!isCustomCategory ? (
                        <select 
                          value={newProgram.category}
                          onChange={e => {
                            if (e.target.value === "__NEW__") {
                              setIsCustomCategory(true);
                              setNewProgram({...newProgram, category: ""});
                            } else {
                              setNewProgram({...newProgram, category: e.target.value});
                            }
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none uppercase font-bold"
                        >
                          {dynamicCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                          <option value="__NEW__" className="text-[#00ff88] font-bold">+ CREATE NEW CATEGORY...</option>
                        </select>
                      ) : (
                        <div className="relative flex items-center">
                          <input 
                            placeholder="Enter custom category..."
                            value={customCategory}
                            onChange={e => {
                              setCustomCategory(e.target.value);
                              setNewProgram({...newProgram, category: e.target.value});
                            }}
                            className="w-full bg-black/40 border border-[#00ff88]/30 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:border-[#00ff88] outline-none uppercase font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomCategory(false);
                              setCustomCategory("");
                              setNewProgram({...newProgram, category: dynamicCategories[0] || "Speed & Agility"});
                            }}
                            className="absolute right-3.5 text-gray-500 hover:text-white transition-colors"
                            title="Cancel custom category"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
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
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Start Date</label>
                      <input 
                        type="date"
                        required
                        value={newProgram.startDate}
                        onChange={e => setNewProgram({...newProgram, startDate: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">End Date</label>
                      <input 
                        type="date"
                        required
                        value={newProgram.endDate}
                        onChange={e => setNewProgram({...newProgram, endDate: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Daily Time</label>
                      <input 
                        type="time"
                        required
                        value={newProgram.session_time}
                        onChange={e => setNewProgram({...newProgram, session_time: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Weekly Commitment (Sessions)</label>
                      <input
                        required
                        type="number"
                        value={newProgram.weekly_commitment}
                        onChange={e => setNewProgram({...newProgram, weekly_commitment: parseInt(e.target.value) || 0})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Recovery Blocks (Units)</label>
                      <input
                        required
                        type="number"
                        value={newProgram.recovery_blocks}
                        onChange={e => setNewProgram({...newProgram, recovery_blocks: parseInt(e.target.value) || 0})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Assign Lead Coach</label>
                    <select 
                      required
                      value={newProgram.coach_id}
                      onChange={e => setNewProgram({...newProgram, coach_id: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none uppercase"
                    >
                      <option value="">Select Supervisor...</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name} (@{s.username})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-full">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[2px] block">Assign Athletes (Optional)</label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const allIds = athletes.map(a => a.id);
                          const allSelected = newProgram.assigned_athletes.length === allIds.length;
                          setNewProgram({...newProgram, assigned_athletes: allSelected ? [] : allIds});
                        }}
                        className="text-[9px] font-black text-white/50 hover:text-white uppercase tracking-wider transition-colors"
                      >
                        {newProgram.assigned_athletes.length === athletes.length && athletes.length > 0 ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 max-h-40 overflow-y-auto space-y-3">
                      {athletes.map(athlete => (
                        <label key={athlete.id} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => {
                          e.preventDefault();
                          const isSelected = newProgram.assigned_athletes.includes(athlete.id);
                          const updated = isSelected 
                            ? newProgram.assigned_athletes.filter(id => id !== athlete.id)
                            : [...newProgram.assigned_athletes, athlete.id];
                          setNewProgram({...newProgram, assigned_athletes: updated});
                        }}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${newProgram.assigned_athletes.includes(athlete.id) ? 'bg-[#22c55e] border-[#22c55e]' : 'border-white/20 group-hover:border-[#22c55e]/50'}`}>
                            {newProgram.assigned_athletes.includes(athlete.id) && <CheckCircle2 size={10} className="text-black" />}
                          </div>
                          <span className="text-sm text-white/80 uppercase group-hover:text-white transition-colors">{athlete.first_name} {athlete.last_name} <span className="text-white/40">(@{athlete.username || 'not_set'})</span></span>
                        </label>
                      ))}
                      {athletes.length === 0 && <span className="text-xs text-white/40 uppercase">No athletes found</span>}
                    </div>
                  </div>

                  <div className="col-span-full border-t border-white/5 pt-6 mt-2">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-black text-[#22c55e] uppercase tracking-[2px]">Program Syllabus / Phases</label>
                      <button 
                        type="button"
                        onClick={() => setNewProgram({...newProgram, syllabus: [...newProgram.syllabus, { title: "", status: "locked", duration: "" }]})}
                        className="text-[9px] font-black text-[#22c55e] border border-[#22c55e]/30 px-3 py-1 rounded-lg uppercase tracking-widest hover:bg-[#22c55e] hover:text-black transition-all"
                      >
                        + Add Phase
                      </button>
                    </div>
                    <div className="space-y-3">
                      {newProgram.syllabus.map((phase, idx) => (
                        <div key={idx} className="flex gap-3 items-center bg-black/20 p-3 rounded-xl border border-white/5 flex-wrap md:flex-nowrap">
                          <input 
                            placeholder="Phase Title (e.g. Initial Adaptation)"
                            value={phase.title}
                            onChange={e => {
                              const updated = [...newProgram.syllabus];
                              updated[idx].title = e.target.value;
                              setNewProgram({...newProgram, syllabus: updated});
                            }}
                            className="flex-1 min-w-[150px] bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#22c55e] outline-none"
                          />
                          <input 
                            placeholder="Duration (e.g. 4 Weeks)"
                            value={phase.duration || ""}
                            onChange={e => {
                              const updated = [...newProgram.syllabus];
                              updated[idx].duration = e.target.value;
                              setNewProgram({...newProgram, syllabus: updated});
                            }}
                            className="w-[120px] bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#22c55e] outline-none"
                          />
                          <select 
                            value={phase.status}
                            onChange={e => {
                              const updated = [...newProgram.syllabus];
                              updated[idx].status = e.target.value;
                              setNewProgram({...newProgram, syllabus: updated});
                            }}
                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[10px] text-white focus:border-[#22c55e] outline-none uppercase"
                          >
                            <option value="completed">Completed</option>
                            <option value="active">Active</option>
                            <option value="locked">Locked</option>
                          </select>
                          <button 
                            type="button"
                            onClick={() => {
                              const updated = [...newProgram.syllabus];
                              updated.splice(idx, 1);
                              setNewProgram({...newProgram, syllabus: updated});
                            }}
                            className="text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {newProgram.syllabus.length === 0 && (
                        <p className="text-[9px] text-white/20 uppercase tracking-widest text-center py-4 border border-dashed border-white/5 rounded-xl">No phases defined for this architecture.</p>
                      )}
                    </div>
                  </div>
                  <button 
                    disabled={btnLoading}
                    className="w-full py-4 bg-white text-black text-[11px] font-black uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-all disabled:opacity-50"
                  >
                    {btnLoading ? <Loader2 className="animate-spin" /> : <>{editingId ? <CheckCircle2 size={18} /> : <Plus size={18} />} {editingId ? "Update Architecture" : "Initialize Architecture"}</>}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {filteredPrograms.map((program, i) => (
            <motion.div 
              key={program.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111] border border-white/10 p-8 rounded-3xl hover:border-[#22c55e]/30 transition-all group relative overflow-hidden flex flex-col justify-between h-full"
            >
              {/* Colored Gradient Category Banner */}
              <div className={`absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r ${getBannerGradient(program.category)}`} />

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center">
                    <Package className="text-[#22c55e]" size={20} />
                  </div>
                  {profile?.role !== 'medical' && (profile?.role === 'superadmin' || program.coach_id === user?.id) && (
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleEditClick(program)}
                        className="text-gray-500 hover:text-[#22c55e] transition-colors"
                        title="Edit Architecture"
                      >
                        <Edit2 size={18} />
                      </button>
                        <button 
                          onClick={() => handleDelete(program.id)}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                          title="Delete Architecture"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest rounded ${getCategoryBadgeStyle(program.category)}`}>
                    {program.category}
                  </span>
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/50 text-[8px] font-black uppercase tracking-widest rounded">
                    {program.level}
                  </span>
                </div>

                <h3 className="text-2xl font-bold uppercase tracking-wider mb-2 text-white">{program.title}</h3>
                <p className="text-[12px] text-white/40 leading-relaxed mb-8 uppercase line-clamp-2">{program.description}</p>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-6">
                  <div className="flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.05] py-2 px-3 rounded-full">
                    <Clock className="text-[#00ff88]" size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-[1px] text-white/80 whitespace-nowrap overflow-hidden text-ellipsis">{program.duration}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.05] py-2 px-3 rounded-full">
                    <DollarSign className="text-[#00ff88]" size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-[1px] text-white/80 whitespace-nowrap overflow-hidden text-ellipsis">${program.price}.00</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.05] py-2 px-3 rounded-full">
                    <Users className="text-[#00ff88]" size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-[1px] text-white/80 whitespace-nowrap overflow-hidden text-ellipsis">{program.max_athletes} Max</span>
                  </div>
                </div>

                {(profile?.role === 'superadmin' || profile?.role === 'medical' || program.coach_id === user?.id) && (
                  <button 
                    onClick={() => {
                      setActiveProgram(program);
                      setIsScheduleModalOpen(true);
                      fetchSchedule(program.id);
                    }}
                    className="w-full mt-6 py-3 bg-transparent border border-[#00ff88] rounded-xl text-[9px] font-black text-[#00ff88] uppercase tracking-[3px] hover:bg-[#00ff88] hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar size={14} /> {profile?.role === 'medical' ? "View Schedule" : "Manage Schedule"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && activeProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setIsScheduleModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-[32px] p-10 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px] mb-2">Protocol Scheduling</h3>
                  <h2 className="text-3xl font-bold text-white uppercase tracking-tight">{activeProgram.title}</h2>
                </div>
                <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className={`grid grid-cols-1 ${profile?.role === 'medical' ? '' : 'lg:grid-cols-2'} gap-12`}>
                {/* New Entry Form */}
                {profile?.role !== 'medical' && (
                  <form onSubmit={handleAddSchedule} className="space-y-6">
                    <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[3px]">Add Recurring Session</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Day of Week</label>
                        <select 
                          value={newSchedule.day_of_week}
                          onChange={e => setNewSchedule({...newSchedule, day_of_week: parseInt(e.target.value)})}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                        >
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                            <option key={i} value={i}>{d.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Start Time</label>
                        <input 
                          type="time"
                          value={newSchedule.start_time}
                          onChange={e => setNewSchedule({...newSchedule, start_time: e.target.value})}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-[2px] mb-2 block">Session Title</label>
                      <input 
                        required
                        placeholder="e.g. Tactical Conditioning"
                        value={newSchedule.title}
                        onChange={e => setNewSchedule({...newSchedule, title: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#22c55e] outline-none"
                      />
                    </div>

                    <button className="w-full py-4 bg-[#22c55e] text-black text-[10px] font-black uppercase tracking-[2px] rounded-xl hover:bg-white transition-all">
                      Initialize Session
                    </button>
                  </form>
                )}

                {/* Existing Schedule */}
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[3px]">Architecture Sequence</h4>
                  <div className="space-y-3">
                    {programSchedule.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e] text-xs font-black">
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][s.day_of_week]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-wider">{s.title}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-[2px]">{s.start_time.substring(0, 5)} // {s.duration_minutes} MIN</p>
                          </div>
                        </div>
                        {profile?.role !== 'medical' && (
                          <button 
                            onClick={() => handleDeleteSchedule(s.id)}
                            className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    {programSchedule.length === 0 && (
                      <div className="py-12 text-center text-gray-700 font-black uppercase text-[10px] tracking-[3px] border-2 border-dashed border-white/5 rounded-3xl">
                        Sequence Null: No Sessions Defined
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
