"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Loader2, FileText, FolderOpen, Calendar, ShieldCheck, Lock, FlaskConical } from "lucide-react";
import CheckupList from "@/components/forms-protocols/CheckupList";
import FunctionalCheckupForm from "@/components/forms-protocols/FunctionalCheckupForm";
import DocumentLibrary from "@/components/forms-protocols/DocumentLibrary";
import SecureProtocolDownload from "@/components/forms-protocols/SecureProtocolDownload";
import DownloadSchedulesModal from "@/components/forms-protocols/DownloadSchedulesModal";
import PerformanceAssessmentReports from "@/components/forms-protocols/PerformanceAssessmentReports";
import VL4LabReports from "@/components/forms-protocols/VL4LabReports";

type ActiveTab = "checkups" | "documents" | "protocols" | "lab-reports";

export default function AdminFormsAndProtocolsPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("checkups");
  const [selectedCheckupId, setSelectedCheckupId] = useState<string | null>(null);
  const [checkupReadOnly, setCheckupReadOnly] = useState(false);
  const [isCreatingCheckup, setIsCreatingCheckup] = useState(false);
  const [isSchedulesModalOpen, setIsSchedulesModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!profile || !['superadmin', 'admin', 'staff', 'coach', 'medical'].includes(profile.role))) {
      router.push("/dashboard");
    }
  }, [profile, loading, router]);

  if (loading || !profile || !['superadmin', 'admin', 'staff', 'coach', 'medical'].includes(profile.role)) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[var(--accent-green)]" size={32} />
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest animate-pulse font-bold">
          Verifying Administrator Permissions...
        </span>
      </div>
    );
  }

  const handleSelectCheckup = (id: string, readOnly: boolean) => {
    setSelectedCheckupId(id);
    setCheckupReadOnly(readOnly);
    setIsCreatingCheckup(false);
  };

  const handleCreateNewCheckup = () => {
    setSelectedCheckupId(null);
    setCheckupReadOnly(false);
    setIsCreatingCheckup(true);
  };

  const handleCheckupSaved = () => {
    setSelectedCheckupId(null);
    setIsCreatingCheckup(false);
    setCheckupReadOnly(false);
  };

  const handleBackToList = () => {
    setSelectedCheckupId(null);
    setIsCreatingCheckup(false);
    setCheckupReadOnly(false);
  };

  const isCheckupFormActive = selectedCheckupId !== null || isCreatingCheckup;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 flex items-center justify-center text-[var(--accent-green)] shadow-[0_0_15px_rgba(34,197,94,0.05)]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-wider">
              Forms & Protocols
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest mt-0.5">
              Admin Assessments & Document Management
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        {!isCheckupFormActive && (
          <div className="flex p-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl w-full sm:w-auto">
            {/* Functional Check-up tab */}
            <button
              onClick={() => setActiveTab("checkups")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all active-scale ${
                activeTab === "checkups"
                  ? "bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 text-[var(--accent-green)] font-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
              }`}
            >
              <FileText size={14} />
              Check-Ups
            </button>

            {/* Lab Reports tab */}
            <button
              onClick={() => setActiveTab("lab-reports")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all active-scale ${
                activeTab === "lab-reports"
                  ? "bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 text-[var(--accent-green)] font-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
              }`}
            >
              <FlaskConical size={14} />
              Lab Reports
            </button>

            {/* Document Library tab */}
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all active-scale ${
                activeTab === "documents"
                  ? "bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 text-[var(--accent-green)] font-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
              }`}
            >
              <FolderOpen size={14} />
              Library
            </button>

            {/* Protocols tab */}
            <button
              onClick={() => setActiveTab("protocols")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all active-scale ${
                activeTab === "protocols"
                  ? "bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 text-[var(--accent-green)] font-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
              }`}
            >
              <Lock size={14} />
              Protocols
            </button>

            {/* Training schedules modal trigger */}
            <button
              onClick={() => setIsSchedulesModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent active-scale"
            >
              <Calendar size={14} />
              Schedules
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Panels */}
      {isCheckupFormActive ? (
        <FunctionalCheckupForm
          checkupId={selectedCheckupId}
          readOnly={checkupReadOnly}
          onBack={handleBackToList}
          onSaved={handleCheckupSaved}
        />
      ) : activeTab === "checkups" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2">
            <CheckupList
              onSelectCheckup={handleSelectCheckup}
              onCreateNew={handleCreateNewCheckup}
            />
          </div>
          <div className="xl:col-span-1">
            <PerformanceAssessmentReports />
          </div>
        </div>
      ) : activeTab === "lab-reports" ? (
        <VL4LabReports />
      ) : activeTab === "documents" ? (
        <DocumentLibrary />
      ) : (
        <SecureProtocolDownload />
      )}

      <DownloadSchedulesModal
        isOpen={isSchedulesModalOpen}
        onClose={() => setIsSchedulesModalOpen(false)}
        adminRedirectPath="/admin/curriculum"
      />
    </div>
  );
}
