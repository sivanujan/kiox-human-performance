"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Activity, 
  Target, 
  Zap, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  ClipboardCheck,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Scale,
  Plus,
  Trash2,
  FileText,
  Bookmark
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import BodyMap from "../forms-protocols/BodyMap";

interface AthleteAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

const STEPS = [
  { step: 1, title: "Basic Info", icon: <FileText size={14} /> },
  { step: 2, title: "Overall Scores", icon: <Activity size={14} /> },
  { step: 3, title: "VALD Force Profile", icon: <Scale size={14} /> },
  { step: 4, title: "Functional Tests", icon: <ShieldCheck size={14} /> },
  { step: 5, title: "Body Map", icon: <Target size={14} /> },
  { step: 6, title: "Performance Impact", icon: <Zap size={14} /> },
  { step: 7, title: "Key Findings", icon: <BarChart3 size={14} /> },
  { step: 8, title: "Review & Submit", icon: <ClipboardCheck size={14} /> }
];

export default function AthleteAssessmentModal({ isOpen, onClose, athleteId, athleteName }: AthleteAssessmentModalProps) {
  const [resolvedAthleteName, setResolvedAthleteName] = useState(athleteName);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    assessment_type: "FULL_ASSESSMENT" as "FUNCTIONAL_CHECKUP" | "VALD_FORCE" | "MATCH_PERFORMANCE" | "FULL_ASSESSMENT",
    season: "2026/2027",
    height_cm: "",
    weight_kg: "",
    position: "FORWARD" as "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD",
    status: "DRAFT" as "DRAFT" | "SUBMITTED",

    // Overall Scores
    performance_score: 70,
    mobility_score: 70,
    symmetry_score: 70,
    risk_score: 70,

    // VALD Force Profile
    hamstrings_left: "", hamstrings_right: "", hamstrings_asymmetry: 0, hamstrings_status: "OK" as "OK" | "MONITOR" | "FOCUS",
    adductors_left: "", adductors_right: "", adductors_asymmetry: 0, adductors_status: "OK" as "OK" | "MONITOR" | "FOCUS",
    hip_extension_left: "", hip_extension_right: "", hip_extension_asymmetry: 0, hip_extension_status: "OK" as "OK" | "MONITOR" | "FOCUS",
    hip_abduction_left: "", hip_abduction_right: "", hip_abduction_asymmetry: 0, hip_abduction_status: "OK" as "OK" | "MONITOR" | "FOCUS",
    hip_flexion_left: "", hip_flexion_right: "", hip_flexion_asymmetry: 0, hip_flexion_status: "OK" as "OK" | "MONITOR" | "FOCUS",

    // Functional Movement Tests
    cspine_rotation: 75,
    forward_bend: 75,
    hip_ir_left: 75,
    hip_er_both: 75,
    deep_squat: 75,
    ankle_df: 75,
    great_toe_ext: 75,
    single_leg_stand: 75,

    // Body Map
    body_map_zones: [] as any[],

    // Performance Impact
    acceleration_impact: 75,
    sprint_impact: 75,
    change_of_direction_impact: 75,
    kicking_impact: 75,
    landing_impact: 75,
    single_leg_stability: 75,

    // Key Findings & Summary
    key_findings: [] as { title: string; description: string; severity: "RED" | "ORANGE" | "YELLOW" }[],
    risk_factors: [] as { name: string; severity: "RED" | "ORANGE" | "YELLOW" }[],
    coach_summary: "",

    // Progress
    previous_assessment_id: "",
    improvement_notes: "",
    retest_recommended_date: ""
  });

  // Basic lists for interactive entry
  const [findingTitle, setFindingTitle] = useState("");
  const [findingDesc, setFindingDesc] = useState("");
  const [findingSev, setFindingSev] = useState<"RED" | "ORANGE" | "YELLOW">("YELLOW");

  const [riskFactorName, setRiskFactorName] = useState("");
  const [riskFactorSev, setRiskFactorSev] = useState<"RED" | "ORANGE" | "YELLOW">("YELLOW");

  // Fetch name & historical assessments
  useEffect(() => {
    const fetchAthleteDetails = async () => {
      if (!athleteId || athleteId === "undefined") return;
      const supabase = createClient();
      
      // Fetch profile
      try {
        const { data: p } = await supabase.from("profiles").select("first_name, last_name, height, weight, position_played").eq("id", athleteId).single();
        if (p) {
          setResolvedAthleteName(`${p.first_name || ""} ${p.last_name || ""}`.trim());
          setFormData(prev => ({
            ...prev,
            height_cm: p.height?.toString() || "",
            weight_kg: p.weight?.toString() || "",
            position: (p.position_played?.toUpperCase() as any) || "FORWARD"
          }));
        }
      } catch (e) {
        console.error(e);
      }

      // Fetch assessments list
      try {
        const res = await fetch(`/api/admin/athlete/${athleteId}/assessments`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.assessments || []);
          const completed = (data.assessments || []).filter((a: any) => a.status === 'SUBMITTED');
          if (completed.length > 0) {
            setFormData(prev => ({
              ...prev,
              previous_assessment_id: completed[0].id
            }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (isOpen) {
      fetchAthleteDetails();
      setStep(1);
      setError("");
    }
  }, [isOpen, athleteId]);

  // Dynamic Overall Scores Auto-Calculation
  const recalculateOverallScores = (data: typeof formData) => {
    // 1. Mobility Score = average of all 8 functional tests
    const functionalKeys = [
      "cspine_rotation", "forward_bend", "hip_ir_left", "hip_er_both", 
      "deep_squat", "ankle_df", "great_toe_ext", "single_leg_stand"
    ];
    const mobilitySum = functionalKeys.reduce((sum, key) => sum + (Number(data[key as keyof typeof data]) || 0), 0);
    const calculatedMobility = Math.round(mobilitySum / functionalKeys.length);

    // 2. Symmetry Score = 100 - average of all active VALD asymmetry values
    const valdMuscles = ["hamstrings", "adductors", "hip_extension", "hip_abduction", "hip_flexion"];
    let valdCount = 0;
    let valdAsymSum = 0;
    
    valdMuscles.forEach(m => {
      const left = parseFloat(String(data[`${m}_left` as keyof typeof data]));
      const right = parseFloat(String(data[`${m}_right` as keyof typeof data]));
      if (!isNaN(left) && !isNaN(right) && (left > 0 || right > 0)) {
        const asym = data[`${m}_asymmetry` as keyof typeof data] as number;
        valdAsymSum += asym;
        valdCount++;
      }
    });
    
    const avgAsymmetry = valdCount > 0 ? (valdAsymSum / valdCount) : 0;
    const calculatedSymmetry = Math.max(0, Math.min(100, Math.round(100 - avgAsymmetry)));

    // 3. Risk Score = based on injuries in Body Map + average asymmetry
    let calculatedRisk = 0;
    if (data.body_map_zones && Array.isArray(data.body_map_zones)) {
      data.body_map_zones.forEach(zone => {
        if (zone.severity === "RED") calculatedRisk += 25;
        else if (zone.severity === "ORANGE") calculatedRisk += 15;
        else if (zone.severity === "YELLOW") calculatedRisk += 8;
      });
    }
    calculatedRisk += Math.round(avgAsymmetry * 1.2);
    const lowMobilityRisk = Math.max(0, 80 - calculatedMobility) * 0.4;
    calculatedRisk += Math.round(lowMobilityRisk);
    calculatedRisk = Math.max(10, Math.min(95, calculatedRisk)); // clamp to realistic bounds

    // 4. Performance Score = weighted average of mobility, symmetry and performance impacts
    const impactKeys = [
      "acceleration_impact", "sprint_impact", "change_of_direction_impact",
      "kicking_impact", "landing_impact", "single_leg_stability"
    ];
    const impactSum = impactKeys.reduce((sum, key) => sum + (Number(data[key as keyof typeof data]) || 0), 0);
    const avgImpact = impactSum / impactKeys.length;
    
    const calculatedPerformance = Math.max(0, Math.min(100, Math.round(
      (calculatedMobility * 0.3) + 
      (calculatedSymmetry * 0.3) + 
      (avgImpact * 0.4)
    )));

    return {
      performance_score: calculatedPerformance,
      mobility_score: calculatedMobility,
      symmetry_score: calculatedSymmetry,
      risk_score: calculatedRisk
    };
  };

  useEffect(() => {
    const computed = recalculateOverallScores(formData);
    if (
      computed.performance_score !== formData.performance_score ||
      computed.mobility_score !== formData.mobility_score ||
      computed.symmetry_score !== formData.symmetry_score ||
      computed.risk_score !== formData.risk_score
    ) {
      setFormData(prev => ({
        ...prev,
        ...computed
      }));
    }
  }, [
    formData.cspine_rotation, formData.forward_bend, formData.hip_ir_left, formData.hip_er_both, 
    formData.deep_squat, formData.ankle_df, formData.great_toe_ext, formData.single_leg_stand,
    formData.hamstrings_left, formData.hamstrings_right, formData.adductors_left, formData.adductors_right, 
    formData.hip_extension_left, formData.hip_extension_right, formData.hip_abduction_left, formData.hip_abduction_right, 
    formData.hip_flexion_left, formData.hip_flexion_right, formData.body_map_zones, 
    formData.acceleration_impact, formData.sprint_impact, formData.change_of_direction_impact, 
    formData.kicking_impact, formData.landing_impact, formData.single_leg_stability
  ]);

  // Auto calculate BMI
  const heightNum = parseFloat(formData.height_cm);
  const weightNum = parseFloat(formData.weight_kg);
  const calculatedBMI = (heightNum > 0 && weightNum > 0) 
    ? (weightNum / Math.pow(heightNum / 100, 2)).toFixed(1) 
    : "0.0";

  // VALD Asymmetry calculator
  const updateVALD = (muscle: string, field: "left" | "right", value: string) => {
    setFormData(prev => {
      const updated = { ...prev };
      
      const leftKey = `${muscle}_left`;
      const rightKey = `${muscle}_right`;
      const asymmetryKey = `${muscle}_asymmetry`;
      const statusKey = `${muscle}_status`;

      // Update value
      (updated as any)[leftKey] = value;
      if (field === "left") (updated as any)[leftKey] = value;
      if (field === "right") (updated as any)[rightKey] = value;

      const leftVal = parseFloat(String((updated as any)[leftKey]));
      const rightVal = parseFloat(String((updated as any)[rightKey]));

      if (!isNaN(leftVal) && !isNaN(rightVal)) {
        const maxVal = Math.max(leftVal, rightVal);
        const asymmetryVal = maxVal > 0 ? Math.round((Math.abs(leftVal - rightVal) / maxVal) * 100 * 10) / 10 : 0;
        let statusVal: "OK" | "MONITOR" | "FOCUS" = "OK";
        if (asymmetryVal > 20) statusVal = "FOCUS";
        else if (asymmetryVal >= 10) statusVal = "MONITOR";

        (updated as any)[asymmetryKey] = asymmetryVal;
        (updated as any)[statusKey] = statusVal;
      } else {
        (updated as any)[asymmetryKey] = 0;
        (updated as any)[statusKey] = "OK";
      }

      return updated;
    });
  };

  // Add Findings & Risks
  const addFinding = () => {
    if (!findingTitle) return;
    setFormData(prev => ({
      ...prev,
      key_findings: [...prev.key_findings, { title: findingTitle, description: findingDesc, severity: findingSev }]
    }));
    setFindingTitle("");
    setFindingDesc("");
  };

  const removeFinding = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      key_findings: prev.key_findings.filter((_, i) => i !== idx)
    }));
  };

  const addRiskFactor = (nameToAdd = riskFactorName) => {
    const finalName = nameToAdd.trim();
    if (!finalName) return;
    if (formData.risk_factors.find(r => r.name.toLowerCase() === finalName.toLowerCase())) return;
    
    setFormData(prev => ({
      ...prev,
      risk_factors: [...prev.risk_factors, { name: finalName, severity: riskFactorSev }]
    }));
    setRiskFactorName("");
  };

  const removeRiskFactor = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      risk_factors: prev.risk_factors.filter((_, i) => i !== idx)
    }));
  };

  // Submit Handler
  const handleSubmit = async (isDraft: boolean) => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...formData,
        status: isDraft ? 'DRAFT' : 'SUBMITTED'
      };

      const res = await fetch(`/api/admin/athlete/${athleteId}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to commit performance assessment.");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save assessment.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/20";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const getSeverityLabelColor = (sev: string) => {
    if (sev === "RED") return "bg-red-500/10 text-red-500 border-red-500/20";
    if (sev === "ORANGE") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  };

  const getSeverityColor = (sev: string) => {
    if (sev === "RED") return "#ef4444";
    if (sev === "ORANGE") return "#f59e0b";
    return "#eab308";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto py-10 animate-fade-in">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-5xl h-[88vh] flex bg-[#070708] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl transition-all duration-300"
        >
          {/* LEFT SIDEBAR - WIZARD PROGRESS */}
          <div className="hidden md:flex flex-col w-[260px] bg-black/50 border-r border-white/5 p-6 justify-between flex-shrink-0">
            <div className="space-y-6">
              <div>
                <span className="text-[9px] font-black text-accent-green uppercase tracking-[4px]">Performance Hub</span>
                <h3 className="text-sm font-display font-black text-white uppercase tracking-wider mt-1 truncate">
                  {resolvedAthleteName}
                </h3>
              </div>

              <div className="space-y-1">
                {STEPS.map((s) => {
                  const isActive = step === s.step;
                  const isCompleted = step > s.step;

                  return (
                    <button
                      key={s.step}
                      onClick={() => setStep(s.step)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive 
                          ? "bg-accent-green/10 text-accent-green font-bold border border-accent-green/20" 
                          : isCompleted 
                          ? "text-gray-300 hover:text-white" 
                          : "text-gray-500 hover:text-gray-400"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                        isActive ? "bg-accent-green text-black font-black" : "bg-white/5"
                      }`}>
                        {s.step}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest">{s.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-bg-primary/30 border border-white/5 rounded-xl text-center">
              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">STEPS</span>
              <span className="text-lg font-mono font-black text-white mt-1 block">{step} / 8</span>
            </div>
          </div>

          {/* MAIN FORM PANEL */}
          <div className="flex-grow flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-accent-green/[0.02] to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green border border-accent-green/20">
                  <Activity size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-display font-black text-white uppercase tracking-wider">
                    {STEPS[step - 1].title}
                  </h2>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                    Athlete: {resolvedAthleteName}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 rounded-full bg-white/5 text-gray-400 hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-widest">
                  {error}
                </div>
              )}

              {success ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-12">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-4">
                    <ClipboardCheck size={32} />
                  </div>
                  <h4 className="text-lg font-display font-black text-green-400 uppercase tracking-widest">Assessment Committed</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-2">The analytics engine has synchronized the scores.</p>
                </div>
              ) : (
                <>
                  {/* STEP 1: BASIC INFO */}
                  {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider">Assessment Date</label>
                          <input 
                            type="date"
                            value={formData.assessment_date}
                            onChange={e => setFormData({ ...formData, assessment_date: e.target.value })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3.5 px-4 text-sm text-text-primary focus:border-accent-green outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider">Assessment Type</label>
                          <select 
                            value={formData.assessment_type}
                            onChange={e => setFormData({ ...formData, assessment_type: e.target.value as any })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3.5 px-4 text-sm text-text-primary focus:border-accent-green outline-none appearance-none"
                          >
                            <option value="FULL_ASSESSMENT">FULL COMPREHENSIVE ASSESSMENT</option>
                            <option value="FUNCTIONAL_CHECKUP">FUNCTIONAL CHECKUP</option>
                            <option value="VALD_FORCE">VALD FORCE PROFILE</option>
                            <option value="MATCH_PERFORMANCE">MATCH PERFORMANCE DATA</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider">Season</label>
                          <input 
                            type="text"
                            placeholder="e.g. 2026/2027"
                            value={formData.season}
                            onChange={e => setFormData({ ...formData, season: e.target.value })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3.5 px-4 text-sm text-text-primary focus:border-accent-green outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider">Position Played</label>
                          <select 
                            value={formData.position}
                            onChange={e => setFormData({ ...formData, position: e.target.value as any })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3.5 px-4 text-sm text-text-primary focus:border-accent-green outline-none appearance-none"
                          >
                            <option value="FORWARD">FORWARD</option>
                            <option value="MIDFIELDER">MIDFIELDER</option>
                            <option value="DEFENDER">DEFENDER</option>
                            <option value="GOALKEEPER">GOALKEEPER</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-black/30 p-6 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider">Height (cm)</label>
                          <input 
                            type="number" step="0.1"
                            placeholder="185"
                            value={formData.height_cm}
                            onChange={e => setFormData({ ...formData, height_cm: e.target.value })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider">Weight (kg)</label>
                          <input 
                            type="number" step="0.1"
                            placeholder="80"
                            value={formData.weight_kg}
                            onChange={e => setFormData({ ...formData, weight_kg: e.target.value })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider">Calculated BMI</label>
                          <div className="w-full bg-[#111] border border-white/5 rounded-xl py-3 px-4 text-sm text-white font-mono font-bold">
                            {calculatedBMI}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: OVERALL SCORES */}
                  {step === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                      {[
                        { key: "performance_score", label: "Performance Score", desc: "Global readiness based on mobility, symmetry, risk and functional findings" },
                        { key: "mobility_score", label: "Mobility Score", desc: "Key limiter: hip rotation and ankle dorsiflexion" },
                        { key: "symmetry_score", label: "Symmetry Score", desc: "Average force symmetry across VALD tests" },
                        { key: "risk_score", label: "Risk Score", desc: "Load distribution risk assessment" }
                      ].map((score) => {
                        const val = formData[score.key as keyof typeof formData] as number;
                        return (
                          <div key={score.key} className="bg-black/35 p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                            <div className="space-y-1 mb-4">
                              <span className="text-xs font-black text-white uppercase tracking-wider block">{score.label}</span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide block">{score.desc}</span>
                            </div>
                            <div className="flex items-center gap-6">
                              <input 
                                type="range" min="0" max="100" step="1"
                                value={val}
                                onChange={e => setFormData({ ...formData, [score.key]: parseInt(e.target.value) })}
                                className="flex-grow h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#22c55e]"
                              />
                              <div className={`w-14 h-14 rounded-full border flex items-center justify-center font-display font-black text-lg ${getScoreBg(val)} ${getScoreColor(val)}`}>
                                {val}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* STEP 3: VALD FORCE PROFILE */}
                  {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-[#22c55e]/5 border border-[#22c55e]/15 p-4 rounded-xl text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                        Enter force measurements in <span className="text-[#22c55e]">kg</span>. Asymmetry % and status tags (OK / MONITOR / FOCUS) are calculated automatically.
                      </div>
                      
                      <div className="space-y-4">
                        {[
                          { key: "hamstrings", label: "Hamstrings" },
                          { key: "adductors", label: "Adductors" },
                          { key: "hip_extension", label: "Hip Extension" },
                          { key: "hip_abduction", label: "Hip Abduction" },
                          { key: "hip_flexion", label: "Hip Flexion" }
                        ].map((m) => {
                          const left = formData[`${m.key}_left` as keyof typeof formData] as string;
                          const right = formData[`${m.key}_right` as keyof typeof formData] as string;
                          const asym = formData[`${m.key}_asymmetry` as keyof typeof formData] as number;
                          const status = formData[`${m.key}_status` as keyof typeof formData] as string;

                          return (
                            <div key={m.key} className="bg-black/35 p-6 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                              <div className="font-display font-black text-xs text-white uppercase tracking-wider">
                                {m.label}
                              </div>
                              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Left (kg)</label>
                                  <input 
                                    type="number" step="0.1" placeholder="0.0"
                                    value={left}
                                    onChange={e => updateVALD(m.key, "left", e.target.value)}
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-white font-semibold outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Right (kg)</label>
                                  <input 
                                    type="number" step="0.1" placeholder="0.0"
                                    value={right}
                                    onChange={e => updateVALD(m.key, "right", e.target.value)}
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-white font-semibold outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between items-center bg-black/40 border border-white/5 px-4 py-3.5 rounded-xl">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">Asymmetry</span>
                                  <span className="text-xs font-mono font-bold text-white block">{asym}%</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${getSeverityLabelColor(status === 'OK' ? 'YELLOW' : status === 'MONITOR' ? 'ORANGE' : 'RED')}`}>
                                  {status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: FUNCTIONAL TESTS */}
                  {step === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                      {[
                        { key: "cspine_rotation", label: "C-Spine Rotation" },
                        { key: "forward_bend", label: "Forward Bend" },
                        { key: "hip_ir_left", label: "Hip IR Left" },
                        { key: "hip_er_both", label: "Hip ER Both" },
                        { key: "deep_squat", label: "Deep Squat" },
                        { key: "ankle_df", label: "Ankle DF" },
                        { key: "great_toe_ext", label: "Great Toe Ext." },
                        { key: "single_leg_stand", label: "Single Leg Stand" }
                      ].map((t) => {
                        const val = formData[t.key as keyof typeof formData] as number;
                        return (
                          <div key={t.key} className="bg-black/35 p-5 rounded-xl border border-white/5 space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                              <span className="text-gray-300">{t.label}</span>
                              <span className={val >= 70 ? "text-green-400" : val >= 50 ? "text-amber-500" : "text-red-500"}>{val}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" step="1"
                              value={val}
                              onChange={e => setFormData({ ...formData, [t.key]: parseInt(e.target.value) })}
                              className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#22c55e]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* STEP 5: BODY MAP */}
                  {step === 5 && (
                    <div className="space-y-4 animate-fade-in">
                      <BodyMap 
                        zones={formData.body_map_zones}
                        onChange={(zones: any[]) => setFormData({ ...formData, body_map_zones: zones })}
                        readOnly={false}
                      />
                    </div>
                  )}

                  {/* STEP 6: PERFORMANCE IMPACT */}
                  {step === 6 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                      {[
                        { key: "acceleration_impact", label: "Acceleration" },
                        { key: "sprint_impact", label: "Sprint" },
                        { key: "change_of_direction_impact", label: "Change of Direction" },
                        { key: "kicking_impact", label: "Kicking Mechanics" },
                        { key: "landing_impact", label: "Landing Mechanics" },
                        { key: "single_leg_stability", label: "Single-Leg Stability" }
                      ].map((i) => {
                        const val = formData[i.key as keyof typeof formData] as number;
                        return (
                          <div key={i.key} className="bg-black/35 p-5 rounded-xl border border-white/5 space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                              <span className="text-gray-300">{i.label}</span>
                              <span className={val >= 80 ? "text-green-400" : val >= 60 ? "text-amber-500" : "text-red-500"}>{val}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" step="1"
                              value={val}
                              onChange={e => setFormData({ ...formData, [i.key]: parseInt(e.target.value) })}
                              className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#22c55e]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* STEP 7: KEY FINDINGS & SUMMARY */}
                  {step === 7 && (
                    <div className="space-y-6 animate-fade-in">
                      
                      {/* Findings entry */}
                      <div className="p-6 bg-black/40 border border-white/5 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-12 text-[10px] font-black text-white uppercase tracking-[2px] pb-2 border-b border-white/5">
                          Add Performance Finding
                        </div>
                        <div className="md:col-span-4 space-y-2">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Title</label>
                          <input 
                            value={findingTitle}
                            onChange={e => setFindingTitle(e.target.value)}
                            placeholder="e.g. Hip Mobility Limit"
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-white outline-none"
                          />
                        </div>
                        <div className="md:col-span-5 space-y-2">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Description</label>
                          <input 
                            value={findingDesc}
                            onChange={e => setFindingDesc(e.target.value)}
                            placeholder="e.g. Restricted IR on left side"
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-white outline-none"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Severity</label>
                          <div className="flex gap-2">
                            <select 
                              value={findingSev}
                              onChange={e => setFindingSev(e.target.value as any)}
                              className="bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-white outline-none appearance-none flex-grow"
                            >
                              <option value="YELLOW">YELLOW</option>
                              <option value="ORANGE">ORANGE</option>
                              <option value="RED">RED</option>
                            </select>
                            <button
                              type="button"
                              onClick={addFinding}
                              className="px-3 bg-accent-green text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all hover:opacity-90"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* List current findings */}
                        {formData.key_findings.length > 0 && (
                          <div className="md:col-span-12 space-y-2 mt-2">
                            {formData.key_findings.map((f, index) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-black/50 border border-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getSeverityLabelColor(f.severity)}`}>
                                    {f.severity}
                                  </span>
                                  <div>
                                    <span className="text-xs font-black text-white">{f.title}: </span>
                                    <span className="text-xs text-gray-400">{f.description}</span>
                                  </div>
                                </div>
                                <button type="button" onClick={() => removeFinding(index)} className="text-red-500 hover:text-red-400">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Risk factors entry */}
                      <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-6">
                        <div className="text-[10px] font-black text-white uppercase tracking-[2px] pb-2 border-b border-white/5">
                          Add Risk Factors
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {["Groin symptoms", "Hip mobility", "Ankle mobility", "Balance", "Pelvic control", "Hamstring tightness"].map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addRiskFactor(tag)}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black text-gray-300 uppercase tracking-widest transition-all"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                          <div className="md:col-span-6 space-y-2">
                            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Custom Risk Factor</label>
                            <input 
                              value={riskFactorName}
                              onChange={e => setRiskFactorName(e.target.value)}
                              placeholder="e.g. Quad tightness"
                              className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-white outline-none"
                            />
                          </div>
                          <div className="md:col-span-4 space-y-2">
                            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Severity</label>
                            <select 
                              value={riskFactorSev}
                              onChange={e => setRiskFactorSev(e.target.value as any)}
                              className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-white outline-none appearance-none"
                            >
                              <option value="YELLOW">YELLOW</option>
                              <option value="ORANGE">ORANGE</option>
                              <option value="RED">RED</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <button
                              type="button"
                              onClick={() => addRiskFactor()}
                              className="w-full py-2 bg-accent-green text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all hover:opacity-90"
                            >
                              Add Tag
                            </button>
                          </div>
                        </div>

                        {/* List current risk factors */}
                        {formData.risk_factors.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                            {formData.risk_factors.map((r, index) => (
                              <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-white/5 rounded-xl">
                                <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: getSeverityColor(r.severity) }} />
                                <span className="text-[9px] font-black text-white uppercase tracking-wider">{r.name}</span>
                                <button type="button" onClick={() => removeRiskFactor(index)} className="text-red-500 hover:text-red-400">
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Coach summary */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider">Coach Summary Notes</label>
                        <textarea
                          rows={4}
                          value={formData.coach_summary}
                          onChange={e => setFormData({ ...formData, coach_summary: e.target.value })}
                          placeholder="WRITE DETAILED LAB FINDINGS AND GENERAL HEALTH SUMMARY NOTES..."
                          className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-xs text-text-primary focus:border-accent-green outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 8: REVIEW & SUBMIT */}
                  {step === 8 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                          <Bookmark size={14} className="text-accent-green" />
                          <span className="text-[10px] font-black text-accent-green uppercase tracking-[3px]">Progress Tracking Registry</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Retest Recommended After</label>
                            <input 
                              type="date"
                              value={formData.retest_recommended_date}
                              onChange={e => setFormData({ ...formData, retest_recommended_date: e.target.value })}
                              className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2.5 px-3 text-xs text-white outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Compare Against Previous Assessment</label>
                            <select 
                              value={formData.previous_assessment_id}
                              onChange={e => setFormData({ ...formData, previous_assessment_id: e.target.value })}
                              className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2.5 px-3 text-xs text-white outline-none appearance-none"
                            >
                              <option value="">NONE / FIRST ASSESSMENT</option>
                              {history.map((h: any) => (
                                <option key={h.id} value={h.id}>
                                  {h.assessment_date} - {h.assessment_type} ({h.status})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Improvement & Growth Notes</label>
                          <textarea 
                            rows={3}
                            value={formData.improvement_notes}
                            onChange={e => setFormData({ ...formData, improvement_notes: e.target.value })}
                            placeholder="e.g. Improved hip internal rotation by 5%..."
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-xs text-text-primary focus:border-accent-green outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* Summary dashboard representation */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: "Performance", val: formData.performance_score },
                          { label: "Mobility", val: formData.mobility_score },
                          { label: "Symmetry", val: formData.symmetry_score },
                          { label: "Risk Score", val: formData.risk_score }
                        ].map(c => (
                          <div key={c.label} className="p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                            <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{c.label}</div>
                            <div className={`text-2xl font-display font-black mt-1 ${getScoreColor(c.val)}`}>{c.val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Submit Actions */}
                      <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleSubmit(true)}
                          className="py-4 bg-bg-secondary border border-border-primary/50 text-white font-black text-[10px] tracking-widest rounded-xl hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
                          SAVE AS DRAFT
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleSubmit(false)}
                          className="py-4 bg-accent-green text-black font-black text-[10px] tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(34,197,94,0.2)]"
                        >
                          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
                          SUBMIT FINAL ASSESSMENT
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Wizard Navigation Bar */}
            {!success && (
              <div className="p-6 border-t border-white/5 flex justify-between bg-black/30">
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() => setStep(prev => prev - 1)}
                  className="px-6 py-3 rounded-xl border border-white/5 text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={12} /> Back
                </button>
                <button
                  type="button"
                  disabled={step === 8}
                  onClick={() => setStep(prev => prev + 1)}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white hover:bg-white/10 uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
