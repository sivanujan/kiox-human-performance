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
    const athleteName = athlete ? `${athlete.first_name || ""} ${athlete.last_name || ""}`.trim() || "Athlete" : "Athlete";
    const avatarUrl = athlete?.avatar_url || "";

    try {
      const printWindow = window.open("", "_blank", "width=900,height=700");
      if (!printWindow) throw new Error("Popup blocked. Please allow popups.");

      const htmlContent = buildReportHtml(athleteName, avatarUrl, selectedAssessment);
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for fonts/images to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          setGeneratingPdf(false);
          setPdfSuccess(true);
          setTimeout(() => setPdfSuccess(false), 4000);
        }, 800);
      };

      // Fallback if onload doesn't fire
      setTimeout(() => {
        if (generatingPdf) {
          printWindow.focus();
          printWindow.print();
          setGeneratingPdf(false);
          setPdfSuccess(true);
          setTimeout(() => setPdfSuccess(false), 4000);
        }
      }, 2500);

    } catch (err) {
      console.error(err);
      setGeneratingPdf(false);
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
// Uses native window.print() â€” no html2canvas
// ==========================================
export function buildReportHtml(athleteName: string, avatarUrl: string, record: AssessmentRecord): string {
  const getScoreColor = (score: number, inverse = false) => {
    if (inverse) {
      if (score <= 35) return "#22c55e";
      if (score <= 65) return "#f59e0b";
      return "#ef4444";
    }
    if (score >= 80) return "#22c55e";
    if (score >= 55) return "#f59e0b";
    return "#ef4444";
  };

  const getSeverityColor = (sev: string) => {
    if (sev === "HIGH") return "#ef4444";
    if (sev === "MEDIUM") return "#f59e0b";
    return "#22c55e";
  };

  const perf  = record.performance_score || 0;
  const mob   = record.mobility_score    || 0;
  const sym   = record.symmetry_score    || 0;
  const risk  = record.risk_score        || 0;

  const findings: string[] = Array.isArray(record.key_findings) ? record.key_findings : [];
  const riskFactors: any[] = Array.isArray(record.risk_factors)  ? record.risk_factors  : [];

  const scoreCard = (label: string, val: number, inverse = false) => {
    const color = getScoreColor(val, inverse);
    return `
      <div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;
                  padding:16px 10px;text-align:center;position:relative;overflow:hidden;">
        <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">${label}</div>
        <div style="font-size:30px;font-weight:900;font-family:'Outfit',sans-serif;color:${color};line-height:1;">${val}<span style="font-size:14px;">%</span></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${color};"></div>
      </div>`;
  };

  const bar = (label: string, val: number, max = 100, color?: string) => {
    const c = color || getScoreColor(val);
    const pct = Math.min(100, Math.round((val / max) * 100));
    return `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;">
          <span>${label}</span><span style="color:${c};">${val}${max===100?"%":"kg"}</span>
        </div>
        <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${c};border-radius:4px;"></div>
        </div>
      </div>`;
  };

  const valdRow = (label: string, lKey: string, rKey: string) => {
    const l = record[lKey] || 0;
    const r = record[rKey] || 0;
    const max = Math.max(l, r, 1);
    const asym = max > 0 ? Math.abs(((l - r) / max) * 100).toFixed(1) : "0.0";
    const asymColor = parseFloat(asym) < 10 ? "#22c55e" : parseFloat(asym) < 15 ? "#f59e0b" : "#ef4444";
    return `
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:9px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">${label}</span>
          <span style="font-size:8px;font-weight:900;color:${asymColor};background:${asymColor}15;border:1px solid ${asymColor}30;padding:2px 8px;border-radius:6px;">ASYM ${asym}%</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>
            <div style="font-size:7px;font-weight:800;color:#64748b;margin-bottom:3px;">LEFT</div>
            ${bar("", l, Math.max(l,r,50)*1.2, "#3b82f6")}
            <div style="font-size:12px;font-weight:900;color:#3b82f6;">${l} kg</div>
          </div>
          <div>
            <div style="font-size:7px;font-weight:800;color:#64748b;margin-bottom:3px;">RIGHT</div>
            ${bar("", r, Math.max(l,r,50)*1.2, "#22c55e")}
            <div style="font-size:12px;font-weight:900;color:#22c55e;">${r} kg</div>
          </div>
        </div>
      </div>`;
  };

  const header = (page: string, title: string, sub: string) => `
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #22c55e;padding-bottom:10px;margin-bottom:18px;">
      <div>
        <div style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:900;letter-spacing:2px;color:#fff;">KIO-<span style="color:#22c55e;">X</span> PERFORMANCE</div>
        <div style="font-size:8px;font-weight:800;color:#22c55e;text-transform:uppercase;letter-spacing:3px;margin-top:2px;">${sub}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px;font-weight:900;color:#64748b;">${title}</div>
        <div style="font-size:22px;font-weight:900;font-family:'Outfit',sans-serif;color:#1e293b;line-height:1;">${page}</div>
      </div>
    </div>`;

  const footer = `
    <div style="border-top:1px solid rgba(255,255,255,0.05);padding-top:8px;display:flex;justify-content:space-between;
                font-size:7px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:1.5px;">
      <span>KIO-X Performance Center Â· ${record.assessment_date}</span>
      <span>Athlete: ${athleteName} Â· CONFIDENTIAL</span>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KIO-X Performance Report â€“ ${athleteName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      html, body { width: 210mm; height: 297mm; }
      .page { page-break-after: always; break-after: page; }
      .page:last-child { page-break-after: avoid; break-after: avoid; }
    }

    html, body {
      background: #08080a;
      font-family: 'Inter', sans-serif;
      color: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      max-height: 297mm;
      overflow: hidden;
      background: #08080a;
      padding: 14mm 16mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
  </style>
</head>
<body>

<!-- PAGE 1: HERO COVER -->
<div class="page" style="padding:0;position:relative;">
  ${avatarUrl
    ? `<div style="position:absolute;inset:0;background-image:url('${avatarUrl}');background-size:cover;background-position:center;filter:blur(3px);transform:scale(1.05);"></div>`
    : `<div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 40%, rgba(34,197,94,0.08) 0%,#08080a 70%);"></div>`
  }
  <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(5,5,6,0.93)0%,rgba(8,8,10,0.97)100%);"></div>
  
  <div style="position:relative;z-index:10;padding:14mm 16mm;display:flex;flex-direction:column;justify-content:space-between;height:100%;">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #22c55e;padding-bottom:10px;margin-bottom:28px;">
      <div style="font-family:'Outfit',sans-serif;font-size:15px;font-weight:900;letter-spacing:2px;color:#fff;">KIO-<span style="color:#22c55e;">X</span> PERFORMANCE</div>
      <div style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:2px;">${record.assessment_date}</div>
    </div>

    <!-- Athlete name -->
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
      <div style="font-size:9px;font-weight:900;color:#22c55e;letter-spacing:5px;text-transform:uppercase;margin-bottom:10px;">Elite Athlete Dossier</div>
      <div style="font-family:'Outfit',sans-serif;font-size:44px;font-weight:900;line-height:1;text-transform:uppercase;letter-spacing:3px;color:#ffffff;margin-bottom:8px;">${athleteName}</div>
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">${(record.assessment_type||"Full Assessment").replace(/_/g," ")} Â· Season ${record.season||"2026/27"}</div>
    </div>

    <!-- Score cards row -->
    <div style="display:flex;gap:10px;margin-bottom:20px;">
      ${scoreCard("Performance", perf)}
      ${scoreCard("Mobility", mob)}
      ${scoreCard("Symmetry", sym)}
      ${scoreCard("Injury Risk", risk, true)}
    </div>

    <!-- Key findings preview -->
    ${findings.length > 0 ? `
    <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.15);border-radius:12px;padding:14px;margin-bottom:16px;">
      <div style="font-size:8px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Key Findings</div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        ${findings.slice(0,3).map((f: string,i: number) => `
          <div style="display:flex;gap:8px;align-items:flex-start;">
            <span style="background:#22c55e;color:#000;width:16px;height:16px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;flex-shrink:0;">${String(i+1).padStart(2,"0")}</span>
            <span style="font-size:9px;color:#cbd5e1;font-weight:500;">${f}</span>
          </div>`).join("")}
      </div>
    </div>` : ""}

    ${footer}
  </div>
</div>

<!-- PAGE 2: FUNCTIONAL TESTS & MOBILITY -->
<div class="page">
  ${header("02","FUNCTIONAL ASSESSMENT","Movement Screen & Mobility")}
  <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:14px;">
    <div>
      <div style="font-size:9px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Functional Tests</div>
      ${bar("Deep Squat",           record.deep_squat           || 0)}
      ${bar("Inline Lunge",         record.inline_lunge         || 0)}
      ${bar("Hurdle Step",          record.hurdle_step          || 0)}
      ${bar("ASLR",                 record.aslr                 || 0)}
      ${bar("Shoulder Mobility",    record.shoulder_mobility    || 0)}
      ${bar("Rotary Stability",     record.rotary_stability     || 0)}
      ${bar("Trunk Stability",      record.trunk_stability_pushup || 0)}
      ${bar("Single Leg Stand",     record.single_leg_stand     || 0)}
    </div>
    <div>
      <div style="font-size:9px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Mobility Ranges</div>
      ${bar("Ankle DF",       record.ankle_df        || 0)}
      ${bar("Hip IR Left",    record.hip_ir_left     || 0)}
      ${bar("Hip IR Right",   record.hip_ir_right    || 0)}
      ${bar("Hip ER Left",    record.hip_er_left     || 0)}
      ${bar("Hip ER Right",   record.hip_er_right    || 0)}
      ${bar("Cspine Rotation",record.cspine_rotation || 0)}
      ${bar("Forward Bend",   record.forward_bend    || 0)}
      ${bar("Hip Flexion",    record.hip_flexion     || 0)}
    </div>
  </div>
  <!-- Mobility score summary -->
  <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.12);border-radius:10px;padding:12px;margin-top:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:8px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Overall Mobility Index</div>
        <div style="font-size:11px;color:#94a3b8;font-weight:500;">Hip rotation and ankle dorsiflexion are primary limiters.</div>
      </div>
      <div style="font-size:36px;font-weight:900;font-family:'Outfit',sans-serif;color:${getScoreColor(mob)};">${mob}<span style="font-size:16px;">%</span></div>
    </div>
  </div>
  ${footer}
</div>

<!-- PAGE 3: VALD FORCE PROFILE -->
<div class="page">
  ${header("03","VALD FORCE PROFILE","Bilateral Strength & Symmetry")}
  <div style="flex:1;overflow:hidden;">
    ${valdRow("Knee Extension", "knee_ext_left",  "knee_ext_right")}
    ${valdRow("Knee Flexion",   "knee_flex_left", "knee_flex_right")}
    ${valdRow("Hip Adduction",  "hip_add_left",   "hip_add_right")}
    ${valdRow("Hip Abduction",  "hip_abd_left",   "hip_abd_right")}
    ${valdRow("Hamstring",      "hamstring_left",  "hamstring_right")}
  </div>
  <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.12);border-radius:10px;padding:12px;margin-top:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:8px;font-weight:900;color:#3b82f6;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Symmetry Index</div>
        <div style="font-size:11px;color:#94a3b8;">Average force symmetry across all VALD measurements.</div>
      </div>
      <div style="font-size:36px;font-weight:900;font-family:'Outfit',sans-serif;color:${getScoreColor(sym)};">${sym}<span style="font-size:16px;">%</span></div>
    </div>
  </div>
  ${footer}
</div>

<!-- PAGE 4: PERFORMANCE IMPACT & RISK -->
<div class="page">
  ${header("04","PERFORMANCE IMPACT","Athletic Capacity & Injury Risk")}
  <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:14px;overflow:hidden;">
    <div>
      <div style="font-size:9px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Performance Capacities</div>
      ${bar("Acceleration",         record.acceleration_impact    || 0)}
      ${bar("Sprint",               record.sprint_impact          || 0)}
      ${bar("Change of Direction",  record.change_of_direction_impact || 0)}
      ${bar("Kicking Mechanics",    record.kicking_impact         || 0)}
      ${bar("Landing Mechanics",    record.landing_impact         || 0)}
      ${bar("Single-Leg Stability", record.single_leg_stability   || 0)}
    </div>
    <div>
      <div style="font-size:9px;font-weight:900;color:#ef4444;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Risk Profile</div>
      <div style="text-align:center;margin-bottom:14px;">
        <div style="font-size:52px;font-weight:900;font-family:'Outfit',sans-serif;color:${getScoreColor(risk,true)};line-height:1;">${risk}<span style="font-size:20px;">%</span></div>
        <div style="font-size:8px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Injury Risk Score</div>
      </div>
      <div>
        <div style="font-size:8px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Active Risk Factors</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${riskFactors.length > 0
            ? riskFactors.map((r: any) => {
                const c = getSeverityColor(r.severity);
                return `<span style="padding:3px 9px;border-radius:6px;border:1px solid ${c}30;background:${c}10;font-size:8px;font-weight:800;color:#fff;text-transform:uppercase;">${r.name}</span>`;
              }).join("")
            : `<span style="font-size:9px;color:#64748b;font-style:italic;">No specific risk factors flagged.</span>`
          }
        </div>
      </div>
    </div>
  </div>
  ${footer}
</div>

<!-- PAGE 5: PRIORITIES & ROADMAP -->
<div class="page">
  ${header("05","ACTION PLAN","Priorities & Return-to-Performance Roadmap")}
  <div style="flex:1;overflow:hidden;">
    <div style="font-size:9px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Top Priorities</div>
    ${findings.length > 0
      ? findings.slice(0,5).map((f: string, i: number) => `
          <div style="display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:10px 12px;margin-bottom:7px;">
            <span style="background:${i===0?"#22c55e":i===1?"#f59e0b":"#3b82f6"};color:#000;width:20px;height:20px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;flex-shrink:0;">${String(i+1).padStart(2,"0")}</span>
            <span style="font-size:10px;color:#e2e8f0;font-weight:500;">${f}</span>
          </div>`).join("")
      : `<div style="padding:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;font-size:10px;color:#64748b;font-style:italic;">No specific priority actions documented.</div>`
    }

    <div style="font-size:9px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-top:18px;margin-bottom:10px;">8-Week Return-to-Performance Roadmap</div>
    <div style="position:relative;padding:16px 0;">
      <div style="position:absolute;left:0;right:0;top:50%;height:2px;background:rgba(255,255,255,0.06);transform:translateY(-50%);"></div>
      <div style="display:flex;justify-content:space-between;position:relative;z-index:1;">
        ${[
          {week:"W0-1",label:"Baseline",color:"#22c55e"},
          {week:"W2-3",label:"Mobility",color:"#3b82f6"},
          {week:"W3-4",label:"Strength",color:"#8b5cf6"},
          {week:"W5-6",label:"Power",color:"#f59e0b"},
          {week:"W7",label:"Sport",color:"#f97316"},
          {week:"W8",label:"Return",color:"#22c55e"},
        ].map(n => `
          <div style="display:flex;flex-direction:column;align-items:center;width:60px;text-align:center;">
            <div style="width:28px;height:28px;border-radius:50%;background:${n.color};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:#000;box-shadow:0 0 12px ${n.color}50;border:2px solid #08080a;">${n.week.slice(0,2)}</div>
            <div style="font-size:7px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:0.5px;margin-top:7px;">${n.label}</div>
            <div style="font-size:6px;font-weight:700;color:#64748b;margin-top:2px;">${n.week}</div>
          </div>`).join("")}
      </div>
    </div>
  </div>
  ${footer}
</div>

<!-- PAGE 6: EXECUTIVE SUMMARY -->
<div class="page">
  ${header("06","EXECUTIVE SUMMARY","Season Assessment Overview")}
  <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:14px;">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px;">
      <div style="font-size:9px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">English Â· Report</div>
      <p style="font-size:10px;color:#94a3b8;line-height:1.7;font-style:italic;">${record.coach_summary || "No summary evaluation notes assigned."}</p>
    </div>
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px;">
      <div style="font-size:9px;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Deutsch Â· Bericht</div>
      <p style="font-size:10px;color:#94a3b8;line-height:1.7;font-style:italic;">${record.coach_summary || "Keine Zusammenfassung eingetragen."}</p>
    </div>
  </div>
  <!-- Score matrix repeat -->
  <div style="display:flex;gap:10px;margin-top:16px;">
    ${scoreCard("Performance", perf)}
    ${scoreCard("Mobility",    mob)}
    ${scoreCard("Symmetry",    sym)}
    ${scoreCard("Injury Risk", risk, true)}
  </div>
  <div style="margin-top:14px;text-align:center;font-size:8px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:2px;">
    KIO-X HUMAN PERFORMANCE Â· ${record.assessment_date} Â· Confidential
  </div>
  ${footer}
</div>

<script>
  // Auto-trigger print dialog when page loads
  window.onload = function() {
    setTimeout(function() { window.print(); }, 500);
  };
</script>
</body>
</html>`;
}
