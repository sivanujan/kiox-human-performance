"use client";

import React, { useState } from "react";
import { FileText, Download, Loader2, AlertTriangle, ShieldAlert } from "lucide-react";

export default function SecureProtocolDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch("/api/documents/protocol/download");
      if (!res.ok) {
        let errData;
        try {
          errData = await res.json();
        } catch {
          errData = { error: "Failed to download document" };
        }
        throw new Error(errData.error || `Error ${res.status}: Failed to download`);
      }

      // Read filename from Content-Disposition header
      const contentDisposition = res.headers.get("content-disposition");
      let filename = "KioX_GG_Sum26.pdf";
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download failed:", err);
      setError(err.message || "An unexpected error occurred during download.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl max-w-md mx-auto my-8 shadow-xl">
      {/* Confidential Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/40 border border-red-500/30 text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest mb-6">
        <ShieldAlert size={10} />
        Confidential
      </div>

      {/* File Icon with subtle gradient glow */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 flex items-center justify-center text-[var(--accent-green)] mb-5 shadow-[0_0_20px_rgba(34,197,94,0.05)]">
        <FileText size={32} />
      </div>

      {/* Document Information */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
          KIO-X Training Protocol 2026/2027 Season
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          Official coaching protocol for all KIO-X coaches. All coaches must follow this guideline.
        </p>
        <div className="inline-block px-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wide">
          17 pages • PDF • 8MB
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full py-3 bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all active-scale shadow-[0_4px_12px_rgba(34,197,94,0.15)] disabled:opacity-50"
      >
        {downloading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download size={14} />
            Download Protocol
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-[11px] text-red-400 w-full animate-shake">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
