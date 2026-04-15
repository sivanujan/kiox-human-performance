"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, User, Shield, Loader2, X, Target, Zap, Plus, Trash2, Settings2 } from "lucide-react";
import { Anton } from "next/font/google";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteStaffModal({ isOpen, onClose, onSuccess }: InviteStaffModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [isManageMode, setIsManageMode] = useState(false);
  const [isAddingNewTeam, setIsAddingNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [teamActionLoading, setTeamActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "staff",
    team_id: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen]);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      const data = await res.json();
      if (!data.error) setTeams(data);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  };

  const handleAddNewTeam = async () => {
    if (!newTeamName.trim()) return;
    setTeamActionLoading(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName })
      });
      const data = await res.json();
      if (!data.error) {
        await fetchTeams();
        setFormData({ ...formData, team_id: data.id });
        setIsAddingNewTeam(false);
        setNewTeamName("");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to sync new unit registry.");
    } finally {
      setTeamActionLoading(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to decommission this unit? All assigned personnel will be unassigned.")) return;
    setTeamActionLoading(true);
    try {
      const res = await fetch(`/api/admin/teams?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchTeams();
        if (formData.team_id === id) setFormData({ ...formData, team_id: "" });
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError("Deletion protocol failed.");
    } finally {
      setTeamActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({ email: "", first_name: "", last_name: "", role: "staff", team_id: "" });
      } else {
        setError(data.error || "Invitation failed. Please verify credentials.");
      }
    } catch (err) {
      setError("Tactical link failed. Network interruption detected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-xl bg-[#111] border border-[#22c55e]/30 rounded-[32px] p-10 shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-[#22c55e]">
              <Zap size={150} />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="text-[#22c55e]" size={16} />
                    <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[4px]">Staff Onboarding Protocol</span>
                  </div>
                  <h3 className={`${anton.className} text-4xl text-white uppercase tracking-wider`}>Invite Tactical Agent</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 bg-white/5 border border-white/10 rounded-full text-white/40 hover:text-white transition-all hover:rotate-90"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  <XCircleIcon size={14} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-3">
                    <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px] ml-1">Agent Given Name</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-[#22c55e]/40" size={16} />
                      <input
                        required
                        value={formData.first_name}
                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="FIRST_NAME"
                        className="w-full bg-black/40 border border-[#22c55e]/10 rounded-2xl py-5 pl-14 pr-6 text-white font-sans font-bold uppercase tracking-widest focus:border-[#22c55e] outline-none transition-all placeholder:text-white/10"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="space-y-3">
                    <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px] ml-1">Agent Surname</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-[#22c55e]/40" size={16} />
                      <input
                        required
                        value={formData.last_name}
                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="LAST_NAME"
                        className="w-full bg-black/40 border border-[#22c55e]/10 rounded-2xl py-5 pl-14 pr-6 text-white font-sans font-bold uppercase tracking-widest focus:border-[#22c55e] outline-none transition-all placeholder:text-white/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px] ml-1">Tactical Communication Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#22c55e]/40" size={16} />
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="AGENT_EMAIL@KIOX.COM"
                      className="w-full bg-black/40 border border-[#22c55e]/10 rounded-2xl py-5 pl-14 pr-6 text-white font-sans font-bold uppercase tracking-widest focus:border-[#22c55e] outline-none transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                {/* Unit Assignment */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-white/30 text-[9px] font-black uppercase tracking-[3px]">Unit Assignment</label>
                    <button 
                      type="button"
                      onClick={() => setIsManageMode(!isManageMode)}
                      className="text-[#22c55e] text-[8px] font-black uppercase tracking-[2px] hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Settings2 size={10} /> {isManageMode ? "CLOSE_REGISTRY" : "MANAGE_UNITS"}
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {isManageMode ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="space-y-4 bg-black/60 border border-[#22c55e]/20 rounded-2xl p-6"
                      >
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 scrollbar-hide">
                          {teams.map(team => (
                            <div key={team.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                              <span className="text-[10px] font-bold text-white uppercase tracking-widest">{team.name}</span>
                              <button 
                                type="button"
                                onClick={() => handleDeleteTeam(team.id)}
                                disabled={teamActionLoading}
                                className="text-red-500/40 hover:text-red-500 transition-colors disabled:opacity-30"
                              >
                                {teamActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : isAddingNewTeam ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex gap-2"
                      >
                         <input
                          autoFocus
                          value={newTeamName}
                          onChange={e => setNewTeamName(e.target.value)}
                          placeholder="NEW_UNIT_NAME"
                          className="flex-1 bg-black/40 border border-[#22c55e]/30 rounded-2xl py-5 px-6 text-white font-sans font-bold uppercase tracking-widest focus:border-[#22c55e] outline-none"
                         />
                         <button 
                          type="button"
                          onClick={handleAddNewTeam}
                          disabled={teamActionLoading}
                          className="px-6 bg-[#22c55e] text-black rounded-2xl hover:bg-white transition-all disabled:opacity-50"
                         >
                           {teamActionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2Icon size={18} />}
                         </button>
                         <button 
                          type="button"
                          onClick={() => setIsAddingNewTeam(false)}
                          className="px-6 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-all border border-white/10"
                         >
                           <X size={18} />
                         </button>
                      </motion.div>
                    ) : (
                      <div className="relative">
                        <select
                          required
                          value={formData.team_id}
                          onChange={e => {
                            if (e.target.value === "ADD_NEW") {
                              setIsAddingNewTeam(true);
                            } else {
                              setFormData({ ...formData, team_id: e.target.value });
                            }
                          }}
                          className="w-full bg-black/40 border border-[#22c55e]/10 rounded-2xl py-5 px-6 text-white font-sans font-bold uppercase tracking-widest focus:border-[#22c55e] outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled>SELECT UNIT...</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id} className="bg-[#111]">{team.name}</option>
                          ))}
                          <option value="ADD_NEW" className="bg-[#22c55e]/10 text-[#22c55e] font-black">+ CREATE NEW UNIT</option>
                        </select>
                        <ChevronDownIcon className="absolute right-6 top-1/2 -translate-y-1/2 text-[#22c55e]/40 pointer-events-none" size={16} />
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  disabled={loading || isManageMode || isAddingNewTeam}
                  className="w-full py-6 bg-[#22c55e] text-black text-xs font-black uppercase tracking-[5px] rounded-2xl hover:bg-white transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-4 group disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      INITIATE INVITATION <Target className="group-hover:scale-125 transition-transform" size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function XCircleIcon({ size }: { size: number }) {
  return <div className="text-red-500"><X size={size} /></div>;
}

function CheckCircle2Icon({ size }: { size: number }) {
  return <CheckCircle2 size={size} />;
}

import { CheckCircle2, ChevronDown as ChevronDownIcon } from "lucide-react";
