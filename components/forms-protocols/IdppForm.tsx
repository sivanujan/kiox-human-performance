"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronRight, Save, FileText, ArrowLeft, Loader2, Award, Printer } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

interface IdppFormProps {
  idppId?: string | null;
  onBack: () => void;
  onSaved: () => void;
  readOnly?: boolean;
}

const SECTIONS = [
  "General Details",
  "1. Player Aspiration Profile",
  "2. Comprehensive Assessment",
  "3. Physical Performance",
  "4. GPS & Wearables",
  "5. Mental Performance",
  "6. Nutrition & Recovery",
  "7. Injury Risk Screening",
  "8. Development Priorities",
  "9. 90-Day Action Plan",
  "10. Training Prescription",
  "11. Performance Dashboard",
  "12. Coach Review",
  "13. Commitment Agreement"
];

const DEFAULT_MENTAL_PROFILE = [
  { rowName: "Confidence", score: "", intervention: "Confidence routine", notes: "" },
  { rowName: "Focus", score: "", intervention: "Pre-training checklist", notes: "" },
  { rowName: "Resilience", score: "", intervention: "Reset trigger action", notes: "" },
  { rowName: "Coachability", score: "", intervention: "Feedback session habit", notes: "" },
  { rowName: "Discipline", score: "", intervention: "Daily habits review", notes: "" },
  { rowName: "Motivation", score: "", intervention: "Goal visual reminders", notes: "" },
  { rowName: "Leadership", score: "", intervention: "Peer mentoring role", notes: "" },
  { rowName: "Emotional control", score: "", intervention: "Breathing techniques", notes: "" }
];

export default function IdppForm({ idppId = null, onBack, onSaved, readOnly = false }: IdppFormProps) {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("General Details");
  const [athletes, setAthletes] = useState<any[]>([]);

  // ── HEADER & DEMOGRAPHICS STATE ──
  const [athleteId, setAthleteId] = useState("");
  const [coachName, setCoachName] = useState(
    profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : ""
  );
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [reviewDate, setReviewDate] = useState("");
  const [dob, setDob] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [positions, setPositions] = useState("");
  const [clubTeam, setClubTeam] = useState("");
  const [parentName, setParentName] = useState("");
  const [leadCoach, setLeadCoach] = useState("");
  const [performanceCoach, setPerformanceCoach] = useState("");
  const [academyTier, setAcademyTier] = useState("Emerging");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED">("DRAFT");

  // ── SECTION 1 STATE: Player Aspiration Profile ──
  const [longTermGoal, setLongTermGoal] = useState("");
  const [seasonalGoal, setSeasonalGoal] = useState("");
  const [mainPositionAmbition, setMainPositionAmbition] = useState("");
  const [playerStrengths, setPlayerStrengths] = useState("");
  const [playerChallenges, setPlayerChallenges] = useState("");
  const [currentFocus, setCurrentFocus] = useState<string[]>([]); // Technical, Tactical, Speed, Strength, Recovery, Mental, Leadership

  // ── SECTION 2 STATE: Comprehensive Assessment ──
  const [technicalProfile, setTechnicalProfile] = useState([
    { rowName: "First touch", score: "", target: "", notes: "" },
    { rowName: "Passing accuracy", score: "", target: "", notes: "" },
    { rowName: "Receiving under pressure", score: "", target: "", notes: "" },
    { rowName: "Dribbling and ball mastery", score: "", target: "", notes: "" },
    { rowName: "Finishing", score: "", target: "", notes: "" },
    { rowName: "Weak foot ability", score: "", target: "", notes: "" },
    { rowName: "Crossing/final ball", score: "", target: "", notes: "" },
    { rowName: "1v1 attacking", score: "", target: "", notes: "" },
    { rowName: "1v1 defending", score: "", target: "", notes: "" },
    { rowName: "Heading/aerial duels", score: "", target: "", notes: "" }
  ]);
  const [tacticalProfile, setTacticalProfile] = useState([
    { rowName: "Game IQ", score: "", evidence: "", priority: "" },
    { rowName: "Positioning", score: "", evidence: "", priority: "" },
    { rowName: "Decision making", score: "", evidence: "", priority: "" },
    { rowName: "Transition awareness", score: "", evidence: "", priority: "" },
    { rowName: "Defensive shape", score: "", evidence: "", priority: "" },
    { rowName: "Off-ball movement", score: "", evidence: "", priority: "" },
    { rowName: "Communication", score: "", evidence: "", priority: "" },
    { rowName: "Scanning frequency", score: "", evidence: "", priority: "" }
  ]);

  // ── SECTION 3 STATE: Physical Performance Profile ──
  const [physicalProfile, setPhysicalProfile] = useState([
    { rowName: "10m sprint", result: "", target: "", comment: "" },
    { rowName: "20m sprint", result: "", target: "", comment: "" },
    { rowName: "Flying sprint/max speed", result: "", target: "", comment: "" },
    { rowName: "Vertical jump", result: "", target: "", comment: "" },
    { rowName: "Broad jump", result: "", target: "", comment: "" },
    { rowName: "Change of direction", result: "", target: "", comment: "" },
    { rowName: "Yo-Yo/aerobic capacity", result: "", target: "", comment: "" },
    { rowName: "Mobility quality", result: "", target: "", comment: "" },
    { rowName: "Balance/coordination", result: "", target: "", comment: "" }
  ]);

  // ── SECTION 4 STATE: GPS / Wearables ──
  const [gpsData, setGpsData] = useState([
    { rowName: "Total distance", current: "", target: "", notes: "" },
    { rowName: "High-speed running", current: "", target: "", notes: "" },
    { rowName: "Sprint distance", current: "", target: "", notes: "" },
    { rowName: "Maximum speed", current: "", target: "", notes: "" },
    { rowName: "Accelerations", current: "", target: "", notes: "" },
    { rowName: "Decelerations", current: "", target: "", notes: "" },
    { rowName: "Training load", current: "", target: "", notes: "" },
    { rowName: "Readiness score", current: "", target: "", notes: "" }
  ]);

  // ── SECTION 5 STATE: Mental Performance ──
  const [mentalProfile, setMentalProfile] = useState(DEFAULT_MENTAL_PROFILE);

  // ── SECTION 6 STATE: Nutrition & Recovery ──
  const [lifestyleProfile, setLifestyleProfile] = useState([
    { rowName: "Hydration", score: "", targetHabit: "", notes: "" },
    { rowName: "Protein intake", score: "", targetHabit: "", notes: "" },
    { rowName: "Meal consistency", score: "", targetHabit: "", notes: "" },
    { rowName: "Sleep duration", score: "", targetHabit: "", notes: "" },
    { rowName: "Sleep quality", score: "", targetHabit: "", notes: "" },
    { rowName: "Recovery methods", score: "", targetHabit: "", notes: "" },
    { rowName: "School-life balance", score: "", targetHabit: "", notes: "" }
  ]);

  // ── SECTION 7 STATE: Injury Risk Screening ──
  const [injuryRisk, setInjuryRisk] = useState([
    { rowName: "Ankles", status: "", riskLevel: "Low", action: "" },
    { rowName: "Knees", status: "", riskLevel: "Low", action: "" },
    { rowName: "Hips", status: "", riskLevel: "Low", action: "" },
    { rowName: "Groin", status: "", riskLevel: "Low", action: "" },
    { rowName: "Hamstrings", status: "", riskLevel: "Low", action: "" },
    { rowName: "Lower back", status: "", riskLevel: "Low", action: "" },
    { rowName: "Shoulders", status: "", riskLevel: "Low", action: "" }
  ]);

  // ── SECTION 8 STATE: Development Priority Matrix ──
  const [priorityMatrix, setPriorityMatrix] = useState([
    { id: 1, goal: "", actions: "", timeline: "", successMetric: "" },
    { id: 2, goal: "", actions: "", timeline: "", successMetric: "" },
    { id: 3, goal: "", actions: "", timeline: "", successMetric: "" }
  ]);

  // ── SECTION 9 STATE: 90-Day Action Plan ──
  const [actionPlan, setActionPlan] = useState([
    { rowName: "Technical", goal: "", weeklyAction: "", successMetric: "", owner: "" },
    { rowName: "Tactical", goal: "", weeklyAction: "", successMetric: "", owner: "" },
    { rowName: "Physical", goal: "", weeklyAction: "", successMetric: "", owner: "" },
    { rowName: "Mental", goal: "", weeklyAction: "", successMetric: "", owner: "" },
    { rowName: "Recovery", goal: "", weeklyAction: "", successMetric: "", owner: "" },
    { rowName: "Lifestyle/Academics", goal: "", weeklyAction: "", successMetric: "", owner: "" }
  ]);

  // ── SECTION 10 STATE: Weekly Training Prescription ──
  const [trainingPrescription, setTrainingPrescription] = useState([
    { rowName: "Team training", sessionsPerWeek: "", focus: "", notes: "" },
    { rowName: "Technical training", sessionsPerWeek: "", focus: "", notes: "" },
    { rowName: "Speed training", sessionsPerWeek: "", focus: "", notes: "" },
    { rowName: "Strength training", sessionsPerWeek: "", focus: "", notes: "" },
    { rowName: "Recovery session", sessionsPerWeek: "", focus: "", notes: "" },
    { rowName: "Video analysis", sessionsPerWeek: "", focus: "", notes: "" },
    { rowName: "Mental training", sessionsPerWeek: "", focus: "", notes: "" }
  ]);

  // ── SECTION 11 STATE: Performance Dashboard (Inputs) ──
  const [dashboardScores, setDashboardScores] = useState({
    technical: "",
    tactical: "",
    physical: "",
    mental: "",
    lifestyle: ""
  });

  // ── SECTION 12 STATE: Coach Review ──
  const [progressSinceLast, setProgressSinceLast] = useState("");
  const [improvedAreas, setImprovedAreas] = useState("");
  const [areasRequiringFocus, setAreasRequiringFocus] = useState("");
  const [coachRecommendations, setCoachRecommendations] = useState("");
  const [athleteReflection, setAthleteReflection] = useState("");
  const [parentNotes, setParentNotes] = useState("");

  // ── SECTION 13 STATE: Commitment Agreement ──
  const [agreement, setAgreement] = useState([
    { rowName: "Athlete", signature: "", name: "", date: "" },
    { rowName: "Parent/Guardian", signature: "", name: "", date: "" },
    { rowName: "Lead Coach", signature: "", name: "", date: "" },
    { rowName: "Performance Coach", signature: "", name: "", date: "" }
  ]);

  // ── FETCH ATHLETES & LOAD FORM DATA ──
  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const res = await fetch("/api/admin/athletes");
        const data = await res.json();
        if (!data.error) setAthletes(data);
      } catch (err) {
        console.error("Failed to load athletes list:", err);
      }
    };
    fetchAthletes();
  }, []);

  useEffect(() => {
    if (idppId) {
      loadIdppData(idppId);
    }
  }, [idppId]);

  const loadIdppData = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/idpps?id=${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch IDPP details.");
      }

      if (data) {
        setAthleteId(data.athlete_id);
        setCoachName(data.coach_name);
        setAssessmentDate(data.assessment_date);
        setReviewDate(data.review_date || "");
        setStatus(data.status);

        const f = data.form_data || {};
        // Populate demographics
        setDob(f.dob || "");
        setAgeGroup(f.ageGroup || "");
        setPositions(f.positions || "");
        setClubTeam(f.clubTeam || "");
        setParentName(f.parentName || "");
        setLeadCoach(f.leadCoach || "");
        setPerformanceCoach(f.performanceCoach || "");
        setAcademyTier(f.academyTier || "Emerging");
        setPrimaryGoal(f.primaryGoal || "");

        // Section 1
        setLongTermGoal(f.longTermGoal || "");
        setSeasonalGoal(f.seasonalGoal || "");
        setMainPositionAmbition(f.mainPositionAmbition || "");
        setPlayerStrengths(f.playerStrengths || "");
        setPlayerChallenges(f.playerChallenges || "");
        setCurrentFocus(f.currentFocus || []);

        // Section 2
        if (f.technicalProfile) setTechnicalProfile(f.technicalProfile);
        if (f.tacticalProfile) setTacticalProfile(f.tacticalProfile);

        // Section 3
        if (f.physicalProfile) setPhysicalProfile(f.physicalProfile);

        // Section 4
        if (f.gpsData) setGpsData(f.gpsData);

        // Section 5
        if (f.mentalProfile) setMentalProfile(f.mentalProfile);

        // Section 6
        if (f.lifestyleProfile) setLifestyleProfile(f.lifestyleProfile);

        // Section 7
        if (f.injuryRisk) setInjuryRisk(f.injuryRisk);

        // Section 8
        if (f.priorityMatrix) setPriorityMatrix(f.priorityMatrix);

        // Section 9
        if (f.actionPlan) setActionPlan(f.actionPlan);

        // Section 10
        if (f.trainingPrescription) setTrainingPrescription(f.trainingPrescription);

        // Section 11
        if (f.dashboardScores) setDashboardScores(f.dashboardScores);

        // Section 12
        setProgressSinceLast(f.progressSinceLast || "");
        setImprovedAreas(f.improvedAreas || "");
        setAreasRequiringFocus(f.areasRequiringFocus || "");
        setCoachRecommendations(f.coachRecommendations || "");
        setAthleteReflection(f.athleteReflection || "");
        setParentNotes(f.parentNotes || "");

        // Section 13
        if (f.agreement) setAgreement(f.agreement);
      }
    } catch (err: any) {
      console.error("Error loading IDPP:", err);
      alert(`Error loading IDPP details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── SECTION 11 LIVE CALCULATIONS ──
  const dashboardCalculations = useMemo(() => {
    const techInput = parseFloat(dashboardScores.technical) || 0;
    const tactInput = parseFloat(dashboardScores.tactical) || 0;
    const physInput = parseFloat(dashboardScores.physical) || 0;
    const mentInput = parseFloat(dashboardScores.mental) || 0;
    const lifeInput = parseFloat(dashboardScores.lifestyle) || 0;

    // Normalizations to /100 total
    const techWeighted = techInput * 1.25; // max 25 (20 * 1.25)
    const tactWeighted = tactInput * 1.00; // max 20 (20 * 1.0)
    const physWeighted = physInput * 1.25; // max 25 (20 * 1.25)
    const mentWeighted = mentInput * 0.75; // max 15 (20 * 0.75)
    const lifeWeighted = lifeInput * 0.75; // max 15 (20 * 0.75)

    const totalIndex = Math.round(
      techWeighted + tactWeighted + physWeighted + mentWeighted + lifeWeighted
    );

    let calculatedTier = "Emerging";
    if (totalIndex >= 90) calculatedTier = "Professional Pathway";
    else if (totalIndex >= 80) calculatedTier = "Elite";
    else if (totalIndex >= 65) calculatedTier = "Performance";
    else if (totalIndex >= 50) calculatedTier = "Development";

    return {
      techWeighted: techWeighted.toFixed(2),
      tactWeighted: tactWeighted.toFixed(2),
      physWeighted: physWeighted.toFixed(2),
      mentWeighted: mentWeighted.toFixed(2),
      lifeWeighted: lifeWeighted.toFixed(2),
      totalIndex,
      calculatedTier
    };
  }, [dashboardScores]);

  // ── SAVE & SUBMIT LOGIC ──
  const handleSave = async (submitStatus: "DRAFT" | "SUBMITTED") => {
    if (!athleteId) {
      alert("Please select an athlete.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        athlete_id: athleteId,
        coach_name: coachName,
        assessment_date: assessmentDate,
        review_date: reviewDate || null,
        status: submitStatus,
        form_data: {
          dob,
          ageGroup,
          positions,
          clubTeam,
          parentName,
          leadCoach,
          performanceCoach,
          academyTier,
          primaryGoal,
          longTermGoal,
          seasonalGoal,
          mainPositionAmbition,
          playerStrengths,
          playerChallenges,
          currentFocus,
          technicalProfile,
          tacticalProfile,
          physicalProfile,
          gpsData,
          mentalProfile,
          lifestyleProfile,
          injuryRisk,
          priorityMatrix,
          actionPlan,
          trainingPrescription,
          dashboardScores,
          progressSinceLast,
          improvedAreas,
          areasRequiringFocus,
          coachRecommendations,
          athleteReflection,
          parentNotes,
          agreement
        },
        updated_at: new Date().toISOString()
      };

      let response;
      if (idppId) {
        response = await fetch("/api/admin/idpps", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: idppId, ...payload })
        });
      } else {
        response = await fetch("/api/admin/idpps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, created_by: user?.id || null })
        });
      }

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to save IDPP.");
      }

      alert(submitStatus === "SUBMITTED" ? "IDPP submitted successfully!" : "IDPP draft saved.");
      onSaved();
    } catch (err: any) {
      console.error("Save IDPP error:", err);
      alert(`Error saving IDPP: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── PDF EXPORT LOGIC ──
  const handleExportPDF = () => {
    const athlete = athletes.find((a) => a.id === athleteId);
    const athleteNameDisplay = athlete ? `${athlete.first_name} ${athlete.last_name}` : "Unknown";

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Helper to generate section focus tags html
    const focusHtml = currentFocus.map(f => `<span style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); color: #166534; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: bold; margin-right: 6px; display: inline-block;">${f}</span>`).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>IDPP - ${athleteNameDisplay}</title>
          <style>
            @page {
              size: A4;
              margin: 18mm 18mm 18mm 18mm;
            }
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #1f2937;
              background-color: #ffffff;
              line-height: 1.4;
              font-size: 11px;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #22c55e;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .logo-text {
              font-size: 24px;
              font-weight: 900;
              color: #000;
              letter-spacing: 2px;
            }
            .logo-text span {
              color: #22c55e;
            }
            .title-right {
              text-align: right;
            }
            .title-right h1 {
              font-size: 15px;
              font-weight: bold;
              margin: 0;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .title-right p {
              margin: 3px 0 0 0;
              font-size: 9px;
              color: #6b7280;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .section-card {
              background: #fafafa;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              color: #111827;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 6px;
              margin-top: 0;
              margin-bottom: 12px;
              letter-spacing: 0.5px;
            }
            .grid-fields {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }
            .field {
              display: flex;
              flex-direction: column;
            }
            .field-label {
              font-size: 8px;
              font-weight: bold;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 3px;
            }
            .field-val {
              font-size: 11px;
              font-weight: bold;
              color: #111827;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 5px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 6px 8px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              font-size: 8.5px;
              font-weight: bold;
              text-transform: uppercase;
              color: #4b5563;
              letter-spacing: 0.5px;
            }
            .badge-tier {
              background: #22c55e;
              color: white;
              padding: 4px 10px;
              border-radius: 4px;
              font-weight: bold;
              display: inline-block;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .commitment-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .sig-block {
              border: 1px dashed #d1d5db;
              border-radius: 6px;
              padding: 10px;
              background: #fff;
            }
            .sig-title {
              font-weight: bold;
              font-size: 9px;
              text-transform: uppercase;
              color: #374151;
              margin-bottom: 10px;
            }
            .sig-line {
              font-style: italic;
              border-bottom: 1px solid #9ca3af;
              padding-bottom: 2px;
              margin-bottom: 5px;
              min-height: 18px;
            }
            .footer-info {
              margin-top: 30px;
              text-align: center;
              font-size: 8px;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .page-break {
              page-break-after: always;
            }
            .text-area-val {
              white-space: pre-wrap;
              color: #374151;
              font-size: 10.5px;
            }
          </style>
        </head>
        <body>
          <!-- HEADER -->
          <div class="header-container">
            <div class="logo-text">KIO<span>X</span></div>
            <div class="title-right">
              <h1>Individual Development Performance Plan (IDPP)</h1>
              <p>Player Profiling & Tactical Blueprint</p>
            </div>
          </div>

          <!-- DEMOGRAPHICS -->
          <div class="section-card">
            <div class="section-title">Athlete Profile & Organizer Metadata</div>
            <div class="grid-fields">
              <div class="field">
                <span class="field-label">Athlete Name</span>
                <span class="field-val">${athleteNameDisplay}</span>
              </div>
              <div class="field">
                <span class="field-label">Date of Birth</span>
                <span class="field-val">${dob}</span>
              </div>
              <div class="field">
                <span class="field-label">Age Group</span>
                <span class="field-val">${ageGroup}</span>
              </div>
              <div class="field">
                <span class="field-label">Position(s)</span>
                <span class="field-val">${positions}</span>
              </div>
              <div class="field">
                <span class="field-label">Club / School Team</span>
                <span class="field-val">${clubTeam}</span>
              </div>
              <div class="field">
                <span class="field-label">Parent / Guardian</span>
                <span class="field-val">${parentName}</span>
              </div>
              <div class="field">
                <span class="field-label">Lead Coach</span>
                <span class="field-val">${leadCoach}</span>
              </div>
              <div class="field">
                <span class="field-label">Performance Coach</span>
                <span class="field-val">${performanceCoach}</span>
              </div>
              <div class="field">
                <span class="field-label">Academy Tier</span>
                <span class="field-val">${academyTier}</span>
              </div>
              <div class="field">
                <span class="field-label">Assessment Date</span>
                <span class="field-val">${assessmentDate}</span>
              </div>
              <div class="field">
                <span class="field-label">Review Date</span>
                <span class="field-val">${reviewDate}</span>
              </div>
              <div class="field">
                <span class="field-label">Primary Goal</span>
                <span class="field-val">${primaryGoal}</span>
              </div>
            </div>
          </div>

          <!-- SECTION 1 -->
          <div class="section-card">
            <div class="section-title">1. Player Aspiration Profile</div>
            <div style="margin-bottom: 12px;">
              <div class="field-label">Long-Term Goal (3-5 Years)</div>
              <div class="text-area-val">${longTermGoal || "N/A"}</div>
            </div>
            <div style="margin-bottom: 12px;">
              <div class="field-label">Seasonal Goal (12 Months)</div>
              <div class="text-area-val">${seasonalGoal || "N/A"}</div>
            </div>
            <div style="margin-bottom: 12px;">
              <div class="field-label">Main Position Ambition</div>
              <div class="text-area-val">${mainPositionAmbition || "N/A"}</div>
            </div>
            <div style="margin-bottom: 12px;">
              <div class="field-label">Player Strengths</div>
              <div class="text-area-val">${playerStrengths || "N/A"}</div>
            </div>
            <div style="margin-bottom: 12px;">
              <div class="field-label">Player Challenges</div>
              <div class="text-area-val">${playerChallenges || "N/A"}</div>
            </div>
            <div>
              <div class="field-label">Current Development Focus Areas</div>
              <div style="margin-top: 5px;">${focusHtml || "None Selected"}</div>
            </div>
          </div>

          <div class="page-break"></div>

          <!-- SECTION 2 -->
          <div class="section-card">
            <div class="section-title">2. Comprehensive Athlete Assessment</div>
            
            <div style="font-weight: bold; margin-bottom: 6px; font-size: 10px; text-transform: uppercase; color: #4b5563;">a) Technical Profile</div>
            <table>
              <thead>
                <tr>
                  <th>Technical Attribute</th>
                  <th style="width: 100px; text-align: center;">Current Score /10</th>
                  <th style="width: 100px; text-align: center;">Target /10</th>
                  <th>Coach Notes</th>
                </tr>
              </thead>
              <tbody>
                ${technicalProfile.map(row => `
                  <tr>
                    <td style="font-weight: bold;">${row.rowName}</td>
                    <td style="text-align: center; font-weight: bold;">${row.score || "-"}</td>
                    <td style="text-align: center; font-weight: bold;">${row.target || "-"}</td>
                    <td>${row.notes || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div style="font-weight: bold; margin-top: 15px; margin-bottom: 6px; font-size: 10px; text-transform: uppercase; color: #4b5563;">b) Tactical and Game Intelligence Profile</div>
            <table>
              <thead>
                <tr>
                  <th>Tactical Attribute</th>
                  <th style="width: 100px; text-align: center;">Score /10</th>
                  <th>Evidence Observed</th>
                  <th>Development Priority</th>
                </tr>
              </thead>
              <tbody>
                ${tacticalProfile.map(row => `
                  <tr>
                    <td style="font-weight: bold;">${row.rowName}</td>
                    <td style="text-align: center; font-weight: bold;">${row.score || "-"}</td>
                    <td>${row.evidence || ""}</td>
                    <td>${row.priority || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="page-break"></div>

          <!-- SECTION 3 & 4 -->
          <div class="section-card">
            <div class="section-title">3. Physical Performance Profile</div>
            <table>
              <thead>
                <tr>
                  <th>Test Parameter</th>
                  <th style="width: 120px;">Result</th>
                  <th style="width: 120px;">Target</th>
                  <th>Squad Rank / Comment</th>
                </tr>
              </thead>
              <tbody>
                ${physicalProfile.map(row => `
                  <tr>
                    <td style="font-weight: bold;">${row.rowName}</td>
                    <td>${row.result || "-"}</td>
                    <td>${row.target || "-"}</td>
                    <td>${row.comment || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="section-card">
            <div class="section-title">4. GPS / Wearable Performance Telemetry</div>
            <table>
              <thead>
                <tr>
                  <th>Performance Metric</th>
                  <th style="width: 120px;">Current</th>
                  <th style="width: 120px;">Target</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${gpsData.map(row => `
                  <tr>
                    <td style="font-weight: bold;">${row.rowName}</td>
                    <td>${row.current || "-"}</td>
                    <td>${row.target || "-"}</td>
                    <td>${row.notes || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="page-break"></div>

          <!-- SECTION 5 & 6 -->
          <div class="section-card">
            <div class="section-title">5. Mental Performance Profile</div>
            <table>
              <thead>
                <tr>
                  <th>Psychological Trait</th>
                  <th style="width: 80px; text-align: center;">Score /10</th>
                  <th style="width: 180px;">Recommended Habit / Intervention</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${mentalProfile.map(row => `
                  <tr>
                    <td style="font-weight: bold;">${row.rowName}</td>
                    <td style="text-align: center; font-weight: bold;">${row.score || "-"}</td>
                    <td>${row.intervention || ""}</td>
                    <td>${row.notes || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="section-card">
            <div class="section-title">6. Nutrition, Recovery and Lifestyle Habits</div>
            <table>
              <thead>
                <tr>
                  <th>Lifestyle Habit</th>
                  <th style="width: 100px; text-align: center;">Habit Rating /10</th>
                  <th style="width: 180px;">Target Habit / Trigger</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${lifestyleProfile.map(row => `
                  <tr>
                    <td style="font-weight: bold;">${row.rowName}</td>
                    <td style="text-align: center; font-weight: bold;">${row.score || "-"}</td>
                    <td>${row.targetHabit || ""}</td>
                    <td>${row.notes || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="page-break"></div>

          <!-- SECTION 7 & 8 -->
          <div class="section-card">
            <div class="section-title">7. Injury Risk Screening</div>
            <table>
              <thead>
                <tr>
                  <th>Anatomical Region</th>
                  <th style="width: 150px;">Functional Status</th>
                  <th style="width: 100px; text-align: center;">Risk Level</th>
                  <th>Recommended Preventive Action</th>
                </tr>
              </thead>
              <tbody>
                ${injuryRisk.map(row => `
                  <tr>
                    <td style="font-weight: bold;">${row.rowName}</td>
                    <td>${row.status || ""}</td>
                    <td style="text-align: center; font-weight: bold; color: ${row.riskLevel === 'High' ? '#ef4444' : row.riskLevel === 'Medium' ? '#f97316' : '#22c55e'}">${row.riskLevel || "Low"}</td>
                    <td>${row.action || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="section-card">
            <div class="section-title">8. Development Priority Matrix</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 60px; text-align: center;">Rank</th>
                  <th style="width: 180px;">Priority Goal</th>
                  <th>Weekly Actions</th>
                  <th style="width: 100px;">Timeline</th>
                  <th style="width: 150px;">Success Metric</th>
                </tr>
              </thead>
              <tbody>
                ${priorityMatrix.map(row => `
                  <tr>
                    <td style="text-align: center; font-weight: bold;">#${row.id}</td>
                    <td style="font-weight: bold;">${row.goal || ""}</td>
                    <td>${row.actions || ""}</td>
                    <td>${row.timeline || ""}</td>
                    <td>${row.successMetric || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="page-break"></div>

          <!-- SECTION 9 & 10 -->
          <div class="section-card">
            <div class="section-title">9. 90-Day Action Plan</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 120px;">Development Layer</th>
                  <th>90-Day Goal</th>
                  <th>Weekly Action</th>
                  <th>Success Metric</th>
                  <th style="width: 120px;">Owner</th>
                </tr>
              </thead>
              <tbody>
                ${actionPlan.map(row => `
                  <tr>
                    <td style="font-weight: bold;">${row.rowName}</td>
                    <td>${row.goal || ""}</td>
                    <td>${row.weeklyAction || ""}</td>
                    <td>${row.successMetric || ""}</td>
                    <td>${row.owner || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="section-card">
            <div class="section-title">10. Weekly Training Prescription</div>
            <table>
              <thead>
                <tr>
                  <th>Training Modality</th>
                  <th style="width: 100px; text-align: center;">Sessions / Week</th>
                  <th style="width: 200px;">Session Focus</th>
                  <th>Coach Notes</th>
                </tr>
              </thead>
              <tbody>
                ${trainingPrescription.map(row => `
                  <tr>
                    <td style="font-weight: bold;">${row.rowName}</td>
                    <td style="text-align: center; font-weight: bold;">${row.sessionsPerWeek || "-"}</td>
                    <td>${row.focus || ""}</td>
                    <td>${row.notes || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="page-break"></div>

          <!-- SECTION 11 & 12 -->
          <div class="section-card">
            <div class="section-title">11. Athlete Performance Dashboard</div>
            <table style="margin-bottom: 20px;">
              <thead>
                <tr>
                  <th>Performance Dimension</th>
                  <th style="width: 100px; text-align: center;">Score /20</th>
                  <th style="width: 100px; text-align: center;">Weight</th>
                  <th style="width: 120px; text-align: center;">Weighted Score /100</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: bold;">Technical</td>
                  <td style="text-align: center; font-weight: bold;">${dashboardScores.technical || "-"}</td>
                  <td style="text-align: center; color: #6b7280;">25%</td>
                  <td style="text-align: center; font-weight: bold;">${dashboardCalculations.techWeighted}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">Tactical</td>
                  <td style="text-align: center; font-weight: bold;">${dashboardScores.tactical || "-"}</td>
                  <td style="text-align: center; color: #6b7280;">20%</td>
                  <td style="text-align: center; font-weight: bold;">${dashboardCalculations.tactWeighted}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">Physical</td>
                  <td style="text-align: center; font-weight: bold;">${dashboardScores.physical || "-"}</td>
                  <td style="text-align: center; color: #6b7280;">25%</td>
                  <td style="text-align: center; font-weight: bold;">${dashboardCalculations.physWeighted}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">Mental</td>
                  <td style="text-align: center; font-weight: bold;">${dashboardScores.mental || "-"}</td>
                  <td style="text-align: center; color: #6b7280;">15%</td>
                  <td style="text-align: center; font-weight: bold;">${dashboardCalculations.mentWeighted}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">Lifestyle and Recovery</td>
                  <td style="text-align: center; font-weight: bold;">${dashboardScores.lifestyle || "-"}</td>
                  <td style="text-align: center; color: #6b7280;">15%</td>
                  <td style="text-align: center; font-weight: bold;">${dashboardCalculations.lifeWeighted}</td>
                </tr>
              </tbody>
            </table>

            <div style="display: flex; justify-content: space-between; align-items: center; background: #f3f4f6; padding: 12px; border-radius: 6px;">
              <div>
                <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #4b5563; display: block; letter-spacing: 1px;">Calculated Performance Index</span>
                <span style="font-size: 20px; font-weight: 900; color: #111827; font-family: monospace;">${dashboardCalculations.totalIndex} / 100</span>
              </div>
              <div>
                <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #4b5563; display: block; letter-spacing: 1px; text-align: right; margin-bottom: 3px;">Assigned Development Tier</span>
                <div class="badge-tier">${dashboardCalculations.calculatedTier}</div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <div class="section-title">12. Coach Review and Accountability</div>
            <div style="margin-bottom: 10px;">
              <div class="field-label">Progress since last review</div>
              <div class="text-area-val">${progressSinceLast || "N/A"}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div class="field-label">Improved areas</div>
              <div class="text-area-val">${improvedAreas || "N/A"}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div class="field-label">Areas still requiring focus</div>
              <div class="text-area-val">${areasRequiringFocus || "N/A"}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div class="field-label">Coach recommendations</div>
              <div class="text-area-val">${coachRecommendations || "N/A"}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div class="field-label">Athlete reflection / Feedback</div>
              <div class="text-area-val">${athleteReflection || "N/A"}</div>
            </div>
            <div>
              <div class="field-label">Parent / guardian notes</div>
              <div class="text-area-val">${parentNotes || "N/A"}</div>
            </div>
          </div>

          <div class="page-break"></div>

          <!-- SECTION 13 -->
          <div class="section-card" style="margin-top: 15px;">
            <div class="section-title">13. Athlete Commitment Agreement</div>
            <p style="font-size: 9px; color: #4b5563; margin-bottom: 15px; font-style: italic;">
              By signing below, the athlete, parents, and coaching staff commit to executing the development items prescribed in this blueprint.
            </p>
            <div class="commitment-grid">
              ${agreement.map(row => `
                <div class="sig-block">
                  <div class="sig-title">${row.rowName} Signoff</div>
                  <div class="sig-line">${row.signature || "Pending digital signoff..."}</div>
                  <div style="display: flex; justify-content: space-between; font-size: 8px; color: #6b7280;">
                    <span>NAME: ${row.name || "N/A"}</span>
                    <span>DATE: ${row.date || "N/A"}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="footer-info">
            KIO-X PERFORMANCE PROTOCOL SYNC • OFFICIAL blueprint DOCUMENT
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
        <Loader2 className="animate-spin text-[var(--accent-green)]" size={32} />
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest animate-pulse font-bold">
          Syncing Blueprint Data Matrix...
        </span>
      </div>
    );
  }

  const inputCls = "w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] transition-all font-semibold";
  const labelCls = "block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 ml-1";
  const sectionTitleCls = "text-sm font-black text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border-primary)]/40 pb-2 mb-4 flex items-center justify-between";

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden p-6 space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-[var(--border-primary)]/40 pb-4">
        <div>
          <h2 className="text-base font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <Award size={18} className="text-[var(--accent-green)]" />
            {readOnly ? "Individual Development Performance Plan (View)" : idppId ? "Edit IDPP Blueprint" : "Create New IDPP Blueprint"}
          </h2>
          <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-widest mt-0.5">
            13-Section Academy Athlete Blueprint Matrix
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-[var(--border-primary)] hover:border-[var(--border-active)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl flex items-center gap-1.5 transition-all active-scale"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-col p-1.5 bg-[var(--bg-primary)] border border-[var(--border-primary)]/50 rounded-2xl gap-1">
          {SECTIONS.map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-between transition-all ${
                activeSection === sec
                  ? "bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-l-4 border-[var(--accent-green)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]/30 hover:text-[var(--text-primary)]"
              }`}
            >
              <span>{sec}</span>
              <ChevronRight size={12} className={activeSection === sec ? "text-[var(--accent-green)]" : "text-[var(--text-muted)]"} />
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="lg:col-span-3 min-h-[400px] bg-[var(--bg-primary)]/20 border border-[var(--border-primary)]/40 p-6 rounded-2xl">
          {/* GENERAL DETAILS */}
          {activeSection === "General Details" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>General Information & Organizer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Athlete / Patient</label>
                  <select
                    value={athleteId}
                    disabled={readOnly || !!idppId}
                    onChange={(e) => setAthleteId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">-- Select Athlete --</option>
                    {athletes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.first_name} {a.last_name} ({a.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Lead Advisor / Coach</label>
                  <input
                    type="text"
                    value={coachName}
                    readOnly={readOnly}
                    onChange={(e) => setCoachName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Assessment Date</label>
                  <input
                    type="date"
                    value={assessmentDate}
                    readOnly={readOnly}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Date of Birth</label>
                  <input
                    type="text"
                    placeholder="e.g. 15.08.2008"
                    value={dob}
                    readOnly={readOnly}
                    onChange={(e) => setDob(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Age Group</label>
                  <input
                    type="text"
                    placeholder="e.g. U17 Academy"
                    value={ageGroup}
                    readOnly={readOnly}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Position(s)</label>
                  <input
                    type="text"
                    placeholder="e.g. Central Midfielder"
                    value={positions}
                    readOnly={readOnly}
                    onChange={(e) => setPositions(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Club / School Team</label>
                  <input
                    type="text"
                    value={clubTeam}
                    readOnly={readOnly}
                    onChange={(e) => setClubTeam(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Parent / Guardian</label>
                  <input
                    type="text"
                    value={parentName}
                    readOnly={readOnly}
                    onChange={(e) => setParentName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Lead Academy Coach</label>
                  <input
                    type="text"
                    value={leadCoach}
                    readOnly={readOnly}
                    onChange={(e) => setLeadCoach(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Performance Coach</label>
                  <input
                    type="text"
                    value={performanceCoach}
                    readOnly={readOnly}
                    onChange={(e) => setPerformanceCoach(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Current Academy Tier</label>
                  <select
                    value={academyTier}
                    disabled={readOnly}
                    onChange={(e) => setAcademyTier(e.target.value)}
                    className={inputCls}
                  >
                    <option value="Emerging">Emerging</option>
                    <option value="Development">Development</option>
                    <option value="Performance">Performance</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Review Date</label>
                  <input
                    type="date"
                    value={reviewDate}
                    readOnly={readOnly}
                    onChange={(e) => setReviewDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Primary Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Elevate technical speed and recovery endurance..."
                  value={primaryGoal}
                  readOnly={readOnly}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* SECTION 1: Player Aspiration Profile */}
          {activeSection === "1. Player Aspiration Profile" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>1. Player Aspiration Profile</h3>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Long-Term Goal (3-5 Years)</label>
                  <textarea
                    rows={2}
                    value={longTermGoal}
                    readOnly={readOnly}
                    onChange={(e) => setLongTermGoal(e.target.value)}
                    className={inputCls + " resize-none"}
                  />
                </div>
                <div>
                  <label className={labelCls}>Seasonal Goal (12 Months)</label>
                  <textarea
                    rows={2}
                    value={seasonalGoal}
                    readOnly={readOnly}
                    onChange={(e) => setSeasonalGoal(e.target.value)}
                    className={inputCls + " resize-none"}
                  />
                </div>
                <div>
                  <label className={labelCls}>Main Position Ambition</label>
                  <input
                    type="text"
                    value={mainPositionAmbition}
                    readOnly={readOnly}
                    onChange={(e) => setMainPositionAmbition(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Player Strengths</label>
                    <textarea
                      rows={3}
                      value={playerStrengths}
                      readOnly={readOnly}
                      onChange={(e) => setPlayerStrengths(e.target.value)}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Player Challenges</label>
                    <textarea
                      rows={3}
                      value={playerChallenges}
                      readOnly={readOnly}
                      onChange={(e) => setPlayerChallenges(e.target.value)}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Current Development Focus Areas</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-primary)]/40 mt-1">
                    {["Technical", "Tactical", "Speed", "Strength", "Recovery", "Mental", "Leadership"].map((focus) => {
                      const isChecked = currentFocus.includes(focus);
                      return (
                        <label key={focus} className="flex items-center gap-2 text-xs text-[var(--text-primary)] font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={readOnly}
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setCurrentFocus(currentFocus.filter(f => f !== focus));
                              } else {
                                setCurrentFocus([...currentFocus, focus]);
                              }
                            }}
                            className="rounded accent-[var(--accent-green)] w-4 h-4 cursor-pointer"
                          />
                          {focus}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Comprehensive Assessment */}
          {activeSection === "2. Comprehensive Assessment" && (
            <div className="space-y-6">
              <div>
                <h3 className={sectionTitleCls}>2. a) Technical Profile Assessment</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-[var(--border-primary)]/50">
                    <thead>
                      <tr className="bg-[var(--bg-primary)] text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                        <th className="p-3 border border-[var(--border-primary)]/50">Technical Attribute</th>
                        <th className="p-3 border border-[var(--border-primary)]/50 text-center w-24">Score /10</th>
                        <th className="p-3 border border-[var(--border-primary)]/50 text-center w-24">Target /10</th>
                        <th className="p-3 border border-[var(--border-primary)]/50">Coach Notes</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-[var(--text-primary)]">
                      {technicalProfile.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-card-hover)]/20 transition-all font-semibold">
                          <td className="p-3 border border-[var(--border-primary)]/50 font-black">{row.rowName}</td>
                          <td className="p-2 border border-[var(--border-primary)]/50">
                            <input
                              type="number"
                              min={0} max={10}
                              value={row.score}
                              readOnly={readOnly}
                              onChange={(e) => {
                                const copy = [...technicalProfile];
                                copy[idx].score = e.target.value;
                                setTechnicalProfile(copy);
                              }}
                              className="w-full text-center text-xs font-bold p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)]"
                            />
                          </td>
                          <td className="p-2 border border-[var(--border-primary)]/50">
                            <input
                              type="number"
                              min={0} max={10}
                              value={row.target}
                              readOnly={readOnly}
                              onChange={(e) => {
                                const copy = [...technicalProfile];
                                copy[idx].target = e.target.value;
                                setTechnicalProfile(copy);
                              }}
                              className="w-full text-center text-xs font-bold p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)]"
                            />
                          </td>
                          <td className="p-2 border border-[var(--border-primary)]/50">
                            <input
                              type="text"
                              value={row.notes}
                              readOnly={readOnly}
                              onChange={(e) => {
                                const copy = [...technicalProfile];
                                copy[idx].notes = e.target.value;
                                setTechnicalProfile(copy);
                              }}
                              className="w-full text-xs p-1 bg-transparent text-[var(--text-primary)] focus:outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className={sectionTitleCls}>2. b) Tactical & Game Intelligence Profile</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-[var(--border-primary)]/50">
                    <thead>
                      <tr className="bg-[var(--bg-primary)] text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                        <th className="p-3 border border-[var(--border-primary)]/50">Tactical Attribute</th>
                        <th className="p-3 border border-[var(--border-primary)]/50 text-center w-24">Score /10</th>
                        <th className="p-3 border border-[var(--border-primary)]/50">Evidence Observed</th>
                        <th className="p-3 border border-[var(--border-primary)]/50 w-48">Development Priority</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-[var(--text-primary)]">
                      {tacticalProfile.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-card-hover)]/20 transition-all font-semibold">
                          <td className="p-3 border border-[var(--border-primary)]/50 font-black">{row.rowName}</td>
                          <td className="p-2 border border-[var(--border-primary)]/50">
                            <input
                              type="number"
                              min={0} max={10}
                              value={row.score}
                              readOnly={readOnly}
                              onChange={(e) => {
                                const copy = [...tacticalProfile];
                                copy[idx].score = e.target.value;
                                setTacticalProfile(copy);
                              }}
                              className="w-full text-center text-xs font-bold p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)]"
                            />
                          </td>
                          <td className="p-2 border border-[var(--border-primary)]/50">
                            <input
                              type="text"
                              value={row.evidence}
                              readOnly={readOnly}
                              onChange={(e) => {
                                const copy = [...tacticalProfile];
                                copy[idx].evidence = e.target.value;
                                setTacticalProfile(copy);
                              }}
                              className="w-full text-xs p-1 bg-transparent text-[var(--text-primary)] focus:outline-none"
                            />
                          </td>
                          <td className="p-2 border border-[var(--border-primary)]/50">
                            <input
                              type="text"
                              value={row.priority}
                              readOnly={readOnly}
                              onChange={(e) => {
                                const copy = [...tacticalProfile];
                                copy[idx].priority = e.target.value;
                                setTacticalProfile(copy);
                              }}
                              className="w-full text-xs p-1 bg-transparent text-[var(--text-primary)] focus:outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Physical Performance */}
          {activeSection === "3. Physical Performance" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>3. Physical Performance Profile Assessment</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[var(--border-primary)]/50">
                  <thead>
                    <tr className="bg-[var(--bg-primary)] text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                      <th className="p-3 border border-[var(--border-primary)]/50">Test Parameter</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-36">Result</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-36">Target</th>
                      <th className="p-3 border border-[var(--border-primary)]/50">Squad Rank / Comment</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[var(--text-primary)]">
                    {physicalProfile.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-card-hover)]/20 transition-all font-semibold">
                        <td className="p-3 border border-[var(--border-primary)]/50 font-black">{row.rowName}</td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.result}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...physicalProfile];
                              copy[idx].result = e.target.value;
                              setPhysicalProfile(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)]"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.target}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...physicalProfile];
                              copy[idx].target = e.target.value;
                              setPhysicalProfile(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)]"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.comment}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...physicalProfile];
                              copy[idx].comment = e.target.value;
                              setPhysicalProfile(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: GPS & Wearables */}
          {activeSection === "4. GPS & Wearables" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>4. GPS / Wearable Performance Metrics</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[var(--border-primary)]/50">
                  <thead>
                    <tr className="bg-[var(--bg-primary)] text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                      <th className="p-3 border border-[var(--border-primary)]/50">Telemetry Metric</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-36">Current</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-36">Target</th>
                      <th className="p-3 border border-[var(--border-primary)]/50">Notes / Comments</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[var(--text-primary)]">
                    {gpsData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-card-hover)]/20 transition-all font-semibold">
                        <td className="p-3 border border-[var(--border-primary)]/50 font-black">{row.rowName}</td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.current}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...gpsData];
                              copy[idx].current = e.target.value;
                              setGpsData(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)]"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.target}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...gpsData];
                              copy[idx].target = e.target.value;
                              setGpsData(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)]"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.notes}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...gpsData];
                              copy[idx].notes = e.target.value;
                              setGpsData(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 5: Mental Performance */}
          {activeSection === "5. Mental Performance" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>5. Mental & Psychological Profiling</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[var(--border-primary)]/50">
                  <thead>
                    <tr className="bg-[var(--bg-primary)] text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                      <th className="p-3 border border-[var(--border-primary)]/50">Psychological Trait</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 text-center w-24">Score /10</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-48">Intervention/Habit</th>
                      <th className="p-3 border border-[var(--border-primary)]/50">Coach Notes</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[var(--text-primary)]">
                    {mentalProfile.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-card-hover)]/20 transition-all font-semibold">
                        <td className="p-3 border border-[var(--border-primary)]/50 font-black">{row.rowName}</td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="number"
                            min={0} max={10}
                            value={row.score}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...mentalProfile];
                              copy[idx].score = e.target.value;
                              setMentalProfile(copy);
                            }}
                            className="w-full text-center text-xs font-bold p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)]"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.intervention}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...mentalProfile];
                              copy[idx].intervention = e.target.value;
                              setMentalProfile(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] font-bold text-[var(--accent-green)]"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.notes}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...mentalProfile];
                              copy[idx].notes = e.target.value;
                              setMentalProfile(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 6: Nutrition & Recovery */}
          {activeSection === "6. Nutrition & Recovery" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>6. Nutrition, Recovery & Lifestyle Quality</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[var(--border-primary)]/50">
                  <thead>
                    <tr className="bg-[var(--bg-primary)] text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                      <th className="p-3 border border-[var(--border-primary)]/50">Lifestyle Category</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 text-center w-24">Rating /10</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-48">Target Habit / Action</th>
                      <th className="p-3 border border-[var(--border-primary)]/50">Coach Notes</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[var(--text-primary)]">
                    {lifestyleProfile.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-card-hover)]/20 transition-all font-semibold">
                        <td className="p-3 border border-[var(--border-primary)]/50 font-black">{row.rowName}</td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="number"
                            min={0} max={10}
                            value={row.score}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...lifestyleProfile];
                              copy[idx].score = e.target.value;
                              setLifestyleProfile(copy);
                            }}
                            className="w-full text-center text-xs font-bold p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)]"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.targetHabit}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...lifestyleProfile];
                              copy[idx].targetHabit = e.target.value;
                              setLifestyleProfile(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)]"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.notes}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...lifestyleProfile];
                              copy[idx].notes = e.target.value;
                              setLifestyleProfile(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 7: Injury Risk Screening */}
          {activeSection === "7. Injury Risk Screening" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>7. Injury Risk Screening & Prevention</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[var(--border-primary)]/50">
                  <thead>
                    <tr className="bg-[var(--bg-primary)] text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                      <th className="p-3 border border-[var(--border-primary)]/50">Anatomical Region</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-36">Functional Status</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 text-center w-36">Risk Level</th>
                      <th className="p-3 border border-[var(--border-primary)]/50">Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[var(--text-primary)]">
                    {injuryRisk.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-card-hover)]/20 transition-all font-semibold">
                        <td className="p-3 border border-[var(--border-primary)]/50 font-black">{row.rowName}</td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.status}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...injuryRisk];
                              copy[idx].status = e.target.value;
                              setInjuryRisk(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <select
                            value={row.riskLevel}
                            disabled={readOnly}
                            onChange={(e) => {
                              const copy = [...injuryRisk];
                              copy[idx].riskLevel = e.target.value;
                              setInjuryRisk(copy);
                            }}
                            className="w-full bg-transparent border-b border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none font-bold"
                          >
                            <option value="Low" className="bg-[#111] text-emerald-400">Low</option>
                            <option value="Medium" className="bg-[#111] text-amber-500">Medium</option>
                            <option value="High" className="bg-[#111] text-red-500">High</option>
                          </select>
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.action}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...injuryRisk];
                              copy[idx].action = e.target.value;
                              setInjuryRisk(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 8: Development Priorities */}
          {activeSection === "8. Development Priorities" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>8. Strategic Development Priority Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[var(--border-primary)]/50">
                  <thead>
                    <tr className="bg-[var(--bg-primary)] text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                      <th className="p-3 border border-[var(--border-primary)]/50 text-center w-16">Rank</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-48">Priority Goal</th>
                      <th className="p-3 border border-[var(--border-primary)]/50">Weekly Actions</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-32">Timeline</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-44">Success Metric</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[var(--text-primary)]">
                    {priorityMatrix.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-[var(--bg-card-hover)]/20 transition-all font-semibold">
                        <td className="p-3 border border-[var(--border-primary)]/50 text-center font-black">#{row.id}</td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.goal}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...priorityMatrix];
                              copy[idx].goal = e.target.value;
                              setPriorityMatrix(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none font-bold"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.actions}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...priorityMatrix];
                              copy[idx].actions = e.target.value;
                              setPriorityMatrix(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.timeline}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...priorityMatrix];
                              copy[idx].timeline = e.target.value;
                              setPriorityMatrix(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.successMetric}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...priorityMatrix];
                              copy[idx].successMetric = e.target.value;
                              setPriorityMatrix(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 9: 90-Day Action Plan */}
          {activeSection === "9. 90-Day Action Plan" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>9. 90-Day Structural Action Plan</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[var(--border-primary)]/50">
                  <thead>
                    <tr className="bg-[var(--bg-primary)] text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                      <th className="p-3 border border-[var(--border-primary)]/50">Development Layer</th>
                      <th className="p-3 border border-[var(--border-primary)]/50">90-Day Goal</th>
                      <th className="p-3 border border-[var(--border-primary)]/50">Weekly Action</th>
                      <th className="p-3 border border-[var(--border-primary)]/50">Success Metric</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-32">Owner</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[var(--text-primary)]">
                    {actionPlan.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-card-hover)]/20 transition-all font-semibold">
                        <td className="p-3 border border-[var(--border-primary)]/50 font-black">{row.rowName}</td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.goal}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...actionPlan];
                              copy[idx].goal = e.target.value;
                              setActionPlan(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.weeklyAction}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...actionPlan];
                              copy[idx].weeklyAction = e.target.value;
                              setActionPlan(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.successMetric}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...actionPlan];
                              copy[idx].successMetric = e.target.value;
                              setActionPlan(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.owner}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...actionPlan];
                              copy[idx].owner = e.target.value;
                              setActionPlan(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 10: Training Prescription */}
          {activeSection === "10. Training Prescription" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>10. Weekly Training Prescription blueprint</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[var(--border-primary)]/50">
                  <thead>
                    <tr className="bg-[var(--bg-primary)] text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                      <th className="p-3 border border-[var(--border-primary)]/50">Training Modality</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 text-center w-28">Sessions / Week</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 w-48">Session Focus</th>
                      <th className="p-3 border border-[var(--border-primary)]/50">Coach Notes</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[var(--text-primary)]">
                    {trainingPrescription.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-card-hover)]/20 transition-all font-semibold">
                        <td className="p-3 border border-[var(--border-primary)]/50 font-black">{row.rowName}</td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.sessionsPerWeek}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...trainingPrescription];
                              copy[idx].sessionsPerWeek = e.target.value;
                              setTrainingPrescription(copy);
                            }}
                            className="w-full text-center text-xs font-bold p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.focus}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...trainingPrescription];
                              copy[idx].focus = e.target.value;
                              setTrainingPrescription(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent border-b border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                        <td className="p-2 border border-[var(--border-primary)]/50">
                          <input
                            type="text"
                            value={row.notes}
                            readOnly={readOnly}
                            onChange={(e) => {
                              const copy = [...trainingPrescription];
                              copy[idx].notes = e.target.value;
                              setTrainingPrescription(copy);
                            }}
                            className="w-full text-xs p-1 bg-transparent text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 11: Performance Dashboard */}
          {activeSection === "11. Performance Dashboard" && (
            <div className="space-y-6">
              <h3 className={sectionTitleCls}>11. Athlete Performance Dashboard Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4 bg-[var(--bg-primary)]/40 p-4 border border-[var(--border-primary)]/40 rounded-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Score Matrix (/20)</h4>
                  <div className="space-y-3">
                    {Object.keys(dashboardScores).map((key) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold capitalize text-[var(--text-secondary)]">{key}</span>
                        <input
                          type="number"
                          min={0} max={20}
                          value={dashboardScores[key as keyof typeof dashboardScores]}
                          readOnly={readOnly}
                          onChange={(e) => {
                            setDashboardScores({
                              ...dashboardScores,
                              [key]: e.target.value
                            });
                          }}
                          className="w-24 text-center text-xs font-black p-2 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-5 p-5 bg-[var(--accent-green)]/5 border border-[var(--accent-green)]/20 rounded-xl flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest block">Calculated Performance Index</span>
                    <span className="text-4xl font-mono font-black text-[var(--text-primary)] mt-1.5 block">
                      {dashboardCalculations.totalIndex} <span className="text-xs text-[var(--text-secondary)]">/ 100</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest block mb-2">Development Placement Tier</span>
                    <span className="inline-block px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-[var(--accent-green)] text-black shadow-lg shadow-[var(--accent-green)]/15">
                      {dashboardCalculations.calculatedTier}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weights Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[var(--border-primary)]/50">
                  <thead>
                    <tr className="bg-[var(--bg-primary)] text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                      <th className="p-3 border border-[var(--border-primary)]/50">Dimension</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 text-center w-32">Weight</th>
                      <th className="p-3 border border-[var(--border-primary)]/50 text-center w-36">Weighted Score</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[var(--text-primary)]">
                    <tr>
                      <td className="p-3 border border-[var(--border-primary)]/50 font-bold">Technical</td>
                      <td className="p-3 border border-[var(--border-primary)]/50 text-center font-bold text-[var(--text-secondary)]">25%</td>
                      <td className="p-3 border border-[var(--border-primary)]/50 text-center font-black">{dashboardCalculations.techWeighted}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-[var(--border-primary)]/50 font-bold">Tactical</td>
                      <td className="p-3 border border-[var(--border-primary)]/50 text-center font-bold text-[var(--text-secondary)]">20%</td>
                      <td className="p-3 border border-[var(--border-primary)]/50 text-center font-black">{dashboardCalculations.tactWeighted}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-[var(--border-primary)]/50 font-bold">Physical</td>
                      <td className="p-3 border border-[var(--border-primary)]/50 text-center font-bold text-[var(--text-secondary)]">25%</td>
                      <td className="p-3 border border-[var(--border-primary)]/50 text-center font-black">{dashboardCalculations.physWeighted}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-[var(--border-primary)]/50 font-bold">Mental</td>
                      <td className="p-3 border border-[var(--border-primary)]/50 text-center font-bold text-[var(--text-secondary)]">15%</td>
                      <td className="p-3 border border-[var(--border-primary)]/50 text-center font-black">{dashboardCalculations.mentWeighted}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-[var(--border-primary)]/50 font-bold">Lifestyle and recovery</td>
                      <td className="p-3 border border-[var(--border-primary)]/50 text-center font-bold text-[var(--text-secondary)]">15%</td>
                      <td className="p-3 border border-[var(--border-primary)]/50 text-center font-black">{dashboardCalculations.lifeWeighted}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 12: Coach Review */}
          {activeSection === "12. Coach Review" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>12. Coach Evaluation & Feedback Review</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Progress since last review</label>
                    <textarea
                      rows={3}
                      value={progressSinceLast}
                      readOnly={readOnly}
                      onChange={(e) => setProgressSinceLast(e.target.value)}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Improved areas</label>
                    <textarea
                      rows={3}
                      value={improvedAreas}
                      readOnly={readOnly}
                      onChange={(e) => setImprovedAreas(e.target.value)}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Areas still requiring focus</label>
                    <textarea
                      rows={3}
                      value={areasRequiringFocus}
                      readOnly={readOnly}
                      onChange={(e) => setAreasRequiringFocus(e.target.value)}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Coach recommendations</label>
                    <textarea
                      rows={3}
                      value={coachRecommendations}
                      readOnly={readOnly}
                      onChange={(e) => setCoachRecommendations(e.target.value)}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Athlete reflection / feedback</label>
                    <textarea
                      rows={3}
                      value={athleteReflection}
                      readOnly={readOnly}
                      onChange={(e) => setAthleteReflection(e.target.value)}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Parent / guardian notes</label>
                    <textarea
                      rows={3}
                      value={parentNotes}
                      readOnly={readOnly}
                      onChange={(e) => setParentNotes(e.target.value)}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 13: Commitment Agreement */}
          {activeSection === "13. Commitment Agreement" && (
            <div className="space-y-4">
              <h3 className={sectionTitleCls}>13. Athlete Commitment Sign-Off Block</h3>
              <p className="text-[11px] text-[var(--text-muted)] italic leading-relaxed">
                By entering names in the signature fields below, all parties confirm they have reviewed and agreed to execute the targets defined in this Individual Development blueprint.
              </p>
              <div className="space-y-3">
                {agreement.map((row, idx) => (
                  <div key={row.rowName} className="p-4 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)]/50 rounded-xl space-y-3">
                    <span className="text-[10px] font-black uppercase text-[var(--accent-green)] tracking-wider block">{row.rowName} Signoff</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={labelCls}>Signature (Typed / Drawn)</label>
                        <input
                          type="text"
                          value={row.signature}
                          readOnly={readOnly}
                          onChange={(e) => {
                            const copy = [...agreement];
                            copy[idx].signature = e.target.value;
                            setAgreement(copy);
                          }}
                          className={inputCls + " font-serif italic font-bold text-accent-green"}
                          placeholder="Type full name to sign"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Name</label>
                        <input
                          type="text"
                          value={row.name}
                          readOnly={readOnly}
                          onChange={(e) => {
                            const copy = [...agreement];
                            copy[idx].name = e.target.value;
                            setAgreement(copy);
                          }}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Date</label>
                        <input
                          type="date"
                          value={row.date}
                          readOnly={readOnly}
                          onChange={(e) => {
                            const copy = [...agreement];
                            copy[idx].date = e.target.value;
                            setAgreement(copy);
                          }}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-[var(--border-primary)]/40 pt-6">
        <div>
          {athleteId && (
            <button
              onClick={handleExportPDF}
              className="px-5 py-3.5 bg-zinc-800 text-white hover:bg-zinc-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 active-scale"
            >
              <Printer size={15} /> Export Blueprint PDF
            </button>
          )}
        </div>

        {!readOnly && (
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleSave("DRAFT")}
              className="flex-1 sm:flex-initial px-6 py-3.5 bg-zinc-800/80 border border-zinc-700/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 active-scale"
            >
              <Save size={15} /> Save Draft
            </button>
            <button
              onClick={() => handleSave("SUBMITTED")}
              className="flex-1 sm:flex-initial px-6 py-3.5 bg-[var(--accent-green)] text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[var(--accent-green)]/80 transition-all flex items-center justify-center gap-2 active-scale shadow-[0_0_20px_rgba(34,197,94,0.2)]"
            >
              <FileText size={15} /> Submit & Finalize
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
