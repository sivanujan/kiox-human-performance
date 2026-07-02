"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  FileText, 
  Loader2, 
  User, 
  Calendar, 
  Download, 
  AlertCircle, 
  CheckCircle2 
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// HOTSPOTS mapping for Body Map on Page 2
const HOTSPOTS = [
  { id: "neck_front", label: "Neck", x: 100, y: 80, side: "FRONT", zone: "Neck" },
  { id: "shoulder_l_front", label: "L Shoulder", x: 65, y: 110, side: "FRONT", zone: "Shoulder" },
  { id: "shoulder_r_front", label: "R Shoulder", x: 135, y: 110, side: "FRONT", zone: "Shoulder" },
  { id: "chest_front", label: "Chest", x: 100, y: 130, side: "FRONT", zone: "Back" },
  { id: "hip_l_front", label: "L Hip", x: 75, y: 190, side: "FRONT", zone: "Hip" },
  { id: "hip_r_front", label: "R Hip", x: 125, y: 190, side: "FRONT", zone: "Hip" },
  { id: "groin_front", label: "Groin", x: 100, y: 200, side: "FRONT", zone: "Groin" },
  { id: "knee_l_front", label: "L Knee", x: 80, y: 280, side: "FRONT", zone: "Knee" },
  { id: "knee_r_front", label: "R Knee", x: 120, y: 280, side: "FRONT", zone: "Knee" },
  { id: "ankle_l_front", label: "L Ankle", x: 80, y: 350, side: "FRONT", zone: "Ankle" },
  { id: "ankle_r_front", label: "R Ankle", x: 120, y: 350, side: "FRONT", zone: "Ankle" },
  { id: "toe_l_front", label: "L Toe", x: 75, y: 380, side: "FRONT", zone: "Toe" },
  { id: "toe_r_front", label: "R Toe", x: 125, y: 380, side: "FRONT", zone: "Toe" },
  { id: "balance_front", label: "Core/Balance", x: 100, y: 160, side: "FRONT", zone: "Balance" },
  { id: "neck_back", label: "Neck", x: 300, y: 80, side: "BACK", zone: "Neck" },
  { id: "shoulder_l_back", label: "L Shoulder", x: 265, y: 110, side: "BACK", zone: "Shoulder" },
  { id: "shoulder_r_back", label: "R Shoulder", x: 335, y: 110, side: "BACK", zone: "Shoulder" },
  { id: "back_upper", label: "Upper Back", x: 300, y: 130, side: "BACK", zone: "Back" },
  { id: "back_lower", label: "Lower Back", x: 300, y: 170, side: "BACK", zone: "Back" },
  { id: "hamstring_l_back", label: "L Hamstring", x: 280, y: 245, side: "BACK", zone: "Hamstring" },
  { id: "hamstring_r_back", label: "R Hamstring", x: 320, y: 245, side: "BACK", zone: "Hamstring" },
  { id: "knee_l_back", label: "L Knee Back", x: 280, y: 280, side: "BACK", zone: "Knee" },
  { id: "knee_r_back", label: "R Knee Back", x: 320, y: 280, side: "BACK", zone: "Knee" },
  { id: "ankle_l_back", label: "L Ankle Back", x: 280, y: 350, side: "BACK", zone: "Ankle" },
  { id: "ankle_r_back", label: "R Ankle Back", x: 320, y: 350, side: "BACK", zone: "Ankle" }
];

interface AthleteProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

export interface AssessmentRecord {
  id: string;
  assessment_date: string;
  assessment_type: string;
  status: string;
  performance_score?: number;
  mobility_score?: number;
  symmetry_score?: number;
  risk_score?: number;
  [key: string]: any;
}

export default function PerformanceAssessmentReports() {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);

  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Role permissions
  const isAdminOrStaff = profile?.role === "superadmin" || profile?.role === "staff";
  const isCoachOrMedical = profile?.role === "coach" || profile?.role === "medical";

  // Fetch athletes based on role based access control (RBAC)
  useEffect(() => {
    const fetchAthletes = async () => {
      setLoadingAthletes(true);
      try {
        if (isAdminOrStaff) {
          // Admin/Staff: fetch all athletes
          const res = await fetch("/api/admin/athletes");
          if (res.ok) {
            const data = await res.json();
            setAthletes(data || []);
          }
        } else if (isCoachOrMedical) {
          // Coach/Medical: fetch all enrollments and filter for their own assigned program athletes
          const [athRes, enrollRes] = await Promise.all([
            fetch("/api/admin/athletes"),
            fetch("/api/admin/enrollments")
          ]);
          
          if (athRes.ok && enrollRes.ok) {
            const allAthletes = await athRes.json();
            const enrollments = await enrollRes.json();
            
            // Filter enrollments where this coach is assigned
            const myEnrolledUserIds = enrollments
              .filter((e: any) => e.status === "active" && e.program?.coach_id === user?.id)
              .map((e: any) => e.user_id);
            
            const filtered = allAthletes.filter((a: any) => myEnrolledUserIds.includes(a.id));
            setAthletes(filtered || []);
          }
        }
      } catch (err) {
        console.error("Error loading athletes for reports:", err);
      } finally {
        setLoadingAthletes(false);
      }
    };

    if (profile?.role) {
      fetchAthletes();
    }
  }, [profile, user]);

  // Fetch assessments for selected athlete
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!selectedAthleteId) {
        setAssessments([]);
        setSelectedAssessmentId("");
        setSelectedAssessment(null);
        return;
      }
      setLoadingAssessments(true);
      try {
        const res = await fetch(`/api/admin/athlete/${selectedAthleteId}/assessments`);
        if (res.ok) {
          const data = await res.json();
          // Filter out drafts unless admin/staff
          const filtered = isAdminOrStaff 
            ? (data.assessments || [])
            : (data.assessments || []).filter((a: any) => a.status === "SUBMITTED");
          
          setAssessments(filtered);
          if (filtered.length > 0) {
            setSelectedAssessmentId(filtered[0].id);
            setSelectedAssessment(filtered[0]);
          } else {
            setSelectedAssessmentId("");
            setSelectedAssessment(null);
          }
        }
      } catch (err) {
        console.error("Error fetching athlete assessments:", err);
      } finally {
        setLoadingAssessments(false);
      }
    };

    fetchAssessments();
  }, [selectedAthleteId]);

  const handleAssessmentChange = (id: string) => {
    setSelectedAssessmentId(id);
    const found = assessments.find(a => a.id === id) || null;
    setSelectedAssessment(found);
  };

  const generatePDFReport = async () => {
    if (!selectedAssessment) return;
    setGeneratingPdf(true);
    setPdfSuccess(false);

    const athlete = athletes.find(a => a.id === selectedAthleteId);
    const athleteName = athlete
      ? `${athlete.first_name || ""} ${athlete.last_name || ""}`.trim() || "Athlete"
      : "Athlete";
    const avatarUrl = athlete?.avatar_url || "";

    try {
      // Dynamically load html2canvas + jsPDF from CDN
      const loadScript = (src: string): Promise<void> =>
        new Promise((res, rej) => {
          if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
          const s = document.createElement("script");
          s.src = src;
          s.onload = () => res();
          s.onerror = rej;
          document.head.appendChild(s);
        });

      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

      const h2c = (window as any).html2canvas;
      const { jsPDF } = (window as any).jspdf;

      // Build the HTML and inject into a hidden off-screen container
      const htmlContent = buildReportHtml(athleteName, avatarUrl, selectedAssessment);

      // ── Extract the <style> block from the <head> BEFORE stripping it ──
      // The .replace below would delete our entire .page{padding} stylesheet
      // if we didn't pull it out first.
      const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/i);
      const preservedStyle = styleMatch ? `<style>${styleMatch[1]}</style>` : "";

      // Strip html/head/body wrappers, but keep the extracted style.
      // Also remove <script> tags so downloadPDF() doesn't auto-fire.
      const bodyContent = htmlContent
        .replace(/[\s\S]*<body[^>]*>/i, "")
        .replace(/<\/body>[\s\S]*/i, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");

      const container = document.createElement("div");
      // Container matches the exact page width so nothing clips on the right
      container.style.cssText = `
        position: fixed;
        top: -99999px;
        left: -99999px;
        width: 794px;
        z-index: -1;
        background: #080d08;
        pointer-events: none;
        box-sizing: border-box;
      `;
      // Inject preserved stylesheet first, then the body page divs
      container.innerHTML = preservedStyle + bodyContent;
      document.body.appendChild(container);

      // Wait for fonts + backgrounds to render
      await new Promise(r => setTimeout(r, 1200));

      const pages = Array.from(container.querySelectorAll(".page")) as HTMLElement[];
      const pdf = new jsPDF({ unit: "px", format: [794, 1123], orientation: "portrait", hotfixes: ["px_scaling"] });

      for (let i = 0; i < pages.length; i++) {
        const canvas = await h2c(pages[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 794,
          height: 1123,
          windowWidth: 794,
          backgroundColor: "#06060a",
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage([794, 1123], "portrait");
        pdf.addImage(imgData, "JPEG", 0, 0, 794, 1123);
      }

      document.body.removeChild(container);

      const safeAthleteSlug = athleteName.replace(/\s+/g, "_").toUpperCase();
      pdf.save(`KIO-X_${safeAthleteSlug}_${selectedAssessment.assessment_date}.pdf`);

      setGeneratingPdf(false);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);

    } catch (err) {
      console.error("PDF generation error:", err);
      setGeneratingPdf(false);
      alert("PDF generation failed. Please check your browser console for details.");
    }
  };

  return (
    <div className="bg-bg-card border border-border-primary/50 rounded-2xl p-5 md:p-6 shadow-xl space-y-6 relative overflow-hidden">
      
      <div className="flex items-center gap-3 pb-3 border-b border-border-primary/50">
        <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center text-accent-green">
          <FileText size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            Performance Assessment Reports
          </h3>
          <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mt-0.5">
            Lab Evaluation Dossier Printer
          </p>
        </div>
      </div>

      {loadingAthletes ? (
        <div className="py-12 flex justify-center items-center gap-2.5">
          <Loader2 className="animate-spin text-accent-green" size={20} />
          <span className="text-[10px] text-text-secondary uppercase tracking-widest font-black animate-pulse">Loading Roster...</span>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Athlete Selector */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider ml-1">
              Select Athlete
            </label>
            <div className="relative">
              <select
                value={selectedAthleteId}
                onChange={e => setSelectedAthleteId(e.target.value)}
                className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-xs text-text-primary focus:border-accent-green outline-none appearance-none"
              >
                <option value="">-- CHOOSE ATHLETE --</option>
                {athletes.map(a => (
                  <option key={a.id} value={a.id}>
                    {(a.first_name || "").toUpperCase()} {(a.last_name || "").toUpperCase()}
                  </option>
                ))}
              </select>
              <User size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Assessment Date Selector */}
          {selectedAthleteId && (
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider ml-1">
                Select Assessment Record
              </label>
              
              {loadingAssessments ? (
                <div className="py-2.5 flex items-center gap-2 pl-1">
                  <Loader2 className="animate-spin text-accent-green" size={14} />
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Scanning records...</span>
                </div>
              ) : assessments.length === 0 ? (
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex flex-col gap-2 items-center text-center">
                  <AlertCircle size={18} className="text-red-500" />
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-wider">No assessments found.</span>
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">
                    Please log an evaluation from the roster first.
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedAssessmentId}
                    onChange={e => handleAssessmentChange(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-xs text-text-primary focus:border-accent-green outline-none appearance-none"
                  >
                    {assessments.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.assessment_date} - {a.assessment_type.replace(/_/g, " ")} ({a.status})
                      </option>
                    ))}
                  </select>
                  <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              )}
            </div>
          )}

          {/* Report Preview Thumbnail */}
          {selectedAssessment && (
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3 relative group">
              <div className="text-[8px] font-mono text-gray-500 uppercase tracking-[2px] border-b border-white/5 pb-1.5 flex justify-between">
                <span>Dossier Schema Preview</span>
                <span className="text-accent-green">A4 Portrait // 6 Pages</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 opacity-90 transition-opacity">
                {[
                  { page: 1, label: "P.1 HERO", val: `${selectedAssessment.performance_score || 0}%`, sub: "PERF" },
                  { page: 2, label: "P.2 MOVEMENT", val: `${selectedAssessment.mobility_score || 0}%`, sub: "MOB" },
                  { page: 3, label: "P.3 VALD", val: `${selectedAssessment.symmetry_score || 0}%`, sub: "SYM" },
                  { page: 4, label: "P.4 RISK", val: `${selectedAssessment.risk_score || 0}%`, sub: "RISK" },
                  { page: 5, label: "P.5 ROADMAP", val: "W0-W8", sub: "PLAN" },
                  { page: 6, label: "P.6 EXECUTIVE", val: "BILING", sub: "SUMM" }
                ].map(p => {
                  const isScore = ["PERF", "MOB", "SYM", "RISK"].includes(p.sub);
                  return (
                    <div key={p.page} className="bg-bg-primary border border-white/10 rounded-lg flex flex-col justify-between p-2 text-center select-none min-h-[56px]">
                      <span className="text-[6px] font-black text-gray-500 uppercase tracking-wider">{p.label}</span>
                      <span className={`text-[10px] font-black my-1 ${isScore ? 'text-accent-green' : 'text-gray-400'}`}>{p.val}</span>
                      <span className="text-[6px] font-mono font-bold text-gray-600 uppercase tracking-widest">{p.sub}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Trigger Button */}
          {selectedAssessment && (
            <div className="pt-2">
              <button
                type="button"
                disabled={generatingPdf}
                onClick={generatePDFReport}
                className="w-full py-3.5 bg-[var(--accent-green)] text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(34,197,94,0.15)]"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    GENERATING ASSESSMENT DOSSIER...
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    GENERATE & DOWNLOAD PDF REPORT
                  </>
                )}
              </button>

              {pdfSuccess && (
                <div className="mt-3 flex justify-center items-center gap-1.5 text-accent-green text-[9px] font-black uppercase tracking-wider animate-pulse">
                  <CheckCircle2 size={12} />
                  Dossier Download Completed
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}

// ==========================================
// DYNAMIC REPORT HTML GENERATION BUILDER
// Uses native window.print()
// ==========================================
export function buildReportHtml(athleteName: string, avatarUrl: string, record: AssessmentRecord): string {
  const getScoreColor = (score: number, inverse = false) => {
    if (inverse) {
      if (score <= 35) return "#22c55e";
      if (score <= 65) return "#f97316";
      return "#ef4444";
    }
    if (score >= 80) return "#22c55e";
    if (score >= 55) return "#f97316";
    return "#ef4444";
  };

  const getSeverityColor = (sev: string) => {
    if (sev === "HIGH" || sev === "RED" || sev === "severe") return "#ef4444";
    if (sev === "MEDIUM" || sev === "ORANGE" || sev === "moderate") return "#f97316";
    return "#22c55e";
  };

  const perf  = record.performance_score || 0;
  const mob   = record.mobility_score    || 0;
  const sym   = record.symmetry_score    || 0;
  const risk  = record.risk_score        || 0;

  // key_findings can be strings OR {title, description, severity} objects
  const rawFindings: any[] = Array.isArray(record.key_findings) ? record.key_findings : [];
  const findings: string[] = rawFindings.map((f: any) =>
    typeof f === "string" ? f : (f?.title || f?.description || JSON.stringify(f))
  ).filter(Boolean);
  const riskFactors: any[] = Array.isArray(record.risk_factors) ? record.risk_factors : [];

  const scoreCard = (label: string, val: number, inverse = false) => {
    const color = getScoreColor(val, inverse);
    return `
      <div style="flex:1;background:#141f14;border:1px solid #1f2d1f;border-radius:14px;
                  padding:22px 14px;text-align:center;position:relative;overflow:hidden;min-height:110px;
                  display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 10px rgba(0,0,0,0.15);box-sizing:border-box;width:100%;">
        <div style="font-size:10px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">${label}</div>
        <div style="font-size:38px;font-weight:900;font-family:'Outfit',sans-serif;color:${color};line-height:1;">${val}<span style="font-size:16px;">%</span></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:${color};"></div>
      </div>`;
  };

  const bar = (label: string, val: number, max = 100, color?: string, barHeight = "14px", rowMinHeight = "45px", marginBottom = "16px") => {
    const c = color || getScoreColor(val);
    const pct = Math.min(100, Math.round((val / max) * 100));
    return `
      <div style="margin-bottom:${marginBottom};min-height:${rowMinHeight};display:flex;flex-direction:column;justify-content:center;width:100%;box-sizing:border-box;">
        <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:800;color:#ffffff;text-transform:uppercase;margin-bottom:6px;letter-spacing:1px;">
          <span>${label}</span><span style="color:${c};font-weight:900;">${val}${max===100?"%":"kg"}</span>
        </div>
        <div style="height:${barHeight};background:rgba(255,255,255,0.06);border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.03);">
          <div style="height:100%;width:${pct}%;background:${c};border-radius:8px;"></div>
        </div>
      </div>`;
  };

  const valdRow = (label: string, lKey: string, rKey: string) => {
    const lValRaw = record[lKey];
    const rValRaw = record[rKey];
    
    // Check if recorded data is missing/undefined/0
    const l = lValRaw !== undefined && lValRaw !== null ? parseFloat(String(lValRaw)) : 0;
    const r = rValRaw !== undefined && rValRaw !== null ? parseFloat(String(rValRaw)) : 0;
    
    if (l === 0 && r === 0) {
      return `
        <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:14px;padding:18px;margin-bottom:12px;min-height:92px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.1);box-sizing:border-box;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:11px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">${label}</span>
            <span style="font-size:8px;font-weight:900;color:#9ca3af;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:3px 8px;border-radius:6px;">NO DATA RECORDED</span>
          </div>
        </div>`;
    }

    const max = Math.max(l, r, 1);
    const asym = Math.abs(((l - r) / max) * 100).toFixed(1);
    const asymColor = parseFloat(asym) < 10 ? "#22c55e" : parseFloat(asym) < 15 ? "#f97316" : "#ef4444";
    return `
      <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:14px;padding:18px;margin-bottom:12px;box-shadow:0 4px 10px rgba(0,0,0,0.15);display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;width:100%;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:6px;">
          <span style="font-size:11px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">${label}</span>
          <span style="font-size:9px;font-weight:900;color:${asymColor};background:${asymColor}15;border:1px solid ${asymColor}30;padding:3px 9px;border-radius:6px;letter-spacing:1px;">ASYM ${asym}%</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <div style="font-size:8px;font-weight:800;color:#9ca3af;margin-bottom:5px;letter-spacing:1px;">LEFT CAPACITY</div>
            ${bar("", l, Math.max(l,r,50)*1.2, "#3b82f6", "10px", "35px", "8px")}
            <div style="font-size:13px;font-weight:900;color:#3b82f6;margin-top:2px;">${l} kg</div>
          </div>
          <div>
            <div style="font-size:8px;font-weight:800;color:#9ca3af;margin-bottom:5px;letter-spacing:1px;">RIGHT CAPACITY</div>
            ${bar("", r, Math.max(l,r,50)*1.2, "#22c55e", "10px", "35px", "8px")}
            <div style="font-size:13px;font-weight:900;color:#22c55e;margin-top:2px;">${r} kg</div>
          </div>
        </div>
      </div>`;
  };

  const header = (page: string, title: string, sub: string) => `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #22c55e;padding-bottom:12px;margin-bottom:24px;height:60px;">
      <div>
        <div style="font-family:'Outfit',sans-serif;font-size:15px;font-weight:900;letter-spacing:2px;color:#fff;">KIO-<span style="color:#22c55e;">X</span> PERFORMANCE</div>
        <div style="font-size:9px;font-weight:800;color:#22c55e;text-transform:uppercase;letter-spacing:4px;margin-top:4px;">${sub}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;">${title}</div>
        <div style="font-size:24px;font-weight:900;font-family:'Outfit',sans-serif;color:#475569;line-height:1;margin-top:2px;">${page}</div>
      </div>
    </div>`;

  const athleteFooterText = `ATHLETE: ${athleteName} - CONFIDENTIAL`;
  const athleteFooterFontSize = athleteName.length > 25 ? "7.5px" : "8px";

  const footer = `
    <div class="page-footer" style="border-top:1px solid #1f2d1f;padding:12px 0 0 0;display:flex;justify-content:space-between;align-items:center;
                font-size:${athleteFooterFontSize};font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;height:30px;margin-top:auto;">
      <span>KIO-X PERFORMANCE CENTER - ${record.assessment_date}</span>
      <span>${athleteFooterText}</span>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KIO-X Performance Report - ${athleteName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script>
    async function downloadPDF() {
      try {
        const h2c = window.html2canvas;
        const { jsPDF } = window.jspdf;
        const pages = Array.from(document.querySelectorAll(".page"));
        const pdf = new jsPDF({ unit: "px", format: [794, 1123], orientation: "portrait", hotfixes: ["px_scaling"] });

        for (let i = 0; i < pages.length; i++) {
          const canvas = await h2c(pages[i], {
            scale: 2,
            useCORS: true,
            logging: false,
            width: 794,
            height: 1123,
            windowWidth: 794,
            backgroundColor: "#06060a",
          });
          const imgData = canvas.toDataURL("image/jpeg", 0.92);
          if (i > 0) pdf.addPage([794, 1123], "portrait");
          pdf.addImage(imgData, "JPEG", 0, 0, 794, 1123);
        }

        const safeAthleteSlug = "${athleteName.replace(/\s+/g, "_").toUpperCase()}";
        pdf.save("KIO-X_" + safeAthleteSlug + "_" + "${record.assessment_date}" + ".pdf");
      } catch (err) {
        console.error("PDF download error:", err);
      }
    }
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      html, body { width: 210mm; }
      .page { page-break-after: always; break-after: page; height: 297mm; }
      .page:last-child { page-break-after: avoid; break-after: avoid; }
    }

    /* Screen view: dark bg fills around the A4 page blocks */
    @media screen {
      html, body { background: #080d08 !important; }
    }

    html, body {
      background: #080d08;
      font-family: 'Inter', sans-serif;
      color: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .page {
      /* Use explicit px — mm units can be unreliable in html2canvas/canvas context */
      width: 794px;
      height: 1123px;
      min-height: 1123px;
      max-height: 1123px;
      overflow: hidden;
      background-color: #080d08;
      background-image:
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 0 L56 14 L56 42 L28 56 L0 42 L0 14 Z' fill='none' stroke='rgba(34,197,94,0.03)' stroke-width='1'/%3E%3Cpath d='M28 56 L56 70 L56 98 L28 112 L0 98 L0 70 Z' fill='none' stroke='rgba(34,197,94,0.03)' stroke-width='1'/%3E%3C/svg%3E"),
        radial-gradient(ellipse 70% 50% at 20% 30%, rgba(34,197,94,0.045) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 80% 70%, rgba(59,130,246,0.03) 0%, transparent 55%),
        linear-gradient(160deg, #0f1a0f 0%, #080d08 40%, #050805 100%);
      background-size: 56px 100px, cover, cover, cover;
      /* Single source of padding — 28px L/R breathing room, 60px top/bottom */
      padding: 60px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      box-sizing: border-box;
    }
    /* Absolute overlays (avatar, gradient) still cover full 794px bleed area */
    .page > [style*="position:absolute"] { z-index: 0; }
    /* All other direct children sit inside the padded content box */
    .page > :not([style*="position:absolute"]) { position: relative; z-index: 1; }
  </style>
</head>
<body>

<!-- PAGE 1: HERO COVER -->
<div class="page" style="position:relative;">
  ${avatarUrl
    ? `<div style="position:absolute;inset:0;background-image:url('${avatarUrl}');background-size:cover;background-position:center;filter:blur(1px);transform:scale(1.02);opacity:0.25;"></div>`
    : `<div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 40%, rgba(34,197,94,0.05) 0%,#080d08 70%);opacity:0.35;"></div>`
  }
  <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(8,13,8,0.92) 0%,rgba(5,8,5,0.97) 100%);"></div>
  
  <div style="position:relative;z-index:10;display:flex;flex-direction:column;justify-content:space-between;flex:1;">
    <!-- Header -->
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #22c55e;padding-bottom:12px;height:60px;margin-bottom:24px;">
      <div style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:900;letter-spacing:3px;color:#fff;">KIO-<span style="color:#22c55e;">X</span> PERFORMANCE</div>
      <div style="font-size:10px;font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;">${record.assessment_date}</div>
    </div>

    <!-- Content (flex-grow to fill space) -->
    <div class="page-content" style="flex:1;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;margin-bottom:24px;">
      <!-- Athlete name -->
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;margin:30px 0;">
        <div style="font-size:12px;font-weight:900;color:#22c55e;letter-spacing:6px;text-transform:uppercase;margin-bottom:12px;">Elite Athlete Dossier</div>
        <div style="font-family:'Outfit',sans-serif;font-size:52px;font-weight:900;line-height:1.1;text-transform:uppercase;letter-spacing:3px;color:#ffffff;margin-bottom:12px;word-wrap:break-word;">
          ${athleteName}
        </div>
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:3px;">
          ${(record.assessment_type||"Full Assessment").replace(/_/g," ")} - Season ${record.season||"2026/2027"}
        </div>
      </div>

      <!-- Score cards row -->
      <div style="display:flex;gap:12px;margin-bottom:24px;width:100%;">
        ${scoreCard("Performance", perf)}
        ${scoreCard("Mobility", mob)}
        ${scoreCard("Symmetry", sym)}
        ${scoreCard("Injury Risk", risk, true)}
      </div>

      <!-- Key findings preview & summary -->
      <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:12px;flex:1.2;justify-content:flex-end;">
        ${findings.length > 0 ? `
        <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:14px;padding:24px;box-shadow:0 4px 10px rgba(0,0,0,0.15);min-height:130px;">
          <div style="font-size:10px;font-weight:900;color:#22c55e;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:6px;">Key Findings</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${findings.slice(0,3).map((f: string,i: number) => `
              <div style="display:flex;gap:10px;align-items:flex-start;">
                <span style="background:#22c55e;color:#000;width:18px;height:18px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;flex-shrink:0;">${String(i+1).padStart(2,"0")}</span>
                <span style="font-size:12px;color:#ffffff;font-weight:500;">${f}</span>
              </div>`).join("")}
          </div>
        </div>` : `
        <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:14px;padding:24px;text-align:center;color:#9ca3af;font-size:12px;font-style:italic;min-height:130px;display:flex;align-items:center;justify-content:center;">
          No findings recorded
        </div>`}

        ${record.coach_summary ? `
        <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:14px;padding:24px;box-shadow:0 4px 10px rgba(0,0,0,0.15);min-height:120px;">
          <div style="font-size:10px;font-weight:900;color:#22c55e;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:6px;">Coach Summary</div>
          <p style="font-size:12px;color:#9ca3af;line-height:1.6;font-style:italic;margin:0;">
            "${record.coach_summary}"
          </p>
        </div>` : ""}
      </div>
    </div>

    ${footer}
  </div>
</div>

<!-- PAGE 2: MOVEMENT & MOBILITY DASHBOARD -->
<div class="page">
  ${header("02","MOVEMENT & MOBILITY DASHBOARD","Functional Screen & Mobility Profile")}
  <div class="page-content" style="flex:1;display:flex;flex-direction:column;gap:16px;overflow:hidden;margin-bottom:24px;">

    <!-- Row 1: Radar Chart + Body Map side by side -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;height:310px;">

      <!-- MOBILITY PROFILE radar chart (SVG) -->
      <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:16px;padding:20px;display:flex;flex-direction:column;">
        <div style="font-size:10px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.07);padding-bottom:6px;">Mobility Profile</div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 240 200" width="240" height="200" xmlns="http://www.w3.org/2000/svg">
            <!-- Axes labels -->
            <text x="120" y="14" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="Inter,sans-serif" font-weight="700">Hip</text>
            <text x="222" y="82" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="Inter,sans-serif" font-weight="700">Ankle</text>
            <text x="200" y="175" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="Inter,sans-serif" font-weight="700">Balance</text>
            <text x="120" y="198" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="Inter,sans-serif" font-weight="700">Foot Chain</text>
            <text x="38" y="175" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="Inter,sans-serif" font-weight="700">Rotation</text>
            <text x="18" y="82" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="Inter,sans-serif" font-weight="700">Squat</text>

            <!-- Background grid rings (3 rings at 33%, 66%, 100%) -->
            ${[1,2,3].map(ring => {
              const r = ring * 0.333;
              const cx = 120, cy = 100, R = 72;
              const pts = [0,1,2,3,4,5].map(i => {
                const angle = (i * 60 - 90) * Math.PI / 180;
                return `${cx + R*r*Math.cos(angle)},${cy + R*r*Math.sin(angle)}`;
              }).join(" ");
              return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
            }).join("")}

            <!-- Axis lines from center -->
            ${[0,1,2,3,4,5].map(i => {
              const angle = (i * 60 - 90) * Math.PI / 180;
              const cx = 120, cy = 100, R = 72;
              return `<line x1="${cx}" y1="${cy}" x2="${cx + R*Math.cos(angle)}" y2="${cy + R*Math.sin(angle)}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
            }).join("")}

            <!-- Data polygon -->
            ${(() => {
              const vals = [
                Math.min(1, ((record.hip_ir_left || 0) + (record.hip_er_left || 0)) / 130),
                Math.min(1, (record.ankle_df || 0) / 100),
                Math.min(1, (record.single_leg_stand || 0) / 100),
                Math.min(1, (record.great_toe_ext || record.forward_bend || 0) / 100),
                Math.min(1, (record.cspine_rotation || 0) / 100),
                Math.min(1, (record.deep_squat || 0) / 100),
              ];
              const cx = 120, cy = 100, R = 72;
              const pts = vals.map((v, i) => {
                const angle = (i * 60 - 90) * Math.PI / 180;
                return `${cx + R*v*Math.cos(angle)},${cy + R*v*Math.sin(angle)}`;
              }).join(" ");
              return `<polygon points="${pts}" fill="rgba(34,197,94,0.25)" stroke="#22c55e" stroke-width="2"/>
                      ${vals.map((v, i) => {
                        const angle = (i * 60 - 90) * Math.PI / 180;
                        return `<circle cx="${cx + R*v*Math.cos(angle)}" cy="${cy + R*v*Math.sin(angle)}" r="3.5" fill="#22c55e"/>`;
                      }).join("")}`;
            })()}
          </svg>
        </div>
      </div>

      <!-- BODY MAP - FOCUS ZONES (SVG) -->
      <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:16px;padding:20px;display:flex;flex-direction:column;">
        <div style="font-size:10px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.07);padding-bottom:6px;">Body Map — Focus Zones</div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;position:relative;">
          <svg viewBox="0 0 240 240" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <!-- Body silhouette (simplified front view) -->
            <!-- Head -->
            <circle cx="120" cy="28" r="18" fill="#1e2d1e" stroke="#2d3d2d" stroke-width="1.5"/>
            <!-- Neck -->
            <rect x="114" y="44" width="12" height="12" rx="3" fill="#1e2d1e" stroke="#2d3d2d" stroke-width="1"/>
            <!-- Torso -->
            <rect x="96" y="54" width="48" height="64" rx="8" fill="#1e2d1e" stroke="#2d3d2d" stroke-width="1.5"/>
            <!-- Left arm -->
            <rect x="76" y="56" width="18" height="52" rx="9" fill="#1e2d1e" stroke="#2d3d2d" stroke-width="1"/>
            <!-- Right arm -->
            <rect x="146" y="56" width="18" height="52" rx="9" fill="#1e2d1e" stroke="#2d3d2d" stroke-width="1"/>
            <!-- Left leg -->
            <rect x="98" y="118" width="20" height="70" rx="10" fill="#1e2d1e" stroke="#2d3d2d" stroke-width="1"/>
            <!-- Right leg -->
            <rect x="122" y="118" width="20" height="70" rx="10" fill="#1e2d1e" stroke="#2d3d2d" stroke-width="1"/>

            <!-- FOCUS ZONE DOTS with labels -->
            <!-- Groin (red - high risk) -->
            <circle cx="150" cy="112" r="7" fill="#ef4444" opacity="0.9"/>
            <text x="160" y="116" fill="#ef4444" font-size="8" font-family="Inter,sans-serif" font-weight="700">Groin</text>

            <!-- Hip (orange - moderate) -->
            <circle cx="88" cy="125" r="7" fill="#f97316" opacity="0.9"/>
            <text x="58" y="129" fill="#f97316" font-size="8" font-family="Inter,sans-serif" font-weight="700" text-anchor="end">Hip</text>

            <!-- Balance (yellow) -->
            <circle cx="150" cy="145" r="6" fill="#eab308" opacity="0.9"/>
            <text x="160" y="149" fill="#eab308" font-size="8" font-family="Inter,sans-serif" font-weight="700">Balance</text>

            <!-- Ankle (orange) -->
            <circle cx="88" cy="175" r="6" fill="#f97316" opacity="0.9"/>
            <text x="60" y="179" fill="#f97316" font-size="8" font-family="Inter,sans-serif" font-weight="700" text-anchor="end">Ankle</text>

            <!-- Toe (red) -->
            <circle cx="150" cy="185" r="5" fill="#ef4444" opacity="0.9"/>
            <text x="160" y="189" fill="#ef4444" font-size="8" font-family="Inter,sans-serif" font-weight="700">Toe</text>
          </svg>
        </div>
      </div>
    </div>

    <!-- Row 2: FUNCTIONAL TEST STATUS bars in 2 columns -->
    <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:16px;padding:20px 24px;flex:1;">
      <div style="font-size:10px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.07);padding-bottom:6px;">Functional Test Status</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 28px;">
        ${bar("C-Spine Rotation",  record.cspine_rotation   || 0, 100, undefined, "10px", "36px", "6px")}
        ${bar("Forward Bend",      record.forward_bend      || 0, 100, undefined, "10px", "36px", "6px")}
        ${bar("Hip IR Left",       record.hip_ir_left       || 0, 100, undefined, "10px", "36px", "6px")}
        ${bar("Hip ER Both",       Math.round(((record.hip_er_left||0)+(record.hip_er_right||0))/2), 100, undefined, "10px", "36px", "6px")}
        ${bar("Deep Squat",        record.deep_squat        || 0, 100, undefined, "10px", "36px", "6px")}
        ${bar("Ankle DF",          record.ankle_df          || 0, 100, undefined, "10px", "36px", "6px")}
        ${bar("Great Toe Ext.",    record.great_toe_ext     || 0, 100, undefined, "10px", "36px", "6px")}
        ${bar("Single Leg Stand",  record.single_leg_stand  || 0, 100, undefined, "10px", "36px", "6px")}
      </div>
    </div>

    <!-- Row 3: INTERPRETATION -->
    <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:16px;padding:18px 24px;min-height:80px;">
      <div style="font-size:10px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.07);padding-bottom:6px;">Interpretation</div>
      <p style="font-size:11px;color:#9ca3af;line-height:1.6;margin:0;">
        ${record.mobility_interpretation || "Movement limitations are concentrated around the hip-pelvis-foot chain. Restricted hip rotation and ankle dorsiflexion may reduce force transfer during sprinting, kicking and change-of-direction actions."}
      </p>
    </div>

  </div>
  ${footer}
</div>

<!-- PAGE 3: VALD FORCE PROFILE -->
<div class="page">
  ${header("03","VALD FORCE PROFILE","Bilateral Strength & Symmetry")}
  <div class="page-content" style="flex:1;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;margin-bottom:24px;width:100%;">
    <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3, auto);gap:16px;margin-bottom:20px;flex:1;align-content:space-between;width:100%;">
      <div style="grid-column:1;">
        ${valdRow("Hamstrings", "hamstrings_left", "hamstrings_right")}
      </div>
      <div style="grid-column:2;">
        ${valdRow("Adductors", "adductors_left", "adductors_right")}
      </div>
      <div style="grid-column:1;">
        ${valdRow("Hip Extension", "hip_extension_left", "hip_extension_right")}
      </div>
      <div style="grid-column:2;">
        ${valdRow("Hip Abduction", "hip_abduction_left", "hip_abduction_right")}
      </div>
      <div style="grid-column:1 / span 2;">
        ${valdRow("Hip Flexion", "hip_flexion_left", "hip_flexion_right")}
      </div>
    </div>
    
    <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:14px;padding:24px 20px;min-height:110px;box-shadow:0 4px 10px rgba(0,0,0,0.15);width:100%;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
        <div>
          <div style="font-size:10px;font-weight:900;color:#3b82f6;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Symmetry Index</div>
          <div style="font-size:12px;color:#9ca3af;font-weight:500;">Bilateral force comparison across active muscle groups.</div>
        </div>
        <div style="font-size:46px;font-weight:900;font-family:'Outfit',sans-serif;color:${getScoreColor(sym)};line-height:1;">${sym}<span style="font-size:20px;">%</span></div>
      </div>
    </div>
  </div>
  ${footer}
</div>

<!-- PAGE 4: PERFORMANCE IMPACT & RISK -->
<div class="page">
  ${header("04","PERFORMANCE IMPACT","Athletic Capacity & Injury Risk")}
  <div class="page-content" style="flex:1;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;margin-bottom:24px;width:100%;">
    <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:20px;flex:1;margin-bottom:20px;width:100%;">
      <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:16px;padding:24px;display:flex;flex-direction:column;justify-content:space-between;height:100%;">
        <div style="font-size:11px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Performance Capacities</div>
        <div style="display:flex;flex-direction:column;justify-content:space-between;flex:1;">
          ${bar("Acceleration",         record.acceleration_impact    || 0, 100, undefined, "14px", "45px", "18px")}
          ${bar("Sprint",               record.sprint_impact          || 0, 100, undefined, "14px", "45px", "18px")}
          ${bar("Change of Direction",  record.change_of_direction_impact || 0, 100, undefined, "14px", "45px", "18px")}
          ${bar("Kicking Mechanics",    record.kicking_impact         || 0, 100, undefined, "14px", "45px", "18px")}
          ${bar("Landing Mechanics",    record.landing_impact         || 0, 100, undefined, "14px", "45px", "18px")}
          ${bar("Single-Leg Stability", record.single_leg_stability   || 0, 100, undefined, "14px", "45px", "18px")}
        </div>
      </div>
      
      <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:16px;padding:24px;display:flex;flex-direction:column;justify-content:space-between;height:100%;">
        <div style="font-size:11px;font-weight:900;color:#ef4444;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Risk Profile</div>
        
        <div style="text-align:center;margin:20px 0;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;">
          <div style="width:145px;height:145px;border-radius:50%;border:10px solid ${getScoreColor(risk, true)}20;border-top-color:${getScoreColor(risk, true)};display:flex;flex-direction:column;justify-content:center;align-items:center;box-shadow:0 0 20px rgba(0,0,0,0.2);">
            <div style="font-size:46px;font-weight:900;font-family:'Outfit',sans-serif;color:${getScoreColor(risk,true)};line-height:1;">${risk}%</div>
          </div>
          <div style="font-size:10px;font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-top:16px;">Injury Risk Score</div>
        </div>
        
        <div style="margin-top:10px;">
          <div style="font-size:9px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:4px;">Active Risk Factors</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${riskFactors.length > 0
              ? riskFactors.map((r: any) => {
                  const c = getSeverityColor(r.severity);
                  return `<span style="padding:5px 12px;border-radius:8px;border:1px solid ${c}30;background:${c}10;font-size:9px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.5px;">${r.name}</span>`;
                }).join("")
              : `<span style="font-size:10px;color:#9ca3af;font-style:italic;">No specific risk factors flagged.</span>`
            }
          </div>
        </div>
      </div>
    </div>
    
    <!-- Interpretation Section -->
    <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:14px;padding:24px 20px;min-height:120px;box-shadow:0 4px 10px rgba(0,0,0,0.15);width:100%;box-sizing:border-box;">
      <div style="font-size:10px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Performance Interpretation</div>
      <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0;">
        ${record.performance_interpretation || "Sprint: Reduced ankle dorsiflexion and unilateral asymmetry may limit linear force projection. Landing mechanics must prioritize multi-planar deceleration control to mitigate risk profiles."}
      </p>
    </div>
  </div>
  ${footer}
</div>

<!-- PAGE 5: PRIORITIES & ROADMAP -->
<div class="page">
  ${header("05","ACTION PLAN","Priorities & Return-to-Performance Roadmap")}
  <div class="page-content" style="flex:1;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;margin-bottom:24px;width:100%;">
    <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:16px;padding:24px;flex:1;margin-bottom:20px;display:flex;flex-direction:column;width:100%;">
      <div style="font-size:11px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Top Priorities</div>
      <div style="display:flex;flex-direction:column;gap:10px;justify-content:flex-start;">
        ${findings.length > 0
          ? findings.map((f: string, i: number) => `
              <div style="display:flex;gap:16px;align-items:center;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:14px 20px;min-height:56px;width:100%;">
                <span style="background:${i===0?"#ef4444":i===1?"#f97316":"#3b82f6"};color:#fff;width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;flex-shrink:0;">${String(i+1).padStart(2,"0")}</span>
                <span style="font-size:12px;color:#ffffff;font-weight:500;line-height:1.4;">${f}</span>
              </div>`).join("")
          : `<div style="padding:20px;text-align:center;font-size:12px;color:#9ca3af;font-style:italic;display:flex;align-items:center;justify-content:center;">No priority actions documented.</div>`
        }
      </div>
    </div>

    <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:16px;padding:24px;display:flex;flex-direction:column;justify-content:space-between;min-height:330px;width:100%;">
      <div style="font-size:11px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">8-Week Return-to-Performance Roadmap</div>
      <div style="position:relative;padding:24px 0;margin:12px 0;width:100%;">
        <div style="position:absolute;left:0;right:0;top:44px;height:3px;background:rgba(255,255,255,0.08);z-index:1;"></div>
        <div style="display:flex;justify-content:space-between;position:relative;z-index:2;width:100%;">
          ${[
            {week:"W0-1",label:"Baseline",color:"#22c55e",desc:"Initial testing"},
            {week:"W2-3",label:"Mobility",color:"#3b82f6",desc:"Joint mechanics"},
            {week:"W4-5",label:"Strength",color:"#8b5cf6",desc:"Hypertrophy"},
            {week:"W6",label:"Power",color:"#f97316",desc:"RFD metrics"},
            {week:"W7",label:"Sport",color:"#f43f5e",desc:"Skill integration"},
            {week:"W8",label:"Return",color:"#22c55e",desc:"Full clearance"},
          ].map(n => `
            <div style="display:flex;flex-direction:column;align-items:center;width:80px;text-align:center;">
              <div style="width:44px;height:44px;border-radius:50%;background:${n.color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#fff;box-shadow:0 0 14px ${n.color}40;border:3px solid #141f14;">${n.week.slice(0,2)}</div>
              <div style="font-size:9.5px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:0.5px;margin-top:10px;">${n.label}</div>
              <div style="font-size:8px;font-weight:600;color:#9ca3af;margin-top:3px;text-transform:uppercase;">${n.desc}</div>
            </div>`).join("")}
        </div>
      </div>
      
      <!-- Main Targets Checklist -->
      <div style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.05);padding-top:18px;width:100%;">
        <div style="font-size:9px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Primary Targets</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;min-height:50px;width:100%;">
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#ffffff;"><span style="color:#22c55e;font-weight:bold;">✔</span> Eliminate bilateral asymmetries</div>
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#ffffff;"><span style="color:#22c55e;font-weight:bold;">✔</span> Build absolute force outputs</div>
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#ffffff;"><span style="color:#22c55e;font-weight:bold;">✔</span> Increase mobility thresholds</div>
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#ffffff;"><span style="color:#22c55e;font-weight:bold;">✔</span> Optimize load distribution</div>
        </div>
      </div>
    </div>
  </div>
  ${footer}
</div>

<!-- PAGE 6: EXECUTIVE SUMMARY -->
<div class="page" style="position:relative;">
  <!-- Watermark in empty space -->
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);font-family:'Outfit',sans-serif;font-size:42px;font-weight:900;color:rgba(255,255,255,0.015);text-transform:uppercase;letter-spacing:8px;pointer-events:none;white-space:nowrap;z-index:0;text-align:center;">
    KIO-X HUMAN PERFORMANCE
  </div>

  <div style="position:relative;z-index:1;display:flex;flex-direction:column;justify-content:space-between;flex:1;">
    ${header("06","EXECUTIVE SUMMARY","Season Assessment Overview")}
    
    <div class="page-content" style="flex:1;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;margin-bottom:24px;">
      <!-- Language Reports Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;height:240px;margin-bottom:24px;width:100%;">
        <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:16px;padding:24px;display:flex;flex-direction:column;">
          <div style="font-size:11px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:6px;">English Report</div>
          <p style="font-size:12px;color:#9ca3af;line-height:1.7;font-style:italic;margin:0;overflow:auto;flex:1;display:flex;align-items:center;">
            "${record.coach_summary || "No summary evaluation notes assigned."}"
          </p>
        </div>
        <div style="background:#141f14;border:1px solid #1f2d1f;border-radius:16px;padding:24px;display:flex;flex-direction:column;">
          <div style="font-size:11px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:6px;">Deutsch Bericht</div>
          <p style="font-size:12px;color:#9ca3af;line-height:1.7;font-style:italic;margin:0;overflow:auto;flex:1;display:flex;align-items:center;">
            "${record.coach_summary_de || record.coach_summary || "Keine Zusammenfassung eingetragen."}"
          </p>
        </div>
      </div>
      
      <!-- Divider -->
      <div style="border-bottom:1px solid rgba(255,255,255,0.05);margin-bottom:24px;width:100%;"></div>
      
      <!-- Score matrix repeat in 4-column Grid -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;width:100%;">
        ${scoreCard("PERFORMANCE", perf)}
        ${scoreCard("MOBILITY",    mob)}
        ${scoreCard("SYMMETRY",    sym)}
        ${scoreCard("INJURY RISK", risk, true)}
      </div>
    </div>
    
    ${footer}
  </div>
</div>
</body>
</html>`;
}
