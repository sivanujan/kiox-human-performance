"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Loader2, FolderOpen, Calendar, ShieldCheck } from "lucide-react";
import DocumentLibrary from "@/components/forms-protocols/DocumentLibrary";

export default function AthleteFormsAndProtocolsPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only 'athlete' can access this page (parents have no access, staff should go to staff page)
    if (!loading) {
      if (!profile) {
        router.push("/signin");
      } else if (profile.role !== "athlete") {
        if (profile.role === "superadmin" || profile.role === "staff" || profile.role === "medical") {
          router.push("/staff/forms-protocols");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [profile, loading, router]);

  if (loading || !profile || profile.role !== "athlete") {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[var(--accent-green)]" size={32} />
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest animate-pulse font-bold font-sans">
          Loading files...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 flex items-center justify-center text-[var(--accent-green)] shadow-[0_0_15px_rgba(34,197,94,0.05)]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-wider">
              My Documents
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest mt-0.5">
              Performance Diagnostics, Lab Tests & Guidelines
            </p>
          </div>
        </div>

        {/* Training schedules redirect button */}
        <button
          onClick={() => router.push("/dashboard/curriculum")}
          className="w-full sm:w-auto px-4 py-2.5 border border-[var(--border-primary)] hover:border-[var(--accent-green)]/30 hover:bg-[var(--accent-green)]/5 text-xs text-[var(--text-primary)] font-bold rounded-xl flex items-center justify-center gap-2 transition-all active-scale"
        >
          <Calendar size={14} className="text-[var(--accent-green)]" />
          View Training Plans →
        </button>
      </div>

      {/* Main Document Library */}
      <DocumentLibrary />
    </div>
  );
}
