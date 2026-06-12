"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, User, Shield, Loader2, Target, Zap, Trash2, Settings2, X, CheckCircle2, ChevronDown } from "lucide-react";
import TacticalModal from "@/components/ui/TacticalModal";

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
      setError(null);
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
    if (!confirm("Are you sure you want to decommission this unit?")) return;
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
    <TacticalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Staff"
      subtitle="Staff Onboarding Protocol"
      loading={loading}
    >
      <div className="space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
             <X size={14} className="flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-text-secondary text-[9px] font-black uppercase tracking-[3px] ml-1">Given Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-accent-green/50" size={16} />
                <input
                  required
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="AGENT_FIRST"
                  className="w-full bg-bg-input border border-border-input rounded-2xl py-4 pl-14 pr-6 text-text-primary font-sans font-bold uppercase tracking-widest hover:border-border-active focus:border-accent-green outline-none transition-all placeholder:text-text-muted/65 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-text-secondary text-[9px] font-black uppercase tracking-[3px] ml-1">Surname</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-accent-green/50" size={16} />
                <input
                  required
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="AGENT_LAST"
                  className="w-full bg-bg-input border border-border-input rounded-2xl py-4 pl-14 pr-6 text-text-primary font-sans font-bold uppercase tracking-widest hover:border-border-active focus:border-accent-green outline-none transition-all placeholder:text-text-muted/65 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-text-secondary text-[9px] font-black uppercase tracking-[3px] ml-1">Tactical Communications</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-accent-green/50" size={16} />
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="AGENT_MAIL@KIOX.COM"
                className="w-full bg-bg-input border border-border-input rounded-2xl py-4 pl-14 pr-6 text-text-primary font-sans font-bold uppercase tracking-widest hover:border-border-active focus:border-accent-green outline-none transition-all placeholder:text-text-muted/65 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-text-secondary text-[9px] font-black uppercase tracking-[3px]">Unit Registry</label>
              <button 
                type="button"
                onClick={() => setIsManageMode(!isManageMode)}
                className="text-accent-green text-[8px] font-black uppercase tracking-[2px] hover:text-text-primary transition-colors flex items-center gap-1 active-scale"
              >
                <Settings2 size={10} /> {isManageMode ? "CLOSE" : "MANAGE"}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isManageMode ? (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="space-y-4 bg-bg-secondary border border-border-primary/50 rounded-2xl p-4 md:p-6"
                >
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 no-scrollbar">
                    {teams.map(team => (
                      <div key={team.id} className="flex justify-between items-center p-3 bg-bg-card rounded-xl border border-border-primary/40 group/unit">
                        <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">{team.name}</span>
                        <button 
                          type="button"
                          onClick={() => handleDeleteTeam(team.id)}
                          disabled={teamActionLoading}
                          className="text-red-500/40 hover:text-red-500 transition-colors disabled:opacity-30 active-scale"
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
                  className="flex flex-col sm:flex-row gap-2"
                >
                   <input
                    autoFocus
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    placeholder="UNIT_NAME"
                    className="flex-1 bg-bg-input border border-border-input hover:border-border-active focus:border-accent-green rounded-2xl py-4 px-6 text-text-primary font-sans font-bold uppercase tracking-widest outline-none text-sm animate-pulse"
                   />
                   <div className="flex gap-2">
                     <button 
                      type="button"
                      onClick={handleAddNewTeam}
                      disabled={teamActionLoading || !newTeamName}
                      className="flex-1 sm:flex-none px-6 py-4 bg-bg-button-primary text-text-on-green rounded-2xl hover:bg-accent-green-dim transition-all disabled:opacity-50 active-scale"
                     >
                       {teamActionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                     </button>
                     <button 
                      type="button"
                      onClick={() => setIsAddingNewTeam(false)}
                      className="flex-1 sm:flex-none px-6 py-4 bg-bg-secondary text-text-primary rounded-2xl hover:bg-bg-card-hover transition-all border border-border-primary active-scale"
                     >
                       <X size={18} />
                     </button>
                   </div>
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
                    className="w-full bg-bg-input border border-border-input hover:border-border-active rounded-2xl py-4 pr-14 pl-6 text-text-primary font-sans font-bold uppercase tracking-widest focus:border-accent-green outline-none transition-all appearance-none cursor-pointer text-sm no-custom-bg"
                  >
                    <option value="" disabled>SELECT UNIT...</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id} className="bg-bg-card text-text-primary">{team.name.toUpperCase()}</option>
                    ))}
                    <option value="ADD_NEW" className="bg-bg-secondary text-accent-green font-black">+ ADD NEW UNIT</option>
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-accent-green pointer-events-none" size={16} />
                </div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={loading || isManageMode || isAddingNewTeam}
            className="w-full py-5 bg-bg-button-primary text-text-on-green text-[10px] md:text-xs font-black uppercase tracking-[4px] md:tracking-[5px] rounded-2xl hover:bg-accent-green-dim transition-all flex items-center justify-center gap-4 group disabled:opacity-50 active-scale shadow-lg"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                INITIATE PROTOCOL <Target className="group-hover:scale-125 transition-transform shrink-0" size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </TacticalModal>
  );
}
