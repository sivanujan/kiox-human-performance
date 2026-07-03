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

const t = {
  EN: {
    performanceHub: "Performance Hub",
    athlete: "Athlete",
    steps: "STEPS",
    back: "Back",
    next: "Next",
    cancel: "Cancel",
    submit: "Submit Assessment",
    submitting: "Submitting...",
    committed: "Assessment Committed",
    syncText: "The analytics engine has synchronized the scores.",
    
    // Step Titles
    step1: "Basic Info",
    step2: "Overall Scores",
    step3: "VALD Force Profile",
    step4: "Functional Tests",
    step5: "Body Map",
    step6: "Performance Impact",
    step7: "Key Findings",
    step8: "Review & Submit",

    // Step 1: Basic Info
    date: "Assessment Date",
    type: "Assessment Type",
    season: "Season",
    height: "Height (cm)",
    weight: "Weight (kg)",
    position: "Position Played",
    prevAssessment: "Compare with Previous Assessment",
    calculatedBmi: "Calculated BMI",
    noPrev: "NONE / FIRST ASSESSMENT",
    placeholderSeason: "e.g. 2026/2027",

    // Assessment Types
    FULL_ASSESSMENT: "FULL COMPREHENSIVE ASSESSMENT",
    FUNCTIONAL_CHECKUP: "FUNCTIONAL CHECKUP",
    VALD_FORCE: "VALD FORCE PROFILE",
    MATCH_PERFORMANCE: "MATCH PERFORMANCE DATA",
    PERFORMANCE_DIAGNOSTICS: "PERFORMANCE DIAGNOSTICS",

    // Positions
    FORWARD: "FORWARD",
    MIDFIELDER: "MIDFIELDER",
    DEFENDER: "DEFENDER",
    GOALKEEPER: "GOALKEEPER",

    // Step 2: Overall Scores
    scoresDesc: "Overall Evaluation Index Metrics",
    performanceScore: "Performance Score",
    mobilityScore: "Mobility Score",
    symmetryScore: "Symmetry Score",
    riskScore: "Risk Score",
    autoCalc: "Auto-calculated from testing parameters",

    // Step 3: VALD Force
    valdTitle: "VALD Force Profile (kg)",
    valdDesc: "Bilateral Force Capacity Comparisons",
    left: "LEFT",
    right: "RIGHT",
    asym: "Asymmetry",
    hamstrings: "Hamstrings",
    adductors: "Adductors",
    hipExt: "Hip Extension",
    hipAbd: "Hip Abduction",
    hipFlex: "Hip Flexion",
    valdIntro: "Enter force measurements in kg. Asymmetry % and status tags (OK / MONITOR / FOCUS) are calculated automatically.",

    // Step 4: Functional
    functionalTitle: "Functional Movement Quality",
    functionalDesc: "Movement Assessment Metrics",
    cspine_rotation: "C-Spine Rotation",
    forward_bend: "Forward Bend",
    hip_ir_left: "Hip IR Left",
    hip_er_both: "Hip ER Both",
    deep_squat: "Deep Squat",
    ankle_df: "Ankle DF",
    great_toe_ext: "Great Toe Ext.",
    single_leg_stand: "Single Leg Stand",

    // Step 5: Body Map
    bodyMapTitle: "Injury & Pain Body Map",
    bodyMapDesc: "Select active pain/tension zones on the body",
    front: "FRONT VIEW",
    backView: "BACK VIEW",
    noPainZones: "No pain zones selected. Click any point to add.",
    severity: "Severity",
    notes: "Notes",
    addZone: "Add Zone",

    // Step 6: Performance Impact
    performanceImpactTitle: "Performance Impact Factors",
    performanceImpactDesc: "Subjective evaluation of athletic performance limiting factors",
    acceleration_impact: "Acceleration",
    sprint_impact: "Sprint",
    change_of_direction_impact: "Change of Direction",
    kicking_impact: "Kicking Mechanics",
    landing_impact: "Landing Mechanics",
    single_leg_stability: "Single-Leg Stability",

    // Step 7: Key Findings
    keyFindingsTitle: "Key Findings & Action Items",
    keyFindingsDesc: "Document core findings and coaching recommendations",
    findingTitle: "Title",
    findingDesc: "Description",
    addFinding: "Add Performance Finding",
    addFindingBtn: "Add",
    riskFactorsTitle: "Add Risk Factors",
    factorName: "Custom Risk Factor",
    addFactorBtn: "Add Tag",
    coachSummary: "Coach Summary Notes",
    summaryPlaceholder: "WRITE DETAILED LAB FINDINGS AND GENERAL HEALTH SUMMARY NOTES...",

    // Step 8: Review
    reviewTitle: "Final Review & Submit",
    reviewDesc: "Verify all metrics before committing to database",
    draftText: "SAVE AS DRAFT",
    submitText: "SUBMIT FINAL ASSESSMENT",
    retestRecommended: "Retest Recommended After",
    comparePrev: "Compare Against Previous Assessment",
    growthNotes: "Improvement & Growth Notes",
    growthPlaceholder: "e.g. Improved hip internal rotation by 5%..."
  },
  DE: {
    performanceHub: "Leistungs-Hub",
    athlete: "Athlet",
    steps: "SCHRITTE",
    back: "Zurück",
    next: "Weiter",
    cancel: "Abbrechen",
    submit: "Bewertung absenden",
    submitting: "Wird gesendet...",
    committed: "Bewertung gespeichert",
    syncText: "Die Analyse-Engine hat die Ergebnisse synchronisiert.",

    // Step Titles
    step1: "Basisinfo",
    step2: "Gesamtwerte",
    step3: "VALD Kraftprofil",
    step4: "Funktionstests",
    step5: "Körperkarte",
    step6: "Leistungseinfluss",
    step7: "Hauptergebnisse",
    step8: "Prüfen & Senden",

    // Step 1: Basic Info
    date: "Bewertungsdatum",
    type: "Bewertungstyp",
    season: "Saison",
    height: "Größe (cm)",
    weight: "Gewicht (kg)",
    position: "Position",
    prevAssessment: "Mit vorheriger Bewertung vergleichen",
    calculatedBmi: "Berechneter BMI",
    noPrev: "KEINE / ERSTE BEWERTUNG",
    placeholderSeason: "z.B. 2026/2027",

    // Assessment Types
    FULL_ASSESSMENT: "VOLLSTÄNDIGE BEWERTUNG",
    FUNCTIONAL_CHECKUP: "FUNKTIONELLER CHECK-UP",
    VALD_FORCE: "NUR VALD KRAFTPROLFIL",
    MATCH_PERFORMANCE: "SPIEL-LEISTUNGSDATEN",
    PERFORMANCE_DIAGNOSTICS: "LEISTUNGSDIAGNOSTIK",

    // Positions
    FORWARD: "STÜRMER",
    MIDFIELDER: "MITTELFELDSPIELER",
    DEFENDER: "ABWEHRSPIELER",
    GOALKEEPER: "TORWART",

    // Step 2: Overall Scores
    scoresDesc: "Gesamtbewertung Indexmetriken",
    performanceScore: "Leistungswert",
    mobilityScore: "Mobilitätswert",
    symmetryScore: "Symmetriewert",
    riskScore: "Risikowert",
    autoCalc: "Automatisch berechnet aus Testparametern",

    // Step 3: VALD Force
    valdTitle: "VALD Kraftprofil (kg)",
    valdDesc: "Bilateraler Kraftkapazitätsvergleich",
    left: "LINKS",
    right: "RECHTS",
    asym: "Asymmetrie",
    hamstrings: "Hamstrings",
    adductors: "Adduktoren",
    hipExt: "Hüftstreckung",
    hipAbd: "Hüftabduktion",
    hipFlex: "Hüftbeugung",
    valdIntro: "Geben Sie die Kraftwerte in kg ein. Die Asymmetrie % und Status-Tags (OK / MONITOR / FOCUS) werden automatisch berechnet.",

    // Step 4: Functional
    functionalTitle: "Funktionelle Bewegungsqualität",
    functionalDesc: "Bewegungsbewertungs-Metriken",
    cspine_rotation: "HWS-Rotation",
    forward_bend: "Vorwärtsbeuge",
    hip_ir_left: "Hüft-IR Links",
    hip_er_both: "Hüft-ER Beidseitig",
    deep_squat: "Tiefe Kniebeuge",
    ankle_df: "Sprunggelenk Dorsalflexion",
    great_toe_ext: "Großzehenstreckung",
    single_leg_stand: "Einbeinstand",

    // Step 5: Body Map
    bodyMapTitle: "Verletzungs- & Schmerzkörperkarte",
    bodyMapDesc: "Aktive Schmerz- oder Spannungszonen am Körper auswählen",
    front: "VORDERANSICHT",
    backView: "RÜCKANSICHT",
    noPainZones: "Keine Schmerzzonen ausgewählt. Klicken Sie auf einen Punkt, um ihn hinzuzufügen.",
    severity: "Schweregrad",
    notes: "Notizen",
    addZone: "Zone hinzufügen",

    // Step 6: Performance Impact
    performanceImpactTitle: "Leistungsbeeinflussende Faktoren",
    performanceImpactDesc: "Subjektive Bewertung von leistungsbegrenzenden Faktoren",
    acceleration_impact: "Beschleunigung",
    sprint_impact: "Sprint",
    change_of_direction_impact: "Richtungswechsel (COD)",
    kicking_impact: "Schussmechanik",
    landing_impact: "Landemechanik",
    single_leg_stability: "Einbein-Stabilität",

    // Step 7: Key Findings
    keyFindingsTitle: "Hauptergebnisse & Maßnahmen",
    keyFindingsDesc: "Kernaussagen und Empfehlungen dokumentieren",
    findingTitle: "Titel",
    findingDesc: "Beschreibung",
    addFinding: "Hauptergebnis hinzufügen",
    addFindingBtn: "Hinzufügen",
    riskFactorsTitle: "Risikofaktoren hinzufügen",
    factorName: "Risikofaktor",
    addFactorBtn: "Hinzufügen",
    coachSummary: "Notizen zur Trainerzusammenfassung",
    summaryPlaceholder: "DETAILLIERTE BEWERTUNGSNOTIZEN UND ALLGEMEINE GESUNDHEITSNOTIZEN SCHREIBEN...",

    // Step 8: Review
    reviewTitle: "Abschließende Prüfung & Absenden",
    reviewDesc: "Überprüfen Sie alle Werte, bevor Sie sie speichern",
    draftText: "ALS ENTWURF SPEICHERN",
    submitText: "BEWERTUNG ABSENDEN",
    retestRecommended: "Retest empfohlen nach",
    comparePrev: "Mit vorheriger Bewertung vergleichen",
    growthNotes: "Verbesserungs- & Wachstumsnotizen",
    growthPlaceholder: "z.B. Hüftinnenrotation links um 5% verbessert..."
  }
};

export default function AthleteAssessmentModal({ isOpen, onClose, athleteId, athleteName }: AthleteAssessmentModalProps) {
  const [resolvedAthleteName, setResolvedAthleteName] = useState(athleteName);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [lang, setLang] = useState<"EN" | "DE">("EN");

  const [formData, setFormData] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    assessment_type: "FULL_ASSESSMENT" as "FUNCTIONAL_CHECKUP" | "VALD_FORCE" | "MATCH_PERFORMANCE" | "FULL_ASSESSMENT" | "PERFORMANCE_DIAGNOSTICS",
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
    retest_recommended_date: "",

    // Performance Diagnostics
    step_test_data: [
      { stage: 1, speed: "10.0", duration: "00:03:00", lactate: "2.10", heart_rate: "152" },
      { stage: 2, speed: "10.8", duration: "00:03:00", lactate: "3.20", heart_rate: "163" },
      { stage: 3, speed: "11.7", duration: "00:03:00", lactate: "3.50", heart_rate: "168" },
      { stage: 4, speed: "12.6", duration: "00:03:00", lactate: "4.00", heart_rate: "179" },
      { stage: 5, speed: "13.5", duration: "00:03:00", lactate: "4.60", heart_rate: "184" }
    ] as { stage: number; speed: string; duration: string; lactate: string; heart_rate: string }[],
    training_zones: {
      regeneration: { lactate: "-6.11 - -2.23", heart_rate: "123 - 132", speed: "7.9 - 8.6", speed_ms: "2.2 - 2.4", energy: "629 - 686", time_1000m: "07:37 - 07:00", marathon_time: "05:21 - 04:55" },
      basic_training: { lactate: "-0.34 - 2.77", heart_rate: "139 - 158", speed: "9.0 - 10.4", speed_ms: "2.5 - 2.9", energy: "723 - 836", time_1000m: "06:38 - 05:44", marathon_time: "04:40 - 04:02" },
      build_up: { lactate: "2.77 - 3.54", heart_rate: "158 - 167", speed: "10.4 - 11.5", speed_ms: "2.9 - 3.2", energy: "836 - 920", time_1000m: "05:44 - 05:12", marathon_time: "04:02 - 03:40" },
      competition: { lactate: "3.54 - 3.86", heart_rate: "167 - 177", speed: "11.5 - 12.4", speed_ms: "3.2 - 3.5", energy: "920 - 995", time_1000m: "05:12 - 04:49", marathon_time: "03:40 - 03:23" },
      anaerobic: { lactate: "3.82 - 4.62", heart_rate: "176 - 184", speed: "12.3 - 13.5", speed_ms: "3.4 - 3.7", energy: "986 - 1080", time_1000m: "04:52 - 04:26", marathon_time: "03:25 - 03:07" }
    } as any
  });

  const STEPS = formData.assessment_type === "PERFORMANCE_DIAGNOSTICS"
    ? [
        { step: 1, title: t[lang].step1, icon: <FileText size={14} /> },
        { step: 2, title: lang === "EN" ? "Step Test Data" : "Stufentestdaten", icon: <Activity size={14} /> },
        { step: 3, title: lang === "EN" ? "Training Zones" : "Trainingsbereiche", icon: <Target size={14} /> },
        { step: 4, title: t[lang].step7, icon: <BarChart3 size={14} /> },
        { step: 5, title: t[lang].step8, icon: <ClipboardCheck size={14} /> }
      ]
    : [
        { step: 1, title: t[lang].step1, icon: <FileText size={14} /> },
        { step: 2, title: t[lang].step2, icon: <Activity size={14} /> },
        { step: 3, title: t[lang].step3, icon: <Scale size={14} /> },
        { step: 4, title: t[lang].step4, icon: <ShieldCheck size={14} /> },
        { step: 5, title: t[lang].step5, icon: <Target size={14} /> },
        { step: 6, title: t[lang].step6, icon: <Zap size={14} /> },
        { step: 7, title: t[lang].step7, icon: <BarChart3 size={14} /> },
        { step: 8, title: t[lang].step8, icon: <ClipboardCheck size={14} /> }
      ];

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
    const functionalKeys = [
      "cspine_rotation", "forward_bend", "hip_ir_left", "hip_er_both", 
      "deep_squat", "ankle_df", "great_toe_ext", "single_leg_stand"
    ];
    const mobilitySum = functionalKeys.reduce((sum, key) => sum + (Number(data[key as keyof typeof data]) || 0), 0);
    const calculatedMobility = Math.round(mobilitySum / functionalKeys.length);

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
    calculatedRisk = Math.max(10, Math.min(95, calculatedRisk));

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

  const heightNum = parseFloat(formData.height_cm);
  const weightNum = parseFloat(formData.weight_kg);
  const calculatedBMI = (heightNum > 0 && weightNum > 0) 
    ? (weightNum / Math.pow(heightNum / 100, 2)).toFixed(1) 
    : "0.0";

  const updateVALD = (muscle: string, field: "left" | "right", value: string) => {
    setFormData(prev => {
      const updated = { ...prev };
      
      const leftKey = `${muscle}_left`;
      const rightKey = `${muscle}_right`;
      const asymmetryKey = `${muscle}_asymmetry`;
      const statusKey = `${muscle}_status`;

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
          className="relative w-full max-w-5xl h-[88vh] flex bg-bg-primary border border-border-primary rounded-[32px] overflow-hidden shadow-2xl transition-all duration-300"
        >
          {/* LEFT SIDEBAR - WIZARD PROGRESS */}
          <div className="hidden md:flex flex-col w-[260px] bg-bg-sidebar border-r border-border-primary p-6 justify-between flex-shrink-0">
            <div className="space-y-6">
              <div>
                <span className="text-[9px] font-black text-accent-green uppercase tracking-[4px]">
                  {t[lang].performanceHub}
                </span>
                <h3 className="text-sm font-display font-black text-text-primary uppercase tracking-wider mt-1 truncate">
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
                      type="button"
                      onClick={() => setStep(s.step)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive 
                          ? "bg-accent-green/10 text-accent-green font-bold border border-accent-green/20" 
                          : isCompleted 
                          ? "text-text-secondary hover:text-text-primary" 
                          : "text-text-muted hover:text-text-muted"
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

            <div className="p-4 bg-bg-primary/30 border border-border-primary rounded-xl text-center">
              <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block">
                {t[lang].steps}
              </span>
              <span className="text-lg font-mono font-black text-text-primary mt-1 block">{step} / {STEPS.length}</span>
            </div>
          </div>

          {/* MAIN FORM PANEL */}
          <div className="flex-grow flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border-primary flex justify-between items-center bg-gradient-to-r from-accent-green/[0.02] to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green border border-accent-green/20">
                  <Activity size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-display font-black text-text-primary uppercase tracking-wider">
                    {STEPS[step - 1].title}
                  </h2>
                  <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-0.5">
                    {t[lang].athlete}: {resolvedAthleteName}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Language Switcher Label & Selectors */}
                <div className="flex items-center gap-2 bg-bg-card border-2 border-accent-green/30 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  <span className="text-[9px] font-black text-accent-green uppercase tracking-wider select-none">
                    {lang === "EN" ? "Language:" : "Sprache:"}
                  </span>
                  <div className="flex bg-white/5 p-0.5 rounded-lg border border-border-primary">
                    <button
                      type="button"
                      onClick={() => setLang("EN")}
                      className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest transition-all ${
                        lang === "EN" 
                          ? "bg-accent-green text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang("DE")}
                      className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest transition-all ${
                        lang === "DE" 
                          ? "bg-accent-green text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      DE
                    </button>
                  </div>
                </div>

                <button onClick={onClose} className="p-3 rounded-full bg-white/5 text-text-muted hover:text-text-primary border border-border-primary transition-all active:scale-95">
                  <X size={16} />
                </button>
              </div>
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
                  <h4 className="text-lg font-display font-black text-green-400 uppercase tracking-widest">
                    {t[lang].committed}
                  </h4>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-2">
                    {t[lang].syncText}
                  </p>
                </div>
              ) : (
                <>
                  {/* STEP 1: BASIC INFO */}
                  {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-text-muted uppercase tracking-wider">
                            {t[lang].date}
                          </label>
                          <input 
                            type="date"
                            value={formData.assessment_date}
                            onChange={e => setFormData({ ...formData, assessment_date: e.target.value })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3.5 px-4 text-sm text-text-primary focus:border-accent-green outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-text-muted uppercase tracking-wider">
                            {t[lang].type}
                          </label>
                          <select 
                            value={formData.assessment_type}
                            onChange={e => setFormData({ ...formData, assessment_type: e.target.value as any })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3.5 px-4 text-sm text-text-primary focus:border-accent-green outline-none appearance-none"
                          >
                            <option value="FULL_ASSESSMENT">{t[lang].FULL_ASSESSMENT}</option>
                            <option value="FUNCTIONAL_CHECKUP">{t[lang].FUNCTIONAL_CHECKUP}</option>
                            <option value="VALD_FORCE">{t[lang].VALD_FORCE}</option>
                            <option value="MATCH_PERFORMANCE">{t[lang].MATCH_PERFORMANCE}</option>
                            <option value="PERFORMANCE_DIAGNOSTICS">{t[lang].PERFORMANCE_DIAGNOSTICS}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-text-muted uppercase tracking-wider">
                            {t[lang].season}
                          </label>
                          <input 
                            type="text"
                            placeholder={t[lang].placeholderSeason}
                            value={formData.season}
                            onChange={e => setFormData({ ...formData, season: e.target.value })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3.5 px-4 text-sm text-text-primary focus:border-accent-green outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-text-muted uppercase tracking-wider">
                            {t[lang].position}
                          </label>
                          <select 
                            value={formData.position}
                            onChange={e => setFormData({ ...formData, position: e.target.value as any })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3.5 px-4 text-sm text-text-primary focus:border-accent-green outline-none appearance-none"
                          >
                            <option value="FORWARD">{t[lang].FORWARD}</option>
                            <option value="MIDFIELDER">{t[lang].MIDFIELDER}</option>
                            <option value="DEFENDER">{t[lang].DEFENDER}</option>
                            <option value="GOALKEEPER">{t[lang].GOALKEEPER}</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-bg-secondary p-6 rounded-2xl border border-border-primary grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-text-muted uppercase tracking-wider">
                            {t[lang].height}
                          </label>
                          <input 
                            type="number" step="0.1"
                            placeholder="185"
                            value={formData.height_cm}
                            onChange={e => setFormData({ ...formData, height_cm: e.target.value })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-text-muted uppercase tracking-wider">
                            {t[lang].weight}
                          </label>
                          <input 
                            type="number" step="0.1"
                            placeholder="80"
                            value={formData.weight_kg}
                            onChange={e => setFormData({ ...formData, weight_kg: e.target.value })}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-text-muted uppercase tracking-wider">
                            {t[lang].calculatedBmi}
                          </label>
                          <div className="w-full bg-bg-secondary border border-border-primary rounded-xl py-3 px-4 text-sm text-text-primary font-mono font-bold">
                            {calculatedBMI}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: OVERALL SCORES OR STEP TEST DATA */}
                  {step === 2 && formData.assessment_type !== "PERFORMANCE_DIAGNOSTICS" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                      {[
                        { key: "performance_score", label: t[lang].performanceScore, desc: t[lang].scoresDesc },
                        { key: "mobility_score", label: t[lang].mobilityScore, desc: t[lang].scoresDesc },
                        { key: "symmetry_score", label: t[lang].symmetryScore, desc: t[lang].scoresDesc },
                        { key: "risk_score", label: t[lang].riskScore, desc: t[lang].scoresDesc }
                      ].map((score) => {
                        const val = formData[score.key as keyof typeof formData] as number;
                        return (
                          <div key={score.key} className="bg-bg-secondary p-6 rounded-2xl border border-border-primary flex flex-col justify-between">
                            <div className="space-y-1 mb-4">
                              <span className="text-xs font-black text-text-primary uppercase tracking-wider block">{score.label}</span>
                              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wide block">{t[lang].autoCalc}</span>
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

                  {step === 2 && formData.assessment_type === "PERFORMANCE_DIAGNOSTICS" && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-accent-green/5 border border-accent-green/15 p-4 rounded-xl text-[10px] text-text-muted font-bold uppercase tracking-wide">
                        {lang === "EN" 
                          ? "ENTER INCREMENTAL STEP TEST STAGE DATA (SPEED, LACTATE, AND HEART RATE METRICS)" 
                          : "EINGABE DER STUFENTESTDATEN (GESCHWINDIGKEIT, LAKTAT UND HERZFREQUENZ)"}
                      </div>

                      <div className="overflow-x-auto bg-bg-secondary border border-border-primary rounded-2xl">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border-primary/50 text-[9px] font-black text-text-muted uppercase tracking-widest bg-bg-primary/40">
                              <th className="p-4">{lang === "EN" ? "STAGE" : "STUFE"}</th>
                              <th className="p-4">{lang === "EN" ? "SPEED (KM/H)" : "GESCHWINDIGKEIT (KM/H)"}</th>
                              <th className="p-4">{lang === "EN" ? "DURATION (MIN/SEC)" : "ZEIT (MM:SS)"}</th>
                              <th className="p-4">{lang === "EN" ? "LACTATE (MMOL/L)" : "LAKTAT (MMOL/L)"}</th>
                              <th className="p-4">{lang === "EN" ? "HEART RATE (BPM)" : "HERZFREQUENZ (1/MIN)"}</th>
                              <th className="p-4 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-primary/50">
                            {formData.step_test_data.map((row, idx) => (
                              <tr key={idx} className="hover:bg-bg-primary/20 transition-colors">
                                <td className="p-3 pl-4 font-mono text-xs font-bold text-accent-green">#{row.stage}</td>
                                <td className="p-3">
                                  <input 
                                    type="text" 
                                    value={row.speed} 
                                    onChange={e => {
                                      const updated = [...formData.step_test_data];
                                      updated[idx].speed = e.target.value;
                                      setFormData({ ...formData, step_test_data: updated });
                                    }}
                                    className="bg-bg-primary border border-border-primary/50 rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono outline-none focus:border-accent-green w-28"
                                  />
                                </td>
                                <td className="p-3">
                                  <input 
                                    type="text" 
                                    value={row.duration} 
                                    onChange={e => {
                                      const updated = [...formData.step_test_data];
                                      updated[idx].duration = e.target.value;
                                      setFormData({ ...formData, step_test_data: updated });
                                    }}
                                    className="bg-bg-primary border border-border-primary/50 rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono outline-none focus:border-accent-green w-28"
                                  />
                                </td>
                                <td className="p-3">
                                  <input 
                                    type="text" 
                                    value={row.lactate} 
                                    onChange={e => {
                                      const updated = [...formData.step_test_data];
                                      updated[idx].lactate = e.target.value;
                                      setFormData({ ...formData, step_test_data: updated });
                                    }}
                                    className="bg-bg-primary border border-border-primary/50 rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono outline-none focus:border-accent-green w-28"
                                  />
                                </td>
                                <td className="p-3">
                                  <input 
                                    type="text" 
                                    value={row.heart_rate} 
                                    onChange={e => {
                                      const updated = [...formData.step_test_data];
                                      updated[idx].heart_rate = e.target.value;
                                      setFormData({ ...formData, step_test_data: updated });
                                    }}
                                    className="bg-bg-primary border border-border-primary/50 rounded-lg px-3 py-1.5 text-xs text-text-primary font-mono outline-none focus:border-accent-green w-28"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const updated = formData.step_test_data.filter((_, i) => i !== idx).map((r, i) => ({ ...r, stage: i + 1 }));
                                      setFormData({ ...formData, step_test_data: updated });
                                    }}
                                    className="text-red-500 hover:text-red-400 p-1 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextStage = formData.step_test_data.length + 1;
                          const updated = [...formData.step_test_data, { stage: nextStage, speed: "", duration: "00:03:00", lactate: "", heart_rate: "" }];
                          setFormData({ ...formData, step_test_data: updated });
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-border-primary hover:border-border-active rounded-xl text-[10px] text-text-secondary hover:text-text-primary font-black uppercase tracking-widest transition-all bg-bg-secondary"
                      >
                        <Plus size={12} /> {lang === "EN" ? "ADD STAGE" : "STUFE HINZUFÜGEN"}
                      </button>
                    </div>
                  )}

                  {/* STEP 3: VALD FORCE PROFILE OR TRAINING ZONES */}
                  {step === 3 && formData.assessment_type !== "PERFORMANCE_DIAGNOSTICS" && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-[#22c55e]/5 border border-[#22c55e]/15 p-4 rounded-xl text-[10px] text-text-muted font-bold uppercase tracking-wide">
                        {t[lang].valdIntro}
                      </div>
                      
                      <div className="space-y-4">
                        {[
                          { key: "hamstrings", label: t[lang].hamstrings },
                          { key: "adductors", label: t[lang].adductors },
                          { key: "hip_extension", label: t[lang].hipExt },
                          { key: "hip_abduction", label: t[lang].hipAbd },
                          { key: "hip_flexion", label: t[lang].hipFlex }
                        ].map((m) => {
                          const left = formData[`${m.key}_left` as keyof typeof formData] as string;
                          const right = formData[`${m.key}_right` as keyof typeof formData] as string;
                          const asym = formData[`${m.key}_asymmetry` as keyof typeof formData] as number;
                          const status = formData[`${m.key}_status` as keyof typeof formData] as string;

                          return (
                            <div key={m.key} className="bg-bg-secondary p-6 rounded-2xl border border-border-primary grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                              <div className="font-display font-black text-xs text-text-primary uppercase tracking-wider">
                                {m.label}
                              </div>
                              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{t[lang].left} (kg)</label>
                                  <input 
                                    type="number" step="0.1" placeholder="0.0"
                                    value={left}
                                    onChange={e => updateVALD(m.key, "left", e.target.value)}
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary font-semibold outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{t[lang].right} (kg)</label>
                                  <input 
                                    type="number" step="0.1" placeholder="0.0"
                                    value={right}
                                    onChange={e => updateVALD(m.key, "right", e.target.value)}
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary font-semibold outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between items-center bg-bg-card border border-border-primary px-4 py-3.5 rounded-xl">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block">{t[lang].asym}</span>
                                  <span className="text-xs font-mono font-bold text-text-primary block">{asym}%</span>
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

                  {step === 3 && formData.assessment_type === "PERFORMANCE_DIAGNOSTICS" && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-accent-green/5 border border-accent-green/15 p-4 rounded-xl text-[10px] text-text-muted font-bold uppercase tracking-wide">
                        {lang === "EN" 
                          ? "CONFIG INTERVENTIONAL TRAINING ZONES (TARGET RANGES FOR LACTATE, HEART RATE AND SPEED)" 
                          : "TRAININGSBEREICHE KONFIGURIEREN (ZIELBEREICHE FÜR LAKTAT, HERZFREQUENZ UND GESCHWINDIGKEIT)"}
                      </div>

                      <div className="space-y-4">
                        {[
                          { key: "regeneration", label: lang === "EN" ? "Regeneration (EL/AL)" : "Regeneration (EL/AL)", color: "border-l-blue-500/50" },
                          { key: "basic_training", label: lang === "EN" ? "Basic Endurance (g)" : "Grundlagentraining (g)", color: "border-l-green-500/50" },
                          { key: "build_up", label: lang === "EN" ? "Build-up (GA2/MDL)" : "Aufbau (GA2/MDL)", color: "border-l-yellow-500/50" },
                          { key: "competition", label: lang === "EN" ? "Competition (Schwelle)" : "Wettkampf (Schwelle)", color: "border-l-orange-500/50" },
                          { key: "anaerobic", label: lang === "EN" ? "Anaerobic (Intervals)" : "anaerobes Training (Intervalle)", color: "border-l-red-500/50" }
                        ].map((zone) => {
                          const zoneData = formData.training_zones[zone.key] || { lactate: "", heart_rate: "", speed: "", speed_ms: "", energy: "", time_1000m: "", marathon_time: "" };
                          return (
                            <div key={zone.key} className={`bg-bg-secondary p-6 rounded-2xl border border-border-primary border-l-[6px] ${zone.color} space-y-4`}>
                              <div className="font-display font-black text-xs text-text-primary uppercase tracking-wider">
                                {zone.label}
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{lang === "EN" ? "LACTATE RANGE" : "LAKTATBEREICH"}</label>
                                  <input 
                                    type="text" placeholder="e.g. 2.0 - 3.0"
                                    value={zoneData.lactate}
                                    onChange={e => {
                                      const updatedZones = { ...formData.training_zones };
                                      updatedZones[zone.key] = { ...zoneData, lactate: e.target.value };
                                      setFormData({ ...formData, training_zones: updatedZones });
                                    }}
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-[10px] text-text-primary font-semibold outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{lang === "EN" ? "HR RANGE" : "HF-BEREICH"}</label>
                                  <input 
                                    type="text" placeholder="e.g. 130 - 150"
                                    value={zoneData.heart_rate}
                                    onChange={e => {
                                      const updatedZones = { ...formData.training_zones };
                                      updatedZones[zone.key] = { ...zoneData, heart_rate: e.target.value };
                                      setFormData({ ...formData, training_zones: updatedZones });
                                    }}
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-[10px] text-text-primary font-semibold outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{lang === "EN" ? "SPEED (KM/H)" : "GESCHWINDIGKEIT (KM/H)"}</label>
                                  <input 
                                    type="text" placeholder="e.g. 8.0 - 10.0"
                                    value={zoneData.speed}
                                    onChange={e => {
                                      const updatedZones = { ...formData.training_zones };
                                      updatedZones[zone.key] = { ...zoneData, speed: e.target.value };
                                      setFormData({ ...formData, training_zones: updatedZones });
                                    }}
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-[10px] text-text-primary font-semibold outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{lang === "EN" ? "SPEED (M/S)" : "GESCHWINDIGKEIT (M/S)"}</label>
                                  <input 
                                    type="text" placeholder="e.g. 2.2 - 2.4"
                                    value={zoneData.speed_ms || ""}
                                    onChange={e => {
                                      const updatedZones = { ...formData.training_zones };
                                      updatedZones[zone.key] = { ...zoneData, speed_ms: e.target.value };
                                      setFormData({ ...formData, training_zones: updatedZones });
                                    }}
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-[10px] text-text-primary font-semibold outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{lang === "EN" ? "ENERGY (KCAL/H)" : "ENERGIEVERBRAUCH (KCAL/H)"}</label>
                                  <input 
                                    type="text" placeholder="e.g. 600 - 700"
                                    value={zoneData.energy || ""}
                                    onChange={e => {
                                      const updatedZones = { ...formData.training_zones };
                                      updatedZones[zone.key] = { ...zoneData, energy: e.target.value };
                                      setFormData({ ...formData, training_zones: updatedZones });
                                    }}
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-[10px] text-text-primary font-semibold outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{lang === "EN" ? "1000M TIME" : "1000M-ZEIT"}</label>
                                  <input 
                                    type="text" placeholder="e.g. 07:00 - 06:00"
                                    value={zoneData.time_1000m || ""}
                                    onChange={e => {
                                      const updatedZones = { ...formData.training_zones };
                                      updatedZones[zone.key] = { ...zoneData, time_1000m: e.target.value };
                                      setFormData({ ...formData, training_zones: updatedZones });
                                    }}
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-[10px] text-text-primary font-semibold outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{lang === "EN" ? "MARATHON TIME" : "MARATHON-ZEIT"}</label>
                                  <input 
                                    type="text" placeholder="e.g. 05:00 - 04:00"
                                    value={zoneData.marathon_time || ""}
                                    onChange={e => {
                                      const updatedZones = { ...formData.training_zones };
                                      updatedZones[zone.key] = { ...zoneData, marathon_time: e.target.value };
                                      setFormData({ ...formData, training_zones: updatedZones });
                                    }}
                                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-[10px] text-text-primary font-semibold outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: FUNCTIONAL TESTS */}
                  {step === 4 && formData.assessment_type !== "PERFORMANCE_DIAGNOSTICS" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                      {[
                        { key: "cspine_rotation", label: t[lang].cspine_rotation },
                        { key: "forward_bend", label: t[lang].forward_bend },
                        { key: "hip_ir_left", label: t[lang].hip_ir_left },
                        { key: "hip_er_both", label: t[lang].hip_er_both },
                        { key: "deep_squat", label: t[lang].deep_squat },
                        { key: "ankle_df", label: t[lang].ankle_df },
                        { key: "great_toe_ext", label: t[lang].great_toe_ext },
                        { key: "single_leg_stand", label: t[lang].single_leg_stand }
                      ].map((tField) => {
                        const val = formData[tField.key as keyof typeof formData] as number;
                        return (
                          <div key={tField.key} className="bg-bg-secondary p-5 rounded-xl border border-border-primary space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                              <span className="text-text-secondary">{tField.label}</span>
                              <span className={val >= 70 ? "text-green-400" : val >= 50 ? "text-amber-500" : "text-red-500"}>{val}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" step="1"
                              value={val}
                              onChange={e => setFormData({ ...formData, [tField.key]: parseInt(e.target.value) })}
                              className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#22c55e]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* STEP 5: BODY MAP */}
                  {step === 5 && formData.assessment_type !== "PERFORMANCE_DIAGNOSTICS" && (
                    <div className="space-y-4 animate-fade-in">
                      <BodyMap 
                        zones={formData.body_map_zones}
                        onChange={(zones: any[]) => setFormData({ ...formData, body_map_zones: zones })}
                        readOnly={false}
                      />
                    </div>
                  )}

                  {/* STEP 6: PERFORMANCE IMPACT */}
                  {step === 6 && formData.assessment_type !== "PERFORMANCE_DIAGNOSTICS" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                      {[
                        { key: "acceleration_impact", label: t[lang].acceleration_impact },
                        { key: "sprint_impact", label: t[lang].sprint_impact },
                        { key: "change_of_direction_impact", label: t[lang].change_of_direction_impact },
                        { key: "kicking_impact", label: t[lang].kicking_impact },
                        { key: "landing_impact", label: t[lang].landing_impact },
                        { key: "single_leg_stability", label: t[lang].single_leg_stability }
                      ].map((i) => {
                        const val = formData[i.key as keyof typeof formData] as number;
                        return (
                          <div key={i.key} className="bg-bg-secondary p-5 rounded-xl border border-border-primary space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                              <span className="text-text-secondary">{i.label}</span>
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
                  {((step === 7 && formData.assessment_type !== "PERFORMANCE_DIAGNOSTICS") || (step === 4 && formData.assessment_type === "PERFORMANCE_DIAGNOSTICS")) && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Findings entry */}
                      <div className="p-6 bg-bg-card border border-border-primary rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-12 text-[10px] font-black text-text-primary uppercase tracking-[2px] pb-2 border-b border-border-primary">
                          {t[lang].addFinding}
                        </div>
                        <div className="md:col-span-4 space-y-2">
                          <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest">{t[lang].findingTitle}</label>
                          <input 
                            value={findingTitle}
                            onChange={e => setFindingTitle(e.target.value)}
                            placeholder="e.g. Hip Mobility Limit"
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary outline-none"
                          />
                        </div>
                        <div className="md:col-span-5 space-y-2">
                          <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest">{t[lang].findingDesc}</label>
                          <input 
                            value={findingDesc}
                            onChange={e => setFindingDesc(e.target.value)}
                            placeholder="e.g. Restricted IR on left side"
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary outline-none"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest">{t[lang].severity}</label>
                          <div className="flex gap-2">
                            <select 
                              value={findingSev}
                              onChange={e => setFindingSev(e.target.value as any)}
                              className="bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary outline-none appearance-none flex-grow"
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
                              {t[lang].addFindingBtn}
                            </button>
                          </div>
                        </div>

                        {/* List current findings */}
                        {formData.key_findings.length > 0 && (
                          <div className="md:col-span-12 space-y-2 mt-2">
                            {formData.key_findings.map((f, index) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-bg-sidebar border border-border-primary rounded-xl">
                                <div className="flex items-center gap-3">
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getSeverityLabelColor(f.severity)}`}>
                                    {f.severity}
                                  </span>
                                  <div>
                                    <span className="text-xs font-black text-text-primary">{f.title}: </span>
                                    <span className="text-xs text-text-muted">{f.description}</span>
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
                      <div className="p-6 bg-bg-card border border-border-primary rounded-2xl space-y-6">
                        <div className="text-[10px] font-black text-text-primary uppercase tracking-[2px] pb-2 border-b border-border-primary">
                          {t[lang].riskFactorsTitle}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {["Groin symptoms", "Hip mobility", "Ankle mobility", "Balance", "Pelvic control", "Hamstring tightness"].map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addRiskFactor(tag)}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black text-text-secondary uppercase tracking-widest transition-all"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                          <div className="md:col-span-6 space-y-2">
                            <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest">{t[lang].factorName}</label>
                            <input 
                              value={riskFactorName}
                              onChange={e => setRiskFactorName(e.target.value)}
                              placeholder="e.g. Quad tightness"
                              className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary outline-none"
                            />
                          </div>
                          <div className="md:col-span-4 space-y-2">
                            <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest">{t[lang].severity}</label>
                            <select 
                              value={riskFactorSev}
                              onChange={e => setRiskFactorSev(e.target.value as any)}
                              className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary outline-none appearance-none"
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
                              {t[lang].addFactorBtn}
                            </button>
                          </div>
                        </div>

                        {/* List current risk factors */}
                        {formData.risk_factors.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-primary">
                            {formData.risk_factors.map((r, index) => (
                              <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-xl">
                                <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: getSeverityColor(r.severity) }} />
                                <span className="text-[9px] font-black text-text-primary uppercase tracking-wider">{r.name}</span>
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
                        <label className="block text-[11px] font-black text-text-muted uppercase tracking-wider">{t[lang].coachSummary}</label>
                        <textarea
                          rows={4}
                          value={formData.coach_summary}
                          onChange={e => setFormData({ ...formData, coach_summary: e.target.value })}
                          placeholder={t[lang].summaryPlaceholder}
                          className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-xs text-text-primary focus:border-accent-green outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 8: REVIEW & SUBMIT */}
                  {((step === 8 && formData.assessment_type !== "PERFORMANCE_DIAGNOSTICS") || (step === 5 && formData.assessment_type === "PERFORMANCE_DIAGNOSTICS")) && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="p-6 bg-bg-card border border-border-primary rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-border-primary">
                          <Bookmark size={14} className="text-accent-green" />
                          <span className="text-[10px] font-black text-accent-green uppercase tracking-[3px]">
                            {t[lang].reviewTitle}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider">{t[lang].retestRecommended}</label>
                            <input 
                              type="date"
                              value={formData.retest_recommended_date}
                              onChange={e => setFormData({ ...formData, retest_recommended_date: e.target.value })}
                              className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2.5 px-3 text-xs text-text-primary outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider">{t[lang].comparePrev}</label>
                            <select 
                              value={formData.previous_assessment_id}
                              onChange={e => setFormData({ ...formData, previous_assessment_id: e.target.value })}
                              className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2.5 px-3 text-xs text-text-primary outline-none appearance-none"
                            >
                              <option value="">{t[lang].noPrev}</option>
                              {history.map((h: any) => (
                                <option key={h.id} value={h.id}>
                                  {h.assessment_date} - {h.assessment_type} ({h.status})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider">{t[lang].growthNotes}</label>
                          <textarea 
                            rows={3}
                            value={formData.improvement_notes}
                            onChange={e => setFormData({ ...formData, improvement_notes: e.target.value })}
                            placeholder={t[lang].growthPlaceholder}
                            className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-xs text-text-primary focus:border-accent-green outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* Summary dashboard representation */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: t[lang].performanceScore, val: formData.performance_score },
                          { label: t[lang].mobilityScore, val: formData.mobility_score },
                          { label: t[lang].symmetryScore, val: formData.symmetry_score },
                          { label: t[lang].riskScore, val: formData.risk_score }
                        ].map(c => (
                          <div key={c.label} className="p-4 bg-bg-card border border-border-primary rounded-xl text-center">
                            <div className="text-[8px] font-black text-text-muted uppercase tracking-widest">{c.label}</div>
                            <div className={`text-2xl font-display font-black mt-1 ${getScoreColor(c.val)}`}>{c.val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Submit Actions */}
                      <div className="pt-6 border-t border-border-primary grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleSubmit(true)}
                          className="py-4 bg-bg-secondary border border-border-primary/50 text-text-primary font-black text-[10px] tracking-widest rounded-xl hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
                          {t[lang].draftText}
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleSubmit(false)}
                          className="py-4 bg-accent-green text-black font-black text-[10px] tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(34,197,94,0.2)]"
                        >
                          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
                          {t[lang].submitText}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Wizard Navigation Bar */}
            {!success && (
              <div className="p-6 border-t border-border-primary flex justify-between bg-bg-secondary">
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() => setStep(prev => prev - 1)}
                  className="px-6 py-3 rounded-xl border border-border-primary text-[10px] font-black text-text-muted hover:text-text-primary uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={12} /> {t[lang].back}
                </button>
                <button
                  type="button"
                  disabled={step === STEPS.length}
                  onClick={() => setStep(prev => prev + 1)}
                  className="px-6 py-3 bg-white/5 border border-border-primary rounded-xl text-[10px] font-black text-text-primary hover:bg-white/10 uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {t[lang].next} <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
