"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, Trash2, Download, FileText, Loader2, Filter, AlertTriangle, Upload, Eye, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

export default function DocumentLibrary() {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [documents, setDocuments] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [athleteFilter, setAthleteFilter] = useState("ALL");

  // Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("PERFORMANCE_REPORT");
  const [uploadAthleteId, setUploadAthleteId] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User details
  const isStaff = profile?.role === "superadmin" || profile?.role === "staff" || profile?.role === "medical";
  const canDelete = profile?.role === "superadmin";

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents_library")
        .select(`
          *,
          athlete:profiles!documents_library_athlete_id_fkey (
            first_name,
            last_name,
            username
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } fillLoadingState(false);
  };

  const fillLoadingState = (val: boolean) => {
    setLoading(val);
  };

  useEffect(() => {
    fetchDocuments();

    if (isStaff) {
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
    }
  }, [isStaff]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      // Auto pre-fill title if empty
      if (!uploadTitle) {
        const baseName = e.target.files[0].name.split(".").slice(0, -1).join(".");
        setUploadTitle(baseName);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    if (!uploadTitle.trim()) {
      alert("Please enter a title.");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload to storage
      const fileExt = selectedFile.name.split(".").pop();
      const folder = uploadAthleteId || "general";
      const fileName = `${Math.random().toString(36).substring(2, 9)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Insert into DB
      const { error: dbError } = await supabase
        .from("documents_library")
        .insert({
          title: uploadTitle.trim(),
          category: uploadCategory,
          athlete_id: uploadAthleteId || null,
          file_url: filePath,
          uploaded_by: user?.id,
          notes: uploadNotes.trim()
        });

      if (dbError) {
        // Cleanup storage file on DB error
        await supabase.storage.from("documents").remove([filePath]);
        throw dbError;
      }

      alert("Document uploaded successfully!");
      setShowUploadModal(false);
      
      // Reset form
      setUploadTitle("");
      setUploadCategory("PERFORMANCE_REPORT");
      setUploadAthleteId("");
      setUploadNotes("");
      setSelectedFile(null);
      
      fetchDocuments();
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(`Error uploading: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileUrl: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(fileUrl, 60); // 60 seconds expiration

      if (error) throw error;

      if (data?.signedUrl) {
        // Open in new tab for viewing / native browser download
        window.open(data.signedUrl, "_blank");
      }
    } catch (err: any) {
      console.error("Download error:", err);
      alert(`Error downloading: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this document?")) {
      return;
    }

    try {
      // 1. Delete DB record
      const { error: dbError } = await supabase.from("documents_library").delete().eq("id", id);
      if (dbError) throw dbError;

      // 2. Delete storage file
      const { error: storageError } = await supabase.storage.from("documents").remove([fileUrl]);
      if (storageError) {
        console.warn("Storage deletion warning:", storageError.message);
      }

      alert("Document deleted successfully.");
      fetchDocuments();
    } catch (err: any) {
      console.error("Delete document error:", err);
      alert(`Error deleting: ${err.message}`);
    }
  };

  // Filter & Search
  const filteredDocuments = documents.filter((doc) => {
    const docTitle = doc.title.toLowerCase();
    const athleteName = doc.athlete 
      ? `${doc.athlete.first_name} ${doc.athlete.last_name}`.toLowerCase()
      : "general";
    const matchesSearch = docTitle.includes(searchQuery.toLowerCase()) || athleteName.includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || doc.category === categoryFilter;
    const matchesAthlete = athleteFilter === "ALL" || doc.athlete_id === athleteFilter;

    return matchesSearch && matchesCategory && matchesAthlete;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "PERFORMANCE_REPORT":
        return "Performance Reports (VALD, Dashboards)";
      case "LAB_TEST":
        return "Lab Test Reports & Diagnostics";
      case "TRAINING_PROGRAM":
        return "Training Programs (Off-season, schedules)";
      case "PROTOCOL":
        return "Protocols & Guidelines";
      default:
        return cat;
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "PERFORMANCE_REPORT":
        return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
      case "LAB_TEST":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      case "TRAINING_PROGRAM":
        return "bg-purple-500/10 border-purple-500/20 text-purple-400";
      case "PROTOCOL":
        return "bg-[var(--accent-green)]/10 border-[var(--accent-green)]/20 text-[var(--accent-green)]";
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="space-y-5">
      {/* Controls: Search, Filter tabs, and Upload trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 rounded-2xl">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3 w-full">
          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents or athletes..."
              className="w-full text-xs pl-10 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] font-semibold"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full md:w-auto text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] cursor-pointer font-bold"
            >
              <option value="ALL">All Categories</option>
              <option value="PERFORMANCE_REPORT">Performance Reports (VALD)</option>
              <option value="LAB_TEST">Lab Tests / Diagnostics</option>
              <option value="TRAINING_PROGRAM">Training Programs</option>
              <option value="PROTOCOL">Protocols & Guidelines</option>
            </select>
          </div>

          {/* Athlete Dropdown Filter (Staff only) */}
          {isStaff && (
            <div className="w-full md:w-auto">
              <select
                value={athleteFilter}
                onChange={(e) => setAthleteFilter(e.target.value)}
                className="w-full md:w-auto text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] cursor-pointer font-bold"
              >
                <option value="ALL">All Athletes</option>
                <option value="general">General Documents (No Athlete)</option>
                {athletes.map((ath) => (
                  <option key={ath.id} value={ath.id}>
                    {ath.first_name} {ath.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Upload Button (Staff only) */}
        {isStaff && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full md:w-auto px-4 py-3 bg-[var(--accent-green)] text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[var(--accent-green)]/80 transition-all flex items-center justify-center gap-2 active-scale shadow-[0_0_15px_rgba(34,197,94,0.15)] shrink-0"
          >
            <Upload size={16} />
            Upload Document
          </button>
        )}
      </div>

      {/* Grid of Documents */}
      {loading ? (
        <div className="min-h-[250px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-[var(--accent-green)]" size={32} />
          <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest animate-pulse font-bold">
            Syncing file library...
          </span>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="min-h-[250px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle size={32} className="text-[var(--text-muted)] mb-2" />
          <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">
            No documents available
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-xs">
            No documents are available in this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const athleteName = doc.athlete 
              ? `${doc.athlete.first_name} ${doc.athlete.last_name}`
              : "General Protocol";

            return (
              <div
                key={doc.id}
                className="bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--accent-green)]/20 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all hover:-translate-y-0.5 group relative"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${getCategoryBadgeColor(
                        doc.category
                      )}`}
                    >
                      {doc.category.replace("_", " ")}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--text-muted)]">
                      {new Date(doc.created_at).toLocaleDateString("en-US")}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-[var(--text-primary)] tracking-wide line-clamp-1">
                    {doc.title}
                  </h3>

                  <div className="space-y-1">
                    <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Athlete
                    </div>
                    <div className="text-xs font-bold text-[var(--text-secondary)] truncate">
                      {athleteName}
                    </div>
                  </div>

                  {doc.notes && (
                    <div className="space-y-1 pt-1 border-t border-[var(--border-primary)]/40">
                      <p className="text-[10px] text-[var(--text-muted)] italic line-clamp-2">
                        {doc.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-primary)]/50">
                  <button
                    onClick={() => handleDownload(doc.file_url, doc.title)}
                    className="flex-1 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--accent-green)]/30 hover:bg-[var(--accent-green)]/5 text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl flex items-center justify-center gap-2 transition-all active-scale"
                  >
                    <Download size={12} className="text-[var(--accent-green)]" />
                    Download / View
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(doc.id, doc.file_url)}
                      className="p-2.5 border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/20 rounded-xl transition-all active-scale"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal (Staff only) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl p-6 relative space-y-4 animate-scaleUp">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-4 top-4 p-1.5 border border-[var(--border-primary)] hover:bg-[var(--bg-card-hover)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active-scale"
            >
              <X size={14} />
            </button>

            <div className="border-b border-[var(--border-primary)] pb-3">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider">
                Upload Document
              </h3>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest mt-0.5">
                KIO-X Secure Vault
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Select */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                  Select File (PDF, PNG, JPG) *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--border-input)] hover:border-[var(--accent-green)]/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[var(--bg-primary)]/40 hover:bg-[var(--bg-primary)]/80 flex flex-col items-center gap-2"
                >
                  <Upload size={24} className="text-[var(--accent-green)]" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {selectedFile ? selectedFile.name : "Click or drag file to select"}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "Maximum 50 MB"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., VALD Ankle Strength Test..."
                  className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] font-semibold"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] font-bold cursor-pointer"
                >
                  <option value="PERFORMANCE_REPORT">Performance Reports (VALD, Dashboards)</option>
                  <option value="LAB_TEST">Lab Test Reports & Diagnostics</option>
                  <option value="TRAINING_PROGRAM">Training Programs</option>
                  <option value="PROTOCOL">Protocols & Guidelines</option>
                </select>
              </div>

              {/* Athlete select (optional) */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                  Associated Athlete (Optional)
                </label>
                <select
                  value={uploadAthleteId}
                  onChange={(e) => setUploadAthleteId(e.target.value)}
                  className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] font-bold cursor-pointer"
                >
                  <option value="">-- General Document / No Athlete --</option>
                  {athletes.map((ath) => (
                    <option key={ath.id} value={ath.id}>
                      {ath.first_name} {ath.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                  Notes (Optional)
                </label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Document notes..."
                  className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-16 resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-3 border border-[var(--border-primary)] hover:bg-[var(--bg-card-hover)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold rounded-xl transition-all active-scale"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-[var(--accent-green)] text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[var(--accent-green)]/80 transition-all flex items-center justify-center gap-2 active-scale disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Complete Upload"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
