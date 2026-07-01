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
    const athleteName = athlete ? `${athlete.first_name} ${athlete.last_name}` : "Athlete";
    const avatarUrl = athlete?.avatar_url || "";

    // Load dynamic HTML & triggers html2pdf
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Popup blocked. Please allow popups to generate PDF.");

      // Construct dynamic html payload
      const htmlContent = buildReportHtml(athleteName, avatarUrl, selectedAssessment);
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Give iframe time to load styling & html2pdf script
      setTimeout(() => {
        if ((printWindow as any).downloadPDF) {
          (printWindow as any).downloadPDF();
          // Close after download completes
          setTimeout(() => {
            printWindow.close();
            setGeneratingPdf(false);
            setPdfSuccess(true);
            setTimeout(() => setPdfSuccess(false), 3000);
          }, 3500);
        } else {
          setGeneratingPdf(false);
        }
      }, 1200);

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
                    {a.first_name.toUpperCase()} {a.last_name.toUpperCase()}
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
              <div className="grid grid-cols-6 gap-1 h-14 opacity-60 group-hover:opacity-90 transition-opacity">
                {[1, 2, 3, 4, 5, 6].map(page => (
                  <div key={page} className="bg-bg-primary border border-white/10 rounded-md flex flex-col justify-between p-1 text-center select-none">
                    <span className="text-[6px] font-mono text-gray-600 font-black">P.{page}</span>
                    <div className="h-4 bg-white/5 rounded-sm flex items-center justify-center">
                      <div className="w-2.5 h-0.5 bg-accent-green/40 rounded-full" />
                    </div>
                  </div>
                ))}
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
// ==========================================
export function buildReportHtml(athleteName: string, avatarUrl: string, record: AssessmentRecord): string {
  const getScoreColor = (score: number, inverse = false) => {
    if (inverse) {
      if (score <= 35) return "#22c55e"; // Low risk is green
      if (score <= 65) return "#f59e0b"; // Medium risk is orange
      return "#ef4444"; // High risk is red
    }
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getSeverityColor = (sev: string) => {
    if (sev === "RED" || sev === "severe") return "#ef4444";
    if (sev === "ORANGE" || sev === "moderate") return "#f59e0b";
    return "#eab308"; // YELLOW/mild
  };

  // 1. Build Body Map dots html (Page 2 silhouette overlay)
  const bodyMapHtml = (record.body_map_zones || [])
    .map((zone: any) => {
      const hs = HOTSPOTS.find(h => h.zone.toLowerCase() === zone.zone_name.toLowerCase());
      if (!hs) return "";
      
      const color = getSeverityColor(zone.severity);
      // Scaled coordinates mapping to fit page 2 container SVG aspect ratio
      const pctX = hs.side === "FRONT" ? (hs.x / 200) * 100 : ((hs.x - 200) / 200) * 100;
      const pctY = (hs.y / 420) * 100;

      return `
        <div style="position: absolute; left: ${pctX}%; top: ${pctY}%; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; border: 1.5px solid #ffffff; transform: translate(-50%, -50%); box-shadow: 0 0 6px ${color};"></div>
      `;
    })
    .join("");

  // 2. Build VALD muscles comparison html
  const valdMusclesHtml = [
    { key: "hamstrings", label: "Hamstrings" },
    { key: "adductors", label: "Adductors" },
    { key: "hip_extension", label: "Hip Extension" },
    { key: "hip_abduction", label: "Hip Abduction" },
    { key: "hip_flexion", label: "Hip Flexion" }
  ].map(group => {
    const leftKg = parseFloat(record[`${group.key}_left`] || 0);
    const rightKg = parseFloat(record[`${group.key}_right`] || 0);
    const maxVal = Math.max(leftKg, rightKg) || 100;
    const leftPct = (leftKg / maxVal) * 100;
    const rightPct = (rightKg / maxVal) * 100;

    const asym = record[`${group.key}_asymmetry`] || 0;
    const status = record[`${group.key}_status`] || "OK";
    const statusColor = getSeverityColor(status === 'OK' ? 'YELLOW' : status === 'MONITOR' ? 'ORANGE' : 'RED');

    return `
      <div class="vald-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #ffffff; letter-spacing: 1px;">${group.label}</span>
          <span style="font-size: 8px; font-weight: 900; color: ${statusColor}; background: ${statusColor}10; border: 1px solid ${statusColor}20; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${asym}% ${status}</span>
        </div>
        <div style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8; font-weight: bold; margin-bottom: 4px;">
              <span>L FORCE</span>
              <span>${leftKg} kg</span>
            </div>
            <div style="height: 5px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
              <div style="height: 100%; width: ${leftPct}%; background: #3b82f6; border-radius: 10px;"></div>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8; font-weight: bold; margin-bottom: 4px;">
              <span>R FORCE</span>
              <span>${rightKg} kg</span>
            </div>
            <div style="height: 5px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
              <div style="height: 100%; width: ${rightPct}%; background: #22c55e; border-radius: 10px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // 3. VALD Asymmetry ranking red bars
  const valdAsymmetryRankingsHtml = [
    { key: "hamstrings", label: "Hamstrings" },
    { key: "adductors", label: "Adductors" },
    { key: "hip_extension", label: "Hip Extension" },
    { key: "hip_abduction", label: "Hip Abduction" },
    { key: "hip_flexion", label: "Hip Flexion" }
  ].map(group => ({
    label: group.label,
    asymmetry: parseFloat(record[`${group.key}_asymmetry`] || 0)
  }))
  .sort((a, b) => b.asymmetry - a.asymmetry)
  .map(m => `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; letter-spacing: 0.5px;">
        <span>${m.label}</span>
        <span style="color: #ef4444;">${m.asymmetry}%</span>
      </div>
      <div style="height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
        <div style="height: 100%; width: ${m.asymmetry}%; background: #ef4444;"></div>
      </div>
    </div>
  `).join("");

  // 4. Functional tests progress bars (2 columns)
  const functionalList = [
    { key: "cspine_rotation", label: "C-Spine Rotation" },
    { key: "forward_bend", label: "Forward Bend" },
    { key: "hip_ir_left", label: "Hip IR Left" },
    { key: "hip_er_both", label: "Hip ER Both" },
    { key: "deep_squat", label: "Deep Squat" },
    { key: "ankle_df", label: "Ankle DF" },
    { key: "great_toe_ext", label: "Great Toe Ext." },
    { key: "single_leg_stand", label: "Single Leg Stand" }
  ];
  
  const midPoint = Math.ceil(functionalList.length / 2);
  const leftColFunctionalHtml = functionalList.slice(0, midPoint).map(t => {
    const val = record[t.key] || 0;
    const color = val >= 70 ? "#22c55e" : val >= 50 ? "#f59e0b" : "#ef4444";
    return `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;">
          <span>${t.label}</span>
          <span style="color: ${color};">${val}%</span>
        </div>
        <div style="height: 3px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
          <div style="height: 100%; width: ${val}%; background-color: ${color};"></div>
        </div>
      </div>
    `;
  }).join("");

  const rightColFunctionalHtml = functionalList.slice(midPoint).map(t => {
    const val = record[t.key] || 0;
    const color = val >= 70 ? "#22c55e" : val >= 50 ? "#f59e0b" : "#ef4444";
    return `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;">
          <span>${t.label}</span>
          <span style="color: ${color};">${val}%</span>
        </div>
        <div style="height: 3px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
          <div style="height: 100%; width: ${val}%; background-color: ${color};"></div>
        </div>
      </div>
    `;
  }).join("");

  // 5. Performance impact scores (Page 4)
  const impactHtml = [
    { key: "acceleration_impact", label: "Acceleration" },
    { key: "sprint_impact", label: "Sprint" },
    { key: "change_of_direction_impact", label: "Change of Direction" },
    { key: "kicking_impact", label: "Kicking Mechanics" },
    { key: "landing_impact", label: "Landing Mechanics" },
    { key: "single_leg_stability", label: "Single-Leg Stability" }
  ].map(i => {
    const val = record[i.key] || 0;
    const color = val >= 85 ? "#22c55e" : val >= 65 ? "#f59e0b" : "#ef4444";
    return `
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #ffffff; margin-bottom: 5px;">
          <span>${i.label}</span>
          <span style="color: ${color};">${val}%</span>
        </div>
        <div style="height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
          <div style="height: 100%; width: ${val}%; background-color: ${color};"></div>
        </div>
      </div>
    `;
  }).join("");

  // 6. Key findings bullet points
  const keyFindingsHtml = (record.key_findings || [])
    .map((f: any) => {
      const color = getSeverityColor(f.severity);
      return `
        <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${color}; margin-top: 5px; flex-shrink: 0; box-shadow: 0 0 4px ${color}"></span>
          <div>
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #ffffff; letter-spacing: 0.5px;">${f.title}: </span>
            <span style="font-size: 10px; color: #94a3b8; font-weight: 500;">${f.description}</span>
          </div>
        </div>
      `;
    }).join("") || `<div style="font-size: 10px; color: #64748b; font-style: italic;">No critical biomechanical findings flagged.</div>`;

  // 7. Priorities list (Page 5)
  const prioritiesHtml = (record.key_findings || []).slice(0, 5)
    .map((f: any, idx: number) => `
      <div style="display: flex; gap: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 12px; border-radius: 12px; margin-bottom: 8px;">
        <span style="background: rgba(34,197,94,0.1); color: #22c55e; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; font-family: 'Outfit'; flex-shrink: 0;">0${idx + 1}</span>
        <div>
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #ffffff; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">${f.title}</span>
          <span style="font-size: 9px; color: #94a3b8; font-weight: 500; line-height: 1.3;">${f.description}</span>
        </div>
      </div>
    `).join("") || `
      <div style="display: flex; gap: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 12px; border-radius: 12px; margin-bottom: 8px;">
        <span style="background: rgba(34,197,94,0.1); color: #22c55e; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; font-family: 'Outfit'; flex-shrink: 0;">01</span>
        <div>
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #ffffff; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">Symmetry Balance</span>
          <span style="font-size: 9px; color: #94a3b8; font-weight: 500;">Reduce general lateral force imbalances across VALD testing profile.</span>
        </div>
      </div>
    `;

  // 8. Risk Factors Pill Badges (Page 4)
  const riskFactorsHtml = (record.risk_factors || [])
    .map((r: any) => {
      const color = getSeverityColor(r.severity);
      return `
        <div style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 8px; border: 1px solid ${color}20; background: ${color}08; font-size: 8px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 4px 8px 0;">
          <span style="width: 5px; height: 5px; border-radius: 50%; background-color: ${color}"></span>
          ${r.name}
        </div>
      `;
    }).join("") || `<div style="font-size: 8px; color: #64748b; font-style: italic;">No special risk factors flagged.</div>`;

  // 9. Radar chart coordinates calculation
  // Radar uses 6 axis (Squat, Rotation, Post.Chain, Balance, Ankle, Hip)
  const radarAxes = [
    { label: "Squat", val: record.deep_squat || 70 },
    { label: "Rotation", val: record.cspine_rotation || 70 },
    { label: "Post. Chain", val: record.forward_bend || 70 },
    { label: "Balance", val: record.single_leg_stand || 70 },
    { label: "Ankle", val: record.ankle_df || 70 },
    { label: "Hip", val: record.hip_ir_left || 70 }
  ];

  const radarPoints = radarAxes.map((axis, i) => {
    const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
    const r = (axis.val / 100) * 72;
    const x = 100 + r * Math.cos(angle);
    const y = 100 + r * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  // 10. Circular Gauge Donut calculation for Risk (Page 4)
  const riskCircleVal = record.risk_score || 50;
  const riskCircumference = 2 * Math.PI * 45; // radius = 45, cx=60, cy=60
  const riskDashoffset = riskCircumference - (riskCircleVal / 100) * riskCircumference;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>KIO-X Lab Report - ${athleteName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #000;
            color: #fff;
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact;
          }

          .pdf-page {
            width: 210mm;
            height: 297mm;
            box-sizing: border-box;
            padding: 20mm;
            position: relative;
            background: #08080a;
            color: #ffffff;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .pdf-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }

          /* Watermark background options */
          .watermark-grid {
            position: absolute;
            inset: 0;
            opacity: 0.02;
            background-image: radial-gradient(#22c55e 1px, transparent 1px);
            background-size: 20px 20px;
            pointer-events: none;
          }

          /* Header */
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #22c55e;
            padding-bottom: 12px;
            margin-bottom: 20px;
            position: relative;
            z-index: 10;
          }

          .logo-text {
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 14px;
            letter-spacing: 2px;
            color: #ffffff;
          }
          
          .logo-green {
            color: #22c55e;
          }

          .page-num {
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 14px;
            color: #64748b;
          }

          .report-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 22px;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0 0 3px 0;
          }

          .report-subtitle {
            font-size: 9px;
            font-weight: 800;
            color: #22c55e;
            text-transform: uppercase;
            letter-spacing: 4px;
            margin: 0;
          }

          /* Row of 4 Score Cards */
          .score-grid {
            display: grid;
            grid-template-cols: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }

          .score-card {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 16px;
            padding: 15px 12px;
            text-align: center;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 95px;
          }

          .score-card-label {
            font-size: 8px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 5px;
          }

          .score-card-value {
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 24px;
          }

          .score-card-desc {
            font-size: 7px;
            color: #64748b;
            font-weight: 600;
            line-height: 1.2;
            margin-top: 5px;
            text-transform: uppercase;
          }

          .score-bar-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
          }

          /* Content cards */
          .content-card {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 20px;
            padding: 20px;
            position: relative;
          }

          .content-card-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 11px;
            color: #22c55e;
            text-transform: uppercase;
            letter-spacing: 2px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding-bottom: 8px;
            margin-bottom: 12px;
          }

          /* Footer */
          .report-footer {
            border-top: 1px solid rgba(255,255,255,0.05);
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 7px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            position: relative;
            z-index: 10;
          }

          /* Page 1 Specific Styling */
          .page1-hero {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: 0;
            filter: blur(2px);
          }

          .page1-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, rgba(5,5,6,0.92) 0%, rgba(8,8,10,0.96) 100%);
            z-index: 1;
          }

          .hero-content {
            position: relative;
            z-index: 10;
            margin-bottom: 30px;
            margin-top: 30px;
          }

          .athlete-hero-name {
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 40px;
            line-height: 1;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #ffffff;
            margin-bottom: 6px;
          }

          /* VALD Force Profile style */
          .vald-card {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 16px;
            padding: 15px;
            margin-bottom: 12px;
          }

          /* Checklist milestone roadmap */
          .roadmap-timeline {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            padding: 20px 10px;
          }
          
          .roadmap-line {
            position: absolute;
            left: 5%;
            right: 5%;
            top: 50%;
            height: 2px;
            background: rgba(255,255,255,0.05);
            z-index: 1;
          }

          .roadmap-node {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            width: 70px;
          }

          .roadmap-dot {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            font-weight: 900;
            font-family: 'Outfit';
            border: 2px solid #08080a;
            box-shadow: 0 0 10px rgba(34,197,94,0.1);
          }

          .roadmap-label {
            font-size: 7px;
            font-weight: 900;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 8px;
          }

          .roadmap-week {
            font-size: 6px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-top: 2px;
          }

        </style>
      </head>
      <body>

        <!-- ================= PAGE 1 ================= -->
        <div class="pdf-page" id="page-1">
          <div class="watermark-grid"></div>
          ${avatarUrl ? `<div class="page1-hero" style="background-image: url('${avatarUrl}');"></div>` : `<div class="page1-hero" style="background: radial-gradient(circle, rgba(16,185,129,0.05) 0%, rgba(8,8,10,1) 80%);"></div>`}
          <div class="page1-overlay"></div>

          <!-- Header -->
          <div class="report-header">
            <span class="logo-text">KIO-<span class="logo-green">X</span> PERFORMANCE</span>
            <span class="page-num">01</span>
          </div>

          <!-- Hero Name -->
          <div class="hero-content">
            <p class="report-subtitle" style="margin-bottom: 5px;">Elite Athlete Dossier</p>
            <h1 class="athlete-hero-name">${athleteName}</h1>
            <p style="font-size: 10px; font-weight: 900; color: #94a3b8; margin: 0; text-transform: uppercase; letter-spacing: 2px;">
              ${record.assessment_type.replace(/_/g, " ")} // DATE: ${record.assessment_date} // SEASON: ${record.season || "2026/2027"}
            </p>
          </div>

          <!-- Row of 4 scores -->
          <div style="position: relative; z-index: 10;">
            <div class="score-grid">
              <div class="score-card">
                <span class="score-card-label">Performance</span>
                <span class="score-card-value" style="color: ${getScoreColor(record.performance_score || 0)};">${record.performance_score || 0}%</span>
                <span class="score-bar-bottom" style="background: ${getScoreColor(record.performance_score || 0)};"></span>
                <span class="score-card-desc">Global Readiness</span>
              </div>
              <div class="score-card">
                <span class="score-card-label">Mobility</span>
                <span class="score-card-value" style="color: ${getScoreColor(record.mobility_score || 0)};">${record.mobility_score || 0}%</span>
                <span class="score-bar-bottom" style="background: ${getScoreColor(record.mobility_score || 0)};"></span>
                <span class="score-card-desc">Joint Ranges</span>
              </div>
              <div class="score-card">
                <span class="score-card-label">Symmetry</span>
                <span class="score-card-value" style="color: ${getScoreColor(record.symmetry_score || 0)};">${record.symmetry_score || 0}%</span>
                <span class="score-bar-bottom" style="background: ${getScoreColor(record.symmetry_score || 0)};"></span>
                <span class="score-card-desc">Force Balance</span>
              </div>
              <div class="score-card">
                <span class="score-card-label">Injury Risk</span>
                <span class="score-card-value" style="color: ${getScoreColor(record.risk_score || 0, true)};">${record.risk_score || 0}%</span>
                <span class="score-bar-bottom" style="background: ${getScoreColor(record.risk_score || 0, true)};"></span>
                <span class="score-card-desc">Risk Index</span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-cols: 1fr; gap: 20px;">
              <!-- Key Findings -->
              <div class="content-card">
                <h3 class="content-card-title">Key Biomechanical Findings</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  ${keyFindingsHtml}
                </div>
              </div>
              
              <!-- Coach Summary -->
              <div class="content-card">
                <h3 class="content-card-title">Tactical Directives & Action Plan</h3>
                <p style="font-size: 10px; color: #94a3b8; font-style: italic; line-height: 1.5; margin: 0;">
                  "${record.coach_summary || 'No direct summary evaluation notes assigned.'}"
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="report-footer">
            <span>KIO-X Performance Center | confidential</span>
            <span>Functional Check-up + VALD data</span>
          </div>
        </div>

        <!-- ================= PAGE 2 ================= -->
        <div class="pdf-page" id="page-2">
          <div class="watermark-grid"></div>
          
          <div class="report-header">
            <span class="logo-text">KIO-<span class="logo-green">X</span> PERFORMANCE</span>
            <span class="page-num">02</span>
          </div>

          <div>
            <h2 class="report-title">Movement & Mobility Dashboard</h2>
            <p class="report-subtitle" style="margin-bottom: 25px;">Biomechanical range scanning metrics</p>
          </div>

          <!-- Radar Chart & Body Map Side by Side -->
          <div style="display: grid; grid-template-cols: 1.1fr 0.9fr; gap: 20px; margin-bottom: 25px;">
            
            <!-- Left: Radar Chart -->
            <div class="content-card" style="text-align: center;">
              <h3 class="content-card-title" style="text-align: left;">Mobility Profile</h3>
              <div style="position: relative; width: 100%; height: 210px; display: flex; justify-content: center; align-items: center;">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <!-- Concentric Background rings -->
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
                  <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
                  <circle cx="100" cy="100" r="20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />

                  <!-- Pentagon lines -->
                  ${[0, 1, 2, 3, 4, 5].map(i => {
                    const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
                    const x = 100 + 80 * Math.cos(angle);
                    const y = 100 + 80 * Math.sin(angle);
                    
                    const labelX = 100 + 92 * Math.cos(angle);
                    const labelY = 100 + 92 * Math.sin(angle);
                    
                    return `
                      <line x1="100" y1="100" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
                      <text x="${labelX}" y="${labelY + 3}" fill="#64748b" font-size="7" font-weight="bold" font-family="Outfit" text-anchor="middle">${radarAxes[i].label.toUpperCase()}</text>
                    `;
                  }).join("")}

                  <!-- Filled area representing athlete metrics -->
                  <polygon points="${radarPoints}" fill="rgba(34,197,94,0.15)" stroke="#22c55e" stroke-width="1.5" />
                </svg>
              </div>
            </div>

            <!-- Right: Body Map Zone -->
            <div class="content-card" style="position: relative;">
              <h3 class="content-card-title">Body Map Focus Zones</h3>
              
              <!-- Silhouette outline rendering inside PDF -->
              <div style="position: relative; width: 160px; height: 210px; margin: 0 auto;">
                <svg viewBox="0 0 100 220" style="width: 100%; height: 100%;">
                  <path
                    d="M 50 15 
                       C 42 15, 38 21, 38 28
                       C 38 35, 42 41, 50 41
                       C 58 41, 62 35, 62 28
                       C 62 21, 58 15, 50 15 Z
                       
                       M 45 41 L 55 41 L 55 48 L 45 48 Z
                       
                       M 45 48 
                       C 33 49, 30 55, 27 63
                       L 14 105
                       C 12 110, 16 114, 20 110
                       L 28 80 L 28 125
                       C 28 127, 29 129, 31 129
                       C 33 129, 34 127, 34 125
                       L 34 70 L 37 70 L 37 135
                       L 63 135 L 63 70 L 66 70
                       L 66 125
                       C 66 127, 67 129, 69 129
                       C 71 129, 72 127, 72 125
                       L 72 80 L 80 110
                       C 84 114, 88 110, 86 105
                       L 73 63
                       C 70 55, 67 49, 55 48 Z
                       
                       M 37 135 L 63 135 L 60 155 L 40 155 Z
                       
                       M 40 155
                       L 35 200
                       L 38 245
                       C 38 249, 43 249, 44 245
                       L 49 200 L 49 155 Z
                       
                       M 60 155
                       L 65 200
                       L 62 245
                       C 62 249, 57 249, 56 245
                       L 51 200 L 51 155 Z"
                    fill="rgba(255,255,255,0.01)"
                    stroke="rgba(255,255,255,0.1)"
                    stroke-width="1.5"
                  />
                </svg>
                <!-- Render overlay dots -->
                ${bodyMapHtml}
              </div>
            </div>

          </div>

          <!-- Bottom: Functional tests split columns -->
          <div class="content-card" style="margin-bottom: 20px;">
            <h3 class="content-card-title">Functional Mobility Status</h3>
            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 30px;">
              <div>
                ${leftColFunctionalHtml}
              </div>
              <div>
                ${rightColFunctionalHtml}
              </div>
            </div>
          </div>

          <!-- Interpretation textbox -->
          <div class="content-card" style="background: rgba(34,197,94,0.01); border: 1px dashed rgba(34,197,94,0.15)">
            <span style="font-size: 8px; font-weight: 900; color: #22c55e; text-transform: uppercase; letter-spacing: 2.5px; display: block; margin-bottom: 4px;">Biomechanical Assessment Guideline</span>
            <p style="font-size: 8px; color: #94a3b8; font-weight: 500; margin: 0; line-height: 1.4;">
              Assessment values above represent percentage capabilities compared to optimal structural baseline values. Strength and range imbalances above 15% indicate focal loading risks and warrant targeted intervention protocols.
            </p>
          </div>

          <div class="report-footer">
            <span>KIO-X Performance Center | confidential</span>
            <span>Functional Check-up + VALD data</span>
          </div>
        </div>

        <!-- ================= PAGE 3 ================= -->
        <div class="pdf-page" id="page-3">
          <div class="watermark-grid"></div>
          
          <div class="report-header">
            <span class="logo-text">KIO-<span class="logo-green">X</span> PERFORMANCE</span>
            <span class="page-num">03</span>
          </div>

          <div>
            <h2 class="report-title">VALD Force Profile</h2>
            <p class="report-subtitle" style="margin-bottom: 25px;">Maximum Voluntary Isometric Contraction telemetry</p>
          </div>

          <!-- Muscle cards grid -->
          <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
            ${valdMusclesHtml}
          </div>

          <!-- Asymmetry ranking card -->
          <div class="content-card">
            <h3 class="content-card-title">Asymmetry Severity Rankings</h3>
            <div style="display: grid; grid-template-cols: 1.2fr 0.8fr; gap: 30px; align-items: center;">
              <div>
                ${valdAsymmetryRankingsHtml}
              </div>
              <div style="background: rgba(239,68,68,0.03); border: 1px solid rgba(239,68,68,0.08); border-radius: 12px; padding: 15px; text-align: center;">
                <span style="font-size: 9px; font-weight: 900; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px;">Max Imbalance Warning</span>
                <p style="font-size: 8px; color: #94a3b8; font-weight: 500; margin: 0; line-height: 1.4;">
                  Any unilateral asymmetries exceeding 10% indicate compensatory patterns, which significantly raises muscle strain risks.
                </p>
              </div>
            </div>
          </div>

          <div class="report-footer">
            <span>KIO-X Performance Center | confidential</span>
            <span>Functional Check-up + VALD data</span>
          </div>
        </div>

        <!-- ================= PAGE 4 ================= -->
        <div class="pdf-page" id="page-4">
          <div class="watermark-grid"></div>
          
          <div class="report-header">
            <span class="logo-text">KIO-<span class="logo-green">X</span> PERFORMANCE</span>
            <span class="page-num">04</span>
          </div>

          <div>
            <h2 class="report-title">Performance Impact & Risk Profile</h2>
            <p class="report-subtitle" style="margin-bottom: 25px;">Translational capacity and structural safety thresholds</p>
          </div>

          <div style="display: grid; grid-template-cols: 1.1fr 0.9fr; gap: 20px; margin-bottom: 25px;">
            
            <!-- Left: Performance Impact -->
            <div class="content-card">
              <h3 class="content-card-title">Athletic Performance Impact</h3>
              <div style="padding-top: 10px;">
                ${impactHtml}
              </div>
            </div>

            <!-- Right: Injury Risk Circular Donut Gauge -->
            <div class="content-card" style="text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
              <h3 class="content-card-title" style="text-align: left;">Skeletal Load Risk Index</h3>
              
              <!-- Donut Chart -->
              <div style="position: relative; width: 120px; height: 120px; margin: 15px auto;">
                <svg width="120" height="120" viewBox="0 0 120 120" style="transform: rotate(-90deg);">
                  <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="8" />
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="45" 
                    fill="none" 
                    stroke="${getScoreColor(riskCircleVal, true)}" 
                    stroke-width="8" 
                    stroke-dasharray="${riskCircumference}"
                    stroke-dashoffset="${riskDashoffset}"
                    stroke-linecap="round"
                  />
                </svg>
                <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                  <span style="font-family: 'Outfit'; font-weight: 900; font-size: 26px; color: ${getScoreColor(riskCircleVal, true)}; line-height: 1;">${riskCircleVal}%</span>
                  <span style="font-size: 7px; font-weight: 900; color: #64748b; letter-spacing: 0.5px; margin-top: 2px;">RISK RATE</span>
                </div>
              </div>

              <!-- Risk Factors badges -->
              <div style="text-align: center; padding-top: 10px;">
                <span style="font-size: 7px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">ACTIVE RISK BADGES</span>
                <div style="max-height: 55px; overflow: hidden;">
                  ${riskFactorsHtml}
                </div>
              </div>
            </div>

          </div>

          <!-- Bottom: Performance translation cards grid -->
          <div class="content-card">
            <h3 class="content-card-title">Biomechanical Sport translation</h3>
            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 15px;">
              <div style="padding: 10px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.02); border-radius: 12px;">
                <span style="font-size: 9px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 3px;">Sprint & Acceleration</span>
                <p style="font-size: 8px; color: #94a3b8; font-weight: 500; margin: 0; line-height: 1.3;">Driven by ankle plantarflexion range and posterior extension chain forces.</p>
              </div>
              <div style="padding: 10px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.02); border-radius: 12px;">
                <span style="font-size: 9px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 3px;">Change of Direction</span>
                <p style="font-size: 8px; color: #94a3b8; font-weight: 500; margin: 0; line-height: 1.3;">Depends heavily on lateral hip abductor/adductor stabilizers and groin health.</p>
              </div>
              <div style="padding: 10px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.02); border-radius: 12px;">
                <span style="font-size: 9px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 3px;">Kicking Mechanics</span>
                <p style="font-size: 8px; color: #94a3b8; font-weight: 500; margin: 0; line-height: 1.3;">Facilitated by hip flexor elasticity and pelvic rotation range limits.</p>
              </div>
              <div style="padding: 10px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.02); border-radius: 12px;">
                <span style="font-size: 9px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 3px;">Single-Leg Balance Control</span>
                <p style="font-size: 8px; color: #94a3b8; font-weight: 500; margin: 0; line-height: 1.3;">Governed by ankle dorsiflexion mobility and knee alignment symmetry.</p>
              </div>
            </div>
          </div>

          <div class="report-footer">
            <span>KIO-X Performance Center | confidential</span>
            <span>Functional Check-up + VALD data</span>
          </div>
        </div>

        <!-- ================= PAGE 5 ================= -->
        <div class="pdf-page" id="page-5">
          <div class="watermark-grid"></div>
          
          <div class="report-header">
            <span class="logo-text">KIO-<span class="logo-green">X</span> PERFORMANCE</span>
            <span class="page-num">05</span>
          </div>

          <div>
            <h2 class="report-title">Roadmap & Focus Milestones</h2>
            <p class="report-subtitle" style="margin-bottom: 25px;">Strategic integration timeline and priorities</p>
          </div>

          <!-- Priorities -->
          <div class="content-card" style="margin-bottom: 20px;">
            <h3 class="content-card-title">Top Priority Matrices</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${prioritiesHtml}
            </div>
          </div>

          <!-- Timeline roadmap -->
          <div class="content-card" style="margin-bottom: 20px;">
            <h3 class="content-card-title">Return To Performance Roadmap</h3>
            <div class="roadmap-timeline">
              <div class="roadmap-line"></div>
              
              <div class="roadmap-node">
                <div class="roadmap-dot" style="background: rgba(34,197,94,0.1); color: #22c55e; border-color: #22c55e;">W0</div>
                <div class="roadmap-label">Check-up</div>
                <div class="roadmap-week">Baseline</div>
              </div>
              <div class="roadmap-node">
                <div class="roadmap-dot" style="background: rgba(255,255,255,0.03); color: #94a3b8; border-color: rgba(255,255,255,0.1);">W2</div>
                <div class="roadmap-label">Mobility</div>
                <div class="roadmap-week">Ranges</div>
              </div>
              <div class="roadmap-node">
                <div class="roadmap-dot" style="background: rgba(255,255,255,0.03); color: #94a3b8; border-color: rgba(255,255,255,0.1);">W4</div>
                <div class="roadmap-label">Strength</div>
                <div class="roadmap-week">VALD Force</div>
              </div>
              <div class="roadmap-node">
                <div class="roadmap-dot" style="background: rgba(255,255,255,0.03); color: #94a3b8; border-color: rgba(255,255,255,0.1);">W6</div>
                <div class="roadmap-label">Integration</div>
                <div class="roadmap-week">Dynamic</div>
              </div>
              <div class="roadmap-node">
                <div class="roadmap-dot" style="background: rgba(34,197,94,0.1); color: #22c55e; border-color: #22c55e;">W8</div>
                <div class="roadmap-label">Re-Test</div>
                <div class="roadmap-week">Verification</div>
              </div>
            </div>
          </div>

          <!-- Main Targets list -->
          <div class="content-card">
            <h3 class="content-card-title">Main Goals before Re-Testing</h3>
            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 15px; font-size: 9px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;"><span style="color: #22c55e; margin-right: 4px;">✔</span> Complete 8-Week range protocols</div>
                <div style="display: flex; align-items: center; gap: 8px;"><span style="color: #22c55e; margin-right: 4px;">✔</span> Restore hip IR to above 70%</div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;"><span style="color: #22c55e; margin-right: 4px;">✔</span> Mitigate VALD force asymmetry to &lt;10%</div>
                <div style="display: flex; align-items: center; gap: 8px;"><span style="color: #22c55e; margin-right: 4px;">✔</span> Resolve active flagged pain indicators</div>
              </div>
            </div>
          </div>

          <div class="report-footer">
            <span>KIO-X Performance Center | confidential</span>
            <span>Functional Check-up + VALD data</span>
          </div>
        </div>

        <!-- ================= PAGE 6 ================= -->
        <div class="pdf-page" id="page-6">
          <div class="watermark-grid"></div>
          
          <div class="report-header">
            <span class="logo-text">KIO-<span class="logo-green">X</span> PERFORMANCE</span>
            <span class="page-num">06</span>
          </div>

          <div>
            <h2 class="report-title">Executive Summary</h2>
            <p class="report-subtitle" style="margin-bottom: 25px;">Bilingual summary diagnostics</p>
          </div>

          <!-- Deutsch vs English -->
          <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 35px; flex-grow: 1;">
            
            <!-- Left: Deutsch -->
            <div class="content-card" style="display: flex; flex-direction: column; justify-content: space-between;">
              <h3 class="content-card-title">DEUTSCH // BERICHT</h3>
              <p style="font-size: 10px; color: #94a3b8; line-height: 1.6; font-style: italic; margin: 0; flex-grow: 1;">
                "${record.coach_summary || 'Keine spezifische Zusammenfassung eingetragen.'}"
              </p>
              <div style="font-size: 8px; font-weight: 800; color: #64748b; margin-top: 10px; text-transform: uppercase;">Deutsche Übersetzung (Vorlage)</div>
            </div>

            <!-- Right: English -->
            <div class="content-card" style="display: flex; flex-direction: column; justify-content: space-between;">
              <h3 class="content-card-title">ENGLISH // REPORT</h3>
              <p style="font-size: 10px; color: #94a3b8; line-height: 1.6; font-style: italic; margin: 0; flex-grow: 1;">
                "${record.coach_summary || 'No direct summary evaluation notes assigned.'}"
              </p>
              <div style="font-size: 8px; font-weight: 800; color: #64748b; margin-top: 10px; text-transform: uppercase;">English Translation</div>
            </div>

          </div>

          <!-- Bottom repeated overall scores -->
          <div class="content-card" style="margin-bottom: 20px;">
            <h3 class="content-card-title">Core Performance Readiness Matrix</h3>
            <div class="score-grid" style="margin-bottom: 0;">
              <div class="score-card" style="height: 75px; padding: 10px 8px;">
                <span class="score-card-label" style="font-size: 7px;">Performance</span>
                <span class="score-card-value" style="font-size: 18px; color: ${getScoreColor(record.performance_score || 0)};">${record.performance_score || 0}%</span>
                <span class="score-bar-bottom" style="background: ${getScoreColor(record.performance_score || 0)};"></span>
              </div>
              <div class="score-card" style="height: 75px; padding: 10px 8px;">
                <span class="score-card-label" style="font-size: 7px;">Mobility</span>
                <span class="score-card-value" style="font-size: 18px; color: ${getScoreColor(record.mobility_score || 0)};">${record.mobility_score || 0}%</span>
                <span class="score-bar-bottom" style="background: ${getScoreColor(record.mobility_score || 0)};"></span>
              </div>
              <div class="score-card" style="height: 75px; padding: 10px 8px;">
                <span class="score-card-label" style="font-size: 7px;">Symmetry</span>
                <span class="score-card-value" style="font-size: 18px; color: ${getScoreColor(record.symmetry_score || 0)};">${record.symmetry_score || 0}%</span>
                <span class="score-bar-bottom" style="background: ${getScoreColor(record.symmetry_score || 0)};"></span>
              </div>
              <div class="score-card" style="height: 75px; padding: 10px 8px;">
                <span class="score-card-label" style="font-size: 7px;">Injury Risk</span>
                <span class="score-card-value" style="font-size: 18px; color: ${getScoreColor(record.risk_score || 0, true)};">${record.risk_score || 0}%</span>
                <span class="score-bar-bottom" style="background: ${getScoreColor(record.risk_score || 0, true)};"></span>
              </div>
            </div>
          </div>

          <div class="report-footer">
            <span>KIO-X Performance Center | confidential</span>
            <span>Functional Check-up + VALD data</span>
          </div>
        </div>

        <script>
          function downloadPDF() {
            const opt = {
              margin:       [0, 0, 0, 0],
              filename:     'KIO-X_Performance_Report_${athleteName.replace(/\s+/g, '_')}_${record.assessment_date}.pdf',
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true, logging: false },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            html2pdf().set(opt).from(document.body).save();
          }
        </script>
      </body>
    </html>
  `;
}
