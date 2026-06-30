"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Trash2, Edit2, Eye, FileText, Loader2, Filter, AlertTriangle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

interface CheckupListProps {
  onSelectCheckup: (id: string, readOnly: boolean) => void;
  onCreateNew: () => void;
}

export default function CheckupList({ onSelectCheckup, onCreateNew }: CheckupListProps) {
  const { profile } = useAuth();
  const supabase = createClient();

  const [checkups, setCheckups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [athleteFilter, setAthleteFilter] = useState("ALL");
  
  const [athletes, setAthletes] = useState<any[]>([]);

  // Permissions
  const canCreate = profile?.role === "superadmin" || profile?.role === "medical";
  const canDelete = profile?.role === "superadmin";

  const fetchCheckups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("functional_checkups")
        .select(`
          id,
          therapist_name,
          checkup_date,
          status,
          athlete_id,
          athlete:profiles!functional_checkups_athlete_id_fkey (
            first_name,
            last_name,
            username
          )
        `)
        .order("checkup_date", { ascending: false });

      if (error) throw error;
      setCheckups(data || []);
    } catch (err) {
      console.error("Error fetching checkups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckups();

    // Fetch unique athletes from checkups list to populate filter
    const getAthletes = async () => {
      try {
        const res = await fetch("/api/admin/athletes");
        const data = await res.json();
        if (!data.error) setAthletes(data);
      } catch (e) {
        console.error(e);
      }
    };
    getAthletes();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this assessment form?")) {
      return;
    }

    try {
      const { error } = await supabase.from("functional_checkups").delete().eq("id", id);
      if (error) throw error;
      alert("Assessment form deleted.");
      fetchCheckups();
    } catch (err: any) {
      console.error("Delete checkup error:", err);
      alert(`Error deleting: ${err.message}`);
    }
  };

  // Filter & Search Logic
  const filteredCheckups = checkups.filter((item) => {
    const athleteName = item.athlete 
      ? `${item.athlete.first_name} ${item.athlete.last_name}`.toLowerCase()
      : "";
    const therapist = item.therapist_name.toLowerCase();
    const matchesSearch =
      athleteName.includes(searchQuery.toLowerCase()) ||
      therapist.includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesAthlete = athleteFilter === "ALL" || item.athlete_id === athleteFilter;

    return matchesSearch && matchesStatus && matchesAthlete;
  });

  return (
    <div className="space-y-5">
      {/* List Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 rounded-2xl">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full text-xs pl-10 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] transition-all font-semibold"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-[var(--text-muted)] hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] cursor-pointer font-bold"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
            </select>
          </div>

          {/* Athlete filter */}
          <div className="w-full sm:w-auto">
            <select
              value={athleteFilter}
              onChange={(e) => setAthleteFilter(e.target.value)}
              className="w-full sm:w-auto text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] cursor-pointer font-bold"
            >
              <option value="ALL">All Athletes</option>
              {athletes.map((ath) => (
                <option key={ath.id} value={ath.id}>
                  {ath.first_name} {ath.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={onCreateNew}
            className="w-full md:w-auto px-4 py-3 bg-[var(--accent-green)] text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[var(--accent-green)]/80 transition-all flex items-center justify-center gap-2 active-scale shadow-[0_0_15px_rgba(34,197,94,0.15)] shrink-0"
          >
            <Plus size={16} />
            New Assessment Form
          </button>
        )}
      </div>

      {/* Main List Display */}
      {loading ? (
        <div className="min-h-[200px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-[var(--accent-green)]" size={32} />
          <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest animate-pulse font-bold">
            Retrieving assessment reports...
          </span>
        </div>
      ) : filteredCheckups.length === 0 ? (
        <div className="min-h-[200px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle size={32} className="text-[var(--text-muted)] mb-2" />
          <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">
            No assessment reports found
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-xs">
            No check-ups have been recorded yet, or the search filters do not return any matches.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-primary)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest bg-[var(--bg-primary)]/30">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Athlete / Patient</th>
                <th className="px-6 py-4">Therapist</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]/40">
              {filteredCheckups.map((item) => {
                const athleteName = item.athlete 
                  ? `${item.athlete.first_name} ${item.athlete.last_name}`
                  : "Unknown Athlete";
                const isDraft = item.status === "DRAFT";

                return (
                  <tr
                    key={item.id}
                    className="text-xs group hover:bg-[var(--bg-card-hover)]/30 transition-all"
                  >
                    {/* Date */}
                    <td className="px-6 py-4 font-mono font-bold text-[var(--text-primary)]">
                      {item.checkup_date}
                    </td>

                    {/* Athlete Name */}
                    <td className="px-6 py-4 font-bold text-[var(--text-primary)]">
                      {athleteName}
                    </td>

                    {/* Therapist Name */}
                    <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">
                      {item.therapist_name}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          isDraft
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            : "bg-[var(--accent-green)]/10 border-[var(--accent-green)]/20 text-[var(--accent-green)]"
                        }`}
                      >
                        {isDraft ? "Draft" : "Submitted"}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Button */}
                        <button
                          onClick={() => onSelectCheckup(item.id, true)}
                          className="p-2 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] rounded-xl transition-all active-scale"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Edit Button (Medical & Admin only) */}
                        {((profile?.role === "medical" || profile?.role === "superadmin") && (isDraft || profile?.role === "superadmin")) && (
                          <button
                            onClick={() => onSelectCheckup(item.id, false)}
                            className="p-2 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-green)] hover:border-[var(--accent-green)]/30 rounded-xl transition-all active-scale"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}

                        {/* Delete Button (Admin only) */}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/30 rounded-xl transition-all active-scale"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
