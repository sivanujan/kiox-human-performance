"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, Save, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import BodyMap, { BodyMarker } from "./BodyMap";
import { useAuth } from "@/components/providers/AuthProvider";

interface FunctionalCheckupFormProps {
  checkupId?: string | null;
  onBack: () => void;
  onSaved: () => void;
  readOnly?: boolean;
}

const REGIONS_EN = [
  "1. Cervical Spine (Neck)",
  "2. Lumbar Spine (Lower Back)",
  "3. Pelvis & Hip",
  "4. Knee & Ankle",
  "5. Jaw, Breathing Mechanics & Thorax",
  "6. Visceral Check",
  "7. Isolated Strength Tests",
  "8. Gait Analysis & Drop Jump"
];

const REGIONS_DE = [
  "1. Halswirbelsäule (Nacken)",
  "2. Lendenwirbelsäule (Unterer Rücken)",
  "3. Becken & Hüfte",
  "4. Knie & Sprunggelenk",
  "5. Kiefer, Atemmechanik & Thorax",
  "6. Viszeraler Check",
  "7. Isolierte Krafttests",
  "8. Ganganalyse & Drop Jump"
];

const DEFAULT_REGIONS: Record<string, { test: string; procedure: string }[]> = {
  "1. Cervical Spine (Neck)": [
    { test: "Rotation 80/0/80", procedure: "Active movement in sitting position" },
    { test: "Lateral Flexion 45/0/45", procedure: "Active movement in sitting position" },
    { test: "Flexion/Extension 40/0/40", procedure: "Active movement in sitting position" }
  ],
  "2. Lumbar Spine (Lower Back)": [
    { test: "Forward Bend Test", procedure: "Standing forward bend, monitor pelvis & spine" }
  ],
  "3. Pelvis & Hip": [
    { test: "FABER-Test", procedure: "Flexion, Abduction, External Rotation" },
    { test: "Thomas-Test", procedure: "Evaluate hip flexion contracture/iliopsoas tightness" },
    { test: "Hip Mobility", procedure: "Internal/External rotation & abduction" },
    { test: "Standing Forward Flexion Test", procedure: "Standing spine flexion, palpate PSIS" },
    { test: "Sacrum Test", procedure: "Springing/provocation test on sacrum" }
  ],
  "4. Knee & Ankle": [
    { test: "Knee Mobility", procedure: "Flexion & extension mobility" },
    { test: "Deep Squat", procedure: "Deep squat assessment, heels on floor" },
    { test: "Dorsiflexion Test", procedure: "Weight-bearing lunge test" },
    { test: "Upper Ankle Joint (Talus/Fibula)", procedure: "Upper ankle joint translation & fibular head mobility" },
    { test: "Subtalar Joint (Navic./Cuboid/Calcaneus)", procedure: "Subtalar joint and midfoot mobility" }
  ],
  "5. Jaw, Breathing Mechanics & Thorax": [
    { test: "Jaw Opening", procedure: "3-finger test width for jaw opening" },
    { test: "Thorax Expansion", procedure: "Chest circumference change during deep breathing" },
    { test: "Diaphragm Activity", procedure: "Diaphragm excursions palpation" }
  ],
  "6. Visceral Check": [
    { test: "Upper Abdomen", procedure: "Palpation of liver, stomach, gallbladder area" },
    { test: "Lower Abdomen", procedure: "Palpation of intestines, cecum, sigmoid area" },
    { test: "Pelvis", procedure: "Urogenital system & pelvic floor visceral check" }
  ],
  "7. Isolated Strength Tests": [
    { test: "Supine (RL) muscle group tests", procedure: "Supine isolated muscle resistance" },
    { test: "Side-lying (SL) muscle group tests", procedure: "Side-lying isolated muscle resistance" },
    { test: "Prone (BL) muscle group tests", procedure: "Prone isolated muscle resistance" }
  ],
  "8. Gait Analysis & Drop Jump": [
    { test: "Single Leg Stand 30sec", procedure: "Balance & stability check on left/right leg" }
  ]
};

// Translating regions when rendering
const getDisplayRegionName = (engRegion: string, lang: "EN" | "DE") => {
  if (lang === "EN") return engRegion;
  const idx = REGIONS_EN.indexOf(engRegion);
  return idx !== -1 ? REGIONS_DE[idx] : engRegion;
};

const t = {
  EN: {
    titleView: "Functional Check-Up (View)",
    titleEdit: "Functional Check-Up (Edit)",
    titleCreate: "Create New Assessment Form",
    subtitleCreate: "Digital Form • KIO-X Clinical",
    syncText: "Assessment form is syncing...",
    exportPdf: "PDF Export",
    saveDraft: "Save Draft",
    submitFinalize: "Submit & Finalize",
    demographicsTitle: "Demographics & Anamnesis",
    athleteLabel: "Athlete / Patient",
    selectAthlete: "-- Select Athlete --",
    loadingAthlete: "Loading athlete...",
    therapistLabel: "Therapist / Osteopath",
    therapistPlaceholder: "Therapist Name",
    dateLabel: "Date",
    painLabel: "Current Pain (Location, When, Since when)",
    painPlaceholder: "e.g., Pulling pain in the lower back during rotation, for about 2 weeks...",
    restrictionLabel: "Current Movement Restrictions",
    restrictionPlaceholder: "e.g., Reduced bilateral hip joint flexion...",
    injuriesLabel: "Previous Injuries / Operations",
    injuriesPlaceholder: "e.g., Ankle ligament tear left (2024)...",
    allergiesLabel: "Food Allergies / Intolerances",
    allergiesPlaceholder: "e.g., Gluten intolerance, pollen allergy...",
    testsTitle: "Clinical Tests & Findings by Region",
    findingsSuffix: "finding(s)",
    tableTest: "Test",
    tableProcedure: "Procedure",
    tableResult: "Result",
    tableNotes: "Notes",
    tableAction: "Action",
    placeholderTest: "Test name...",
    placeholderProcedure: "Procedure...",
    placeholderNotes: "No findings / OK",
    customResultPlaceholder: "Custom Result...",
    addRowBtn: "Add Row",
    summaryTitle: "Summary & Therapy Planning",
    summaryLabel: "Summary",
    summaryPlaceholder: "• Cervical block cleared\n• M. iliopsoas trigger point release performed...",
    recommendationsLabel: "Training Recommendations",
    recommendationsPlaceholder: "• Daily stretching of hip flexors\n• Eccentric calf training bilaterally...",
    bodyMapTitle: "Body Map (Problem Zones)",
    selectAthleteAlert: "Please select an athlete.",
    successSubmit: "Assessment submitted successfully!",
    successDraft: "Assessment saved as draft.",
    errorSave: "Error saving: ",
    errorLoad: "Error loading functional assessment form: "
  },
  DE: {
    titleView: "Funktioneller Check-Up (Ansehen)",
    titleEdit: "Funktioneller Check-Up (Bearbeiten)",
    titleCreate: "Neue Bewertung erstellen",
    subtitleCreate: "Digitales Formular • KIO-X Klinik",
    syncText: "Formular wird synchronisiert...",
    exportPdf: "PDF Export",
    saveDraft: "Entwurf speichern",
    submitFinalize: "Finalisieren & Senden",
    demographicsTitle: "Demographie & Anamnese",
    athleteLabel: "Athlet / Patient",
    selectAthlete: "-- Athlet auswählen --",
    loadingAthlete: "Athlet wird geladen...",
    therapistLabel: "Therapeut / Osteopath",
    therapistPlaceholder: "Name des Therapeuten",
    dateLabel: "Datum",
    painLabel: "Aktuelle Schmerzen (Ort, Wann, Seit wann)",
    painPlaceholder: "z.B. Ziehender Schmerz im unteren Rücken bei Rotation, seit ca. 2 Wochen...",
    restrictionLabel: "Aktuelle Bewegungseinschränkungen",
    restrictionPlaceholder: "z.B. Eingeschränkte Beugung beider Hüftgelenke...",
    injuriesLabel: "Vorherige Verletzungen / Operationen",
    injuriesPlaceholder: "z.B. Bänderriss Sprunggelenk links (2024)...",
    allergiesLabel: "Nahrungsmittelallergien / Unverträglichkeiten",
    allergiesPlaceholder: "z.B. Glutenunverträglichkeit, Pollenallergie...",
    testsTitle: "Klinische Tests & Befunde nach Region",
    findingsSuffix: "Befund(e)",
    tableTest: "Test",
    tableProcedure: "Verfahren",
    tableResult: "Ergebnis",
    tableNotes: "Notizen",
    tableAction: "Aktion",
    placeholderTest: "Testname...",
    placeholderProcedure: "Verfahren...",
    placeholderNotes: "Keine Befunde / OK",
    customResultPlaceholder: "Anderes Ergebnis...",
    addRowBtn: "Zeile hinzufügen",
    summaryTitle: "Zusammenfassung & Therapieplanung",
    summaryLabel: "Zusammenfassung",
    summaryPlaceholder: "• Zervikale Blockade gelöst\n• M. iliopsoas Triggerpunkt-Release durchgeführt...",
    recommendationsLabel: "Trainingsempfehlungen",
    recommendationsPlaceholder: "• Tägliches Dehnen der Hüftbeuger\n• Beidseitiges exzentrisches Wadenkrafttraining...",
    bodyMapTitle: "Körperkarte (Problemzonen)",
    selectAthleteAlert: "Bitte wählen Sie einen Athleten aus.",
    successSubmit: "Bewertung erfolgreich übermittelt!",
    successDraft: "Bewertung als Entwurf gespeichert.",
    errorSave: "Fehler beim Speichern: ",
    errorLoad: "Fehler beim Laden des Formulars: "
  }
};

export default function FunctionalCheckupForm({
  checkupId = null,
  onBack,
  onSaved,
  readOnly = false
}: FunctionalCheckupFormProps) {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>("1. Cervical Spine (Neck)");
  const [lang, setLang] = useState<"EN" | "DE">("EN");

  // Form Fields
  const [athleteId, setAthleteId] = useState("");
  const [therapistName, setTherapistName] = useState(
    profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : ""
  );
  const [checkupDate, setCheckupDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentPain, setCurrentPain] = useState("");
  const [movementRestrictions, setMovementRestrictions] = useState("");
  const [previousInjuries, setPreviousInjuries] = useState("");
  const [foodAllergies, setFoodAllergies] = useState("");
  const [bodyMapMarkers, setBodyMapMarkers] = useState<BodyMarker[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any[]>>({});
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED">("DRAFT");

  // Load Athletes & Checkup Data
  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const res = await fetch("/api/admin/athletes");
        const data = await res.json();
        if (!data.error) {
          setAthletes(data);
        }
      } catch (err) {
        console.error("Failed to load athletes list:", err);
      }
    };

    fetchAthletes();
  }, []);

  useEffect(() => {
    if (checkupId) {
      loadCheckupData(checkupId);
    } else {
      const initialResults: Record<string, any[]> = {};
      Object.keys(DEFAULT_REGIONS).forEach((region) => {
        initialResults[region] = DEFAULT_REGIONS[region].map((t) => ({
          test: t.test,
          procedure: t.procedure,
          result: "OK",
          resultCustom: "",
          notes: ""
        }));
      });
      setTestResults(initialResults);
    }
  }, [checkupId]);

  const loadCheckupData = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/checkup?id=${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch checkup details.");
      }

      if (data) {
        setAthleteId(data.athlete_id);
        setTherapistName(data.therapist_name);
        setCheckupDate(data.checkup_date);
        setCurrentPain(data.current_pain || "");
        setMovementRestrictions(data.movement_restrictions || "");
        setPreviousInjuries(data.previous_injuries || "");
        setFoodAllergies(data.food_allergies || "");
        setBodyMapMarkers(data.body_map_markers || []);
        setTestResults(data.test_results || {});
        setSummary(data.summary || "");
        setRecommendations(data.recommendations || "");
        setStatus(data.status);
      }
    } catch (err: any) {
      console.error("Error loading checkup:", err);
      alert(`${t[lang].errorLoad}${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestChange = (region: string, index: number, field: string, value: any) => {
    const regionTests = [...(testResults[region] || [])];
    regionTests[index] = { ...regionTests[index], [field]: value };
    setTestResults({ ...testResults, [region]: regionTests });
  };

  const addCustomRow = (region: string) => {
    const regionTests = [...(testResults[region] || [])];
    regionTests.push({
      test: "",
      procedure: "Custom test",
      result: "OK",
      resultCustom: "",
      notes: "",
      isCustom: true
    });
    setTestResults({ ...testResults, [region]: regionTests });
  };

  const removeCustomRow = (region: string, index: number) => {
    const regionTests = [...(testResults[region] || [])];
    regionTests.splice(index, 1);
    setTestResults({ ...testResults, [region]: regionTests });
  };

  const handleSave = async (submitStatus: "DRAFT" | "SUBMITTED") => {
    if (!athleteId) {
      alert(t[lang].selectAthleteAlert);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        athlete_id: athleteId,
        therapist_name: therapistName,
        checkup_date: checkupDate,
        current_pain: currentPain,
        movement_restrictions: movementRestrictions,
        previous_injuries: previousInjuries,
        food_allergies: foodAllergies,
        body_map_markers: bodyMapMarkers,
        test_results: testResults,
        summary: summary,
        recommendations: recommendations,
        status: submitStatus,
        updated_at: new Date().toISOString()
      };

      let response;
      if (checkupId) {
        response = await fetch("/api/admin/checkup", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: checkupId,
            ...payload,
          }),
        });
      } else {
        response = await fetch("/api/admin/checkup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...payload,
            created_by: user?.id || null,
          }),
        });
      }

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save assessment form.");
      }

      alert(submitStatus === "SUBMITTED" ? t[lang].successSubmit : t[lang].successDraft);
      onSaved();
    } catch (err: any) {
      console.error("Save checkup error:", err);
      alert(`${t[lang].errorSave}${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const athlete = athletes.find((a) => a.id === athleteId);
    const athleteName = athlete ? `${athlete.first_name} ${athlete.last_name}` : "Unknown";
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const renderSvgString = (side: "front" | "back") => {
      const sideMarkers = bodyMapMarkers.filter((m) => m.side === side);
      const pinsHtml = sideMarkers
        .map((m) => {
          const globalIdx = bodyMapMarkers.findIndex((gm) => gm.id === m.id) + 1;
          const severityColor = 
            m.severity === "severe" 
              ? "#ef4444" 
              : m.severity === "mild" 
              ? "#eab308" 
              : "#f97316";

          return `
            <g>
              <circle cx="${m.x}" cy="${m.y}" r="6" fill="${severityColor}" stroke="#ffffff" stroke-width="1.2" />
              <text x="${m.x}" y="${m.y + 2.2}" text-anchor="middle" font-size="7" font-weight="900" fill="#ffffff" font-family="sans-serif">${globalIdx}</text>
            </g>
          `;
        })
        .join("");

      return `
        <svg viewBox="0 0 100 220" style="width: 110px; height: auto; padding: 4px; background: #ffffff;">
          <path d="M 50 15 C 42 15, 38 21, 38 28 C 38 35, 42 41, 50 41 C 58 41, 62 35, 62 28 C 62 21, 58 15, 50 15 Z M 45 41 L 55 41 L 55 48 L 45 48 Z M 45 48 C 33 49, 30 55, 27 63 L 14 105 C 12 110, 16 114, 20 110 L 28 80 L 28 125 C 28 127, 29 129, 31 129 C 33 129, 34 127, 34 125 L 34 70 L 37 70 L 37 135 L 63 135 L 63 70 L 66 70 L 66 125 C 66 127, 67 129, 69 129 C 71 129, 72 127, 72 125 L 72 80 L 80 110 C 84 114, 88 110, 86 105 L 73 63 C 70 55, 67 49, 55 48 Z M 37 135 L 63 135 L 60 155 L 40 155 Z M 40 155 L 35 200 L 38 245 C 38 249, 43 249, 44 245 L 49 200 L 49 155 Z M 60 155 L 65 200 L 62 245 C 62 249, 57 249, 56 245 L 51 200 L 51 155 Z" 
                fill="#f1f5f9" stroke="#18181b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M 36 72 Q 50 78 64 72" fill="none" stroke="#cbd5e1" stroke-width="0.8" opacity="0.5" />
          <path d="M 40 100 H 60" fill="none" stroke="#cbd5e1" stroke-width="0.8" opacity="0.4" />
          <circle cx="28" cy="80" r="2.2" fill="none" stroke="#cbd5e1" stroke-width="0.8" opacity="0.5" />
          <circle cx="72" cy="80" r="2.2" fill="none" stroke="#cbd5e1" stroke-width="0.8" opacity="0.5" />
          <circle cx="44" cy="200" r="3" fill="none" stroke="#cbd5e1" stroke-width="0.8" opacity="0.5" />
          <circle cx="56" cy="200" r="3" fill="none" stroke="#cbd5e1" stroke-width="0.8" opacity="0.5" />
          ${pinsHtml}
        </svg>
      `;
    };

    const frontSvg = renderSvgString("front");
    const backSvg = renderSvgString("back");

    const getRegionIconSvg = (region: string) => {
      if (region.includes("Cervical") || region.includes("Neck") || region.includes("Halswirbel")) {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H7M18 9H6M17 13H7M18 17H6"/></svg>`;
      }
      if (region.includes("Lumbar") || region.includes("Back") || region.includes("Lendenwirbel")) {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M19 6H5M17 11H7M18 16H6M19 21H5"/></svg>`;
      }
      if (region.includes("Pelvis") || region.includes("Hip") || region.includes("Becken")) {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="10" ry="5"/><path d="M6 12c0 2 3 3 6 3s6-1 6-3"/></svg>`;
      }
      if (region.includes("Knee") || region.includes("Ankle") || region.includes("Knie")) {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18h14M8 6h7M8 12h7"/></svg>`;
      }
      if (region.includes("Jaw") || region.includes("Thorax") || region.includes("Kiefer")) {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 2v20M2 12h20"/></svg>`;
      }
      if (region.includes("Visceral")) {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
      }
      if (region.includes("Strength") || region.includes("Kraft")) {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4H6v16h12V4ZM3 8h3v8H3v-8ZM18 8h3v8h-3v-8Z"/></svg>`;
      }
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
    };

    let testResultsHtml = "";
    Object.keys(testResults).forEach((region) => {
      const tests = testResults[region] || [];
      if (tests.length === 0) return;

      const regionIcon = getRegionIconSvg(region);
      const displayRegion = getDisplayRegionName(region, lang);

      testResultsHtml += `
        <div class="avoid-break" style="margin-top: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <h3 style="font-size: 13px; font-weight: 800; display: flex; align-items: center; gap: 8px; color: #0f172a; margin-bottom: 12px;">
            <span style="color: #22c55e; display: flex; align-items: center;">${regionIcon}</span>
            <span>${displayRegion}</span>
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff; text-align: left; border-bottom: 2px solid #22c55e;">
                <th style="padding: 10px 12px; font-family: 'Outfit', sans-serif; font-weight: 800; border-top-left-radius: 8px; border-bottom-left-radius: 8px; width: 30%;">${t[lang].tableTest}</th>
                <th style="padding: 10px 12px; font-family: 'Outfit', sans-serif; font-weight: 800; width: 30%;">${t[lang].tableProcedure}</th>
                <th style="padding: 10px 12px; font-family: 'Outfit', sans-serif; font-weight: 800; width: 15%;">${t[lang].tableResult}</th>
                <th style="padding: 10px 12px; font-family: 'Outfit', sans-serif; font-weight: 800; border-top-right-radius: 8px; border-bottom-right-radius: 8px; width: 25%;">${t[lang].tableNotes}</th>
              </tr>
            </thead>
            <tbody>
              ${tests
                .map((tItem, index) => {
                  const finalResult = tItem.result === "Custom" ? tItem.resultCustom : tItem.result;
                  const isRestricted = finalResult === "Restricted" || finalResult === "Eingeschränkt";
                  
                  let badgeHtml = "";
                  if (finalResult === "OK") {
                    badgeHtml = `<span style="background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase;">OK</span>`;
                  } else if (isRestricted) {
                    badgeHtml = `<span style="background-color: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase;">Restricted</span>`;
                  } else {
                    badgeHtml = `<span style="background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase;">${finalResult || 'Custom'}</span>`;
                  }

                  const rowBg = index % 2 === 0 ? "#ffffff" : "#f8fafc";
                  const rowBorder = isRestricted ? "border-left: 3px solid #f97316;" : "";
                  const rowStyle = isRestricted ? 'style="background-color: #fffaf8;"' : `style="background-color: ${rowBg};"`;

                  return `
                  <tr ${rowStyle}>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 700; ${rowBorder}">${tItem.test || "Custom Test"}</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #475569;">${tItem.procedure || "-"}</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">${badgeHtml}</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #475569; font-weight: 500;">${tItem.notes || "-"}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    });

    const markersListHtml = bodyMapMarkers
      .map((m, idx) => {
        const severityColor = 
          m.severity === "severe" 
            ? "#ef4444" 
            : m.severity === "mild" 
            ? "#eab308" 
            : "#f97316";
        
        const severityBg = 
          m.severity === "severe" 
            ? "#fee2e2" 
            : m.severity === "mild" 
            ? "#fef08a" 
            : "#ffedd5";

        const severityText = 
          m.severity === "severe" 
            ? "#991b1b" 
            : m.severity === "mild" 
            ? "#854d0e" 
            : "#9a3412";

        return `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 10px;">
            <span style="background-color: ${severityColor}; color: white; width: 18px; height: 18px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; font-family: 'Outfit', sans-serif; shrink-0; margin-top: 1px;">
              ${idx + 1}
            </span>
            <div style="flex-grow: 1;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                <span style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">${m.side === "front" ? "Front" : "Back"}</span>
                <span style="background-color: ${severityBg}; color: ${severityText}; font-size: 8px; font-weight: 800; text-transform: uppercase; padding: 0.5px 5px; border-radius: 4px;">${m.severity || 'moderate'}</span>
              </div>
              <p style="margin: 0; font-size: 10px; color: #334155; line-height: 1.4; font-weight: 500;">${m.note}</p>
            </div>
          </div>
        `;
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>KIO-X Functional Assessment - ${athleteName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <script>
            function downloadPDF() {
              const element = document.body;
              const controls = document.querySelector('.no-print');
              if (controls) controls.style.display = 'none';
              
              const opt = {
                margin:       [12, 12, 12, 12],
                filename:     'KIO-X_Assessment_${athleteName.replace(/\s+/g, '_')}.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };
              
              html2pdf().set(opt).from(element).save().then(() => {
                if (controls) controls.style.display = 'flex';
              }).catch(function(err) {
                console.error(err);
                if (controls) controls.style.display = 'flex';
              });
            }
          </script>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; background: #f8fafc; padding: 20px; }
            h1, h2, h3, th { font-family: 'Outfit', sans-serif; }
            .avoid-break { page-break-inside: avoid; break-inside: avoid; }
            .page-footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="no-print" style="display: flex; justify-content: space-between; margin-bottom: 20px; background: #0f172a; padding: 12px 20px; border-radius: 12px; align-items: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <span style="color: #ffffff; font-size: 11px; font-weight: 800; font-family: 'Outfit', sans-serif; letter-spacing: 1px; text-transform: uppercase;">Assessment Report Ready</span>
            <button onclick="downloadPDF()" style="background-color: #22c55e; color: #000000; border: none; padding: 8px 16px; border-radius: 8px; font-size: 11px; font-weight: 900; font-family: 'Outfit', sans-serif; text-transform: uppercase; cursor: pointer; letter-spacing: 0.5px; transition: opacity 0.2s;">
              Download PDF Report
            </button>
          </div>

          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #22c55e; padding-bottom: 12px; margin-bottom: 24px;">
            <div>
              <div style="font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 900; letter-spacing: 2px; color: #0f172a;">KIO-<span style="color: #22c55e;">X</span> PERFORMANCE</div>
              <div style="font-size: 9px; font-weight: 800; color: #22c55e; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px;">Clinical & Osteopathic Assessment</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Therapy Protocol</div>
              <div style="font-size: 22px; font-weight: 900; font-family: 'Outfit', sans-serif; color: #0f172a; line-height: 1; margin-top: 2px;">REPORT</div>
            </div>
          </div>

          <!-- Demographics Block -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <div>
              <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Athlete/Patient</span>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 800; color: #0f172a;">${athleteName}</p>
            </div>
            <div>
              <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Therapist</span>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; color: #0f172a;">${therapistName}</p>
            </div>
            <div>
              <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Date</span>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; color: #0f172a;">${checkupDate}</p>
            </div>
          </div>

          <!-- Anamnesis / History -->
          <div style="margin-top: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Current Pain & Complaints</span>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #334155; line-height: 1.5; font-weight: 500;">${currentPain || "None reported."}</p>
            </div>
            <div>
              <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Movement Restrictions</span>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #334155; line-height: 1.5; font-weight: 500;">${movementRestrictions || "None reported."}</p>
            </div>
            <div style="border-top: 1px solid #f1f5f9; padding-top: 10px; margin-top: 4px;">
              <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Previous Injuries & Ops</span>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #334155; line-height: 1.5; font-weight: 500;">${previousInjuries || "None reported."}</p>
            </div>
            <div style="border-top: 1px solid #f1f5f9; padding-top: 10px; margin-top: 4px;">
              <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Allergies & Intolerances</span>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #334155; line-height: 1.5; font-weight: 500;">${foodAllergies || "None reported."}</p>
            </div>
          </div>

          <!-- Body Map & Markers -->
          <div class="avoid-break" style="margin-top: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <h3 style="font-size: 13px; font-weight: 800; display: flex; align-items: center; gap: 8px; color: #0f172a; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
              <span>Pain & Injury Mapping</span>
            </h3>
            <div style="display: flex; gap: 30px; justify-content: center; align-items: flex-start; flex-wrap: wrap;">
              <div style="display: flex; flex-direction: column; align-items: center;">
                <span style="font-size: 9px; font-weight: 800; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Anterior View</span>
                ${frontSvg}
              </div>
              <div style="display: flex; flex-direction: column; align-items: center;">
                <span style="font-size: 9px; font-weight: 800; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Posterior View</span>
                ${backSvg}
              </div>
              <div style="flex-grow: 1; min-width: 250px; max-width: 400px; padding-top: 15px;">
                <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 10px;">Identified Zones Checklist</span>
                ${markersListHtml || `<div style="font-size: 11px; color: #64748b; font-style: italic; text-align: center; padding: 20px;">No markers plotted on body map.</div>`}
              </div>
            </div>
          </div>

          <!-- Regional Findings list -->
          ${testResultsHtml}

          <!-- Summary & Planning -->
          <div class="avoid-break" style="margin-top: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Clinical Summary</span>
              <pre style="margin: 6px 0 0 0; font-size: 10px; color: #334155; line-height: 1.6; font-family: monospace; font-weight: 600; white-space: pre-wrap;">${summary || "No notes documented."}</pre>
            </div>
            <div>
              <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Therapy & Training Recommendations</span>
              <pre style="margin: 6px 0 0 0; font-size: 10px; color: #334155; line-height: 1.6; font-family: monospace; font-weight: 600; white-space: pre-wrap;">${recommendations || "No notes documented."}</pre>
            </div>
          </div>

          <!-- Signature box -->
          <div class="avoid-break" style="margin-top: 40px; display: flex; justify-content: flex-end;">
            <div style="width: 220px; border-top: 2px solid #0f172a; text-align: center; padding-top: 8px; font-family: 'Outfit', sans-serif; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">
              Athlete/Patient Initials
            </div>
          </div>

          <!-- Document Footer -->
          <div class="page-footer">
            <span style="font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">KIO-X Performance Center | Confidential Report</span>
            <span style="font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Generated on ${new Date().toLocaleDateString("en-US")}</span>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-primary)] pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 border border-[var(--border-primary)] rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors active-scale"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-[var(--text-primary)] uppercase tracking-wider">
              {checkupId 
                ? (readOnly ? t[lang].titleView : t[lang].titleEdit) 
                : t[lang].titleCreate}
            </h2>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 uppercase tracking-widest">
              {checkupId ? `Check-Up ID: ${checkupId.substring(0, 8)}...` : t[lang].subtitleCreate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center gap-2 bg-black/40 border-2 border-accent-green/30 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <span className="text-[9px] font-black text-accent-green uppercase tracking-wider select-none">
              {lang === "EN" ? "Language:" : "Sprache:"}
            </span>
            <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setLang("EN")}
                className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest transition-all ${
                  lang === "EN" 
                    ? "bg-accent-green text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                    : "text-gray-400 hover:text-white"
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
                    : "text-gray-400 hover:text-white"
                }`}
              >
                DE
              </button>
            </div>
          </div>

          {checkupId && (
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 border border-[var(--border-primary)] hover:border-[var(--accent-green)]/30 hover:bg-[var(--accent-green)]/5 text-xs text-[var(--text-primary)] rounded-xl font-bold flex items-center gap-2 transition-all active-scale"
            >
              <FileText size={14} className="text-[var(--accent-green)]" />
              {t[lang].exportPdf}
            </button>
          )}

          {!readOnly && (
            <>
              {status !== "SUBMITTED" && (
                <button
                  onClick={() => handleSave("DRAFT")}
                  disabled={loading}
                  className="px-4 py-2 border border-[var(--border-primary)] hover:bg-[var(--bg-card-hover)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl font-bold flex items-center gap-2 transition-all active-scale"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {t[lang].saveDraft}
                </button>
              )}
              <button
                onClick={() => handleSave("SUBMITTED")}
                disabled={loading}
                className="px-4 py-2 bg-[var(--accent-green)] text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[var(--accent-green)]/80 transition-all flex items-center gap-2 active-scale shadow-[0_0_15px_rgba(34,197,94,0.15)]"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                {t[lang].submitFinalize}
              </button>
            </>
          )}
        </div>
      </div>

      {loading && !checkupId ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-[var(--accent-green)]" size={32} />
          <span className="text-xs text-[var(--text-secondary)] uppercase tracking-widest animate-pulse">
            {t[lang].syncText}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Form Left/Main Block */}
          <div className="xl:col-span-2 space-y-6">
            {/* Header Details Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 md:p-6 space-y-4">
              <div className="text-xs font-bold text-[var(--text-primary)] tracking-wider uppercase border-b border-[var(--border-primary)] pb-2.5">
                {t[lang].demographicsTitle}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t[lang].athleteLabel}
                  </label>
                  {readOnly ? (
                    <div className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl font-bold text-[var(--text-primary)]">
                      {athletes.find((a) => a.id === athleteId)
                        ? `${athletes.find((a) => a.id === athleteId).first_name} ${
                            athletes.find((a) => a.id === athleteId).last_name
                          }`
                        : t[lang].loadingAthlete}
                    </div>
                  ) : (
                    <select
                      value={athleteId}
                      onChange={(e) => setAthleteId(e.target.value)}
                      className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] font-bold cursor-pointer"
                    >
                      <option value="">{t[lang].selectAthlete}</option>
                      {athletes.map((ath) => (
                        <option key={ath.id} value={ath.id}>
                          {ath.first_name} {ath.last_name} ({ath.username})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t[lang].therapistLabel}
                  </label>
                  <input
                    type="text"
                    value={therapistName}
                    onChange={(e) => setTherapistName(e.target.value)}
                    disabled={readOnly}
                    placeholder={t[lang].therapistPlaceholder}
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] font-semibold disabled:opacity-75"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t[lang].dateLabel}
                  </label>
                  <input
                    type="date"
                    value={checkupDate}
                    onChange={(e) => setCheckupDate(e.target.value)}
                    disabled={readOnly}
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] font-semibold cursor-pointer disabled:opacity-75"
                  />
                </div>
              </div>

              {/* Patient details textareas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t[lang].painLabel}
                  </label>
                  <textarea
                    value={currentPain}
                    onChange={(e) => setCurrentPain(e.target.value)}
                    disabled={readOnly}
                    placeholder={t[lang].painPlaceholder}
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-20 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t[lang].restrictionLabel}
                  </label>
                  <textarea
                    value={movementRestrictions}
                    onChange={(e) => setMovementRestrictions(e.target.value)}
                    disabled={readOnly}
                    placeholder={t[lang].restrictionPlaceholder}
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-20 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t[lang].injuriesLabel}
                  </label>
                  <textarea
                    value={previousInjuries}
                    onChange={(e) => setPreviousInjuries(e.target.value)}
                    disabled={readOnly}
                    placeholder={t[lang].injuriesPlaceholder}
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-20 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t[lang].allergiesLabel}
                  </label>
                  <textarea
                    value={foodAllergies}
                    onChange={(e) => setFoodAllergies(e.target.value)}
                    disabled={readOnly}
                    placeholder={t[lang].allergiesPlaceholder}
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Test Tables Region Card (Accordion) */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 md:p-6 space-y-4">
              <div className="text-xs font-bold text-[var(--text-primary)] tracking-wider uppercase border-b border-[var(--border-primary)] pb-2.5">
                {t[lang].testsTitle}
              </div>

              <div className="space-y-3">
                {Object.keys(DEFAULT_REGIONS).map((region) => {
                  const isExpanded = activeSection === region;
                  const tests = testResults[region] || [];
                  const restrictedCount = tests.filter(
                    (tItem) => tItem.result === "Restricted" || tItem.result === "Eingeschränkt" || (tItem.result === "Custom" && tItem.resultCustom)
                  ).length;
                  const displayRegionName = getDisplayRegionName(region, lang);

                  return (
                    <div
                      key={region}
                      className={`border border-[var(--border-primary)] rounded-xl overflow-hidden transition-all ${
                        isExpanded ? "ring-1 ring-[var(--accent-green)]/30" : ""
                      }`}
                    >
                      {/* Accordion Trigger */}
                      <button
                        type="button"
                        onClick={() => setActiveSection(isExpanded ? null : region)}
                        className="w-full px-4 py-3.5 bg-[var(--bg-primary)]/30 hover:bg-[var(--bg-primary)]/60 flex items-center justify-between text-xs font-bold transition-all text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={isExpanded ? "text-[var(--accent-green)]" : "text-[var(--text-primary)]"}>
                            {displayRegionName}
                          </span>
                          {restrictedCount > 0 && (
                            <span className="px-2 py-0.5 text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-full">
                              {restrictedCount} {t[lang].findingsSuffix}
                            </span>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-4 bg-[var(--bg-primary)]/10 border-t border-[var(--border-primary)] overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                              <tr className="border-b border-[var(--border-primary)] text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                <th className="pb-2.5 width-[25%]">{t[lang].tableTest}</th>
                                <th className="pb-2.5 width-[30%]">{t[lang].tableProcedure}</th>
                                <th className="pb-2.5 width-[20%]">{t[lang].tableResult}</th>
                                <th className="pb-2.5 width-[20%]">{t[lang].tableNotes}</th>
                                {!readOnly && <th className="pb-2.5 w-[5%] text-right">{t[lang].tableAction}</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-primary)]/50">
                              {tests.map((testItem, idx) => {
                                return (
                                  <tr key={idx} className="text-xs group hover:bg-[var(--bg-primary)]/30 transition-all">
                                    {/* Test Name */}
                                    <td className="py-3 pr-4 font-semibold text-[var(--text-primary)]">
                                      {testItem.isCustom && !readOnly ? (
                                        <input
                                          type="text"
                                          value={testItem.test}
                                          onChange={(e) => handleTestChange(region, idx, "test", e.target.value)}
                                          placeholder={t[lang].placeholderTest}
                                          className="p-2 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-lg text-xs w-full focus:outline-none focus:border-[var(--accent-green)] text-[var(--text-primary)] font-semibold"
                                        />
                                      ) : (
                                        testItem.test || "Custom Test"
                                      )}
                                    </td>

                                    {/* Procedure */}
                                    <td className="py-3 pr-4 text-[var(--text-secondary)]">
                                      {testItem.isCustom && !readOnly ? (
                                        <input
                                          type="text"
                                          value={testItem.procedure}
                                          onChange={(e) => handleTestChange(region, idx, "procedure", e.target.value)}
                                          placeholder={t[lang].placeholderProcedure}
                                          className="p-2 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-lg text-xs w-full focus:outline-none focus:border-[var(--accent-green)] text-[var(--text-primary)]"
                                        />
                                      ) : (
                                        testItem.procedure || "-"
                                      )}
                                    </td>

                                    {/* Result */}
                                    <td className="py-3 pr-4 space-y-1">
                                      {readOnly ? (
                                        <div
                                          className={`font-bold ${
                                            testItem.result === "Restricted" || testItem.result === "Eingeschränkt"
                                              ? "text-red-400"
                                              : testItem.result === "OK"
                                              ? "text-emerald-400"
                                              : "text-[var(--text-primary)]"
                                          }`}
                                        >
                                          {testItem.result === "Custom" ? testItem.resultCustom || "Custom" : (testItem.result === "Eingeschränkt" && lang === "EN" ? "Restricted" : testItem.result)}
                                        </div>
                                      ) : (
                                        <div className="flex flex-col gap-1.5">
                                          <select
                                            value={testItem.result === "Eingeschränkt" ? "Restricted" : testItem.result}
                                            onChange={(e) => handleTestChange(region, idx, "result", e.target.value)}
                                            className="p-2 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-lg text-xs focus:outline-none focus:border-[var(--accent-green)] text-[var(--text-primary)]"
                                          >
                                            <option value="OK">OK</option>
                                            <option value="Restricted">{lang === "EN" ? "Restricted" : "Eingeschränkt"}</option>
                                            <option value="Custom">Custom...</option>
                                          </select>
                                          {testItem.result === "Custom" && (
                                            <input
                                              type="text"
                                              value={testItem.resultCustom || ""}
                                              onChange={(e) =>
                                                handleTestChange(region, idx, "resultCustom", e.target.value)
                                              }
                                              placeholder={t[lang].customResultPlaceholder}
                                              className="p-2 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-lg text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-green)]"
                                            />
                                          )}
                                        </div>
                                      )}
                                    </td>

                                    {/* Notes */}
                                    <td className="py-3 pr-4">
                                      {readOnly ? (
                                        <span className="text-[var(--text-secondary)]">{testItem.notes || "-"}</span>
                                      ) : (
                                        <input
                                          type="text"
                                          value={testItem.notes || ""}
                                          onChange={(e) => handleTestChange(region, idx, "notes", e.target.value)}
                                          placeholder={t[lang].placeholderNotes}
                                          className="p-2 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-lg text-xs w-full focus:outline-none focus:border-[var(--accent-green)] text-[var(--text-primary)]"
                                        />
                                      )}
                                    </td>

                                    {/* Actions */}
                                    {!readOnly && (
                                      <td className="py-3 text-right">
                                        {testItem.isCustom ? (
                                          <button
                                            type="button"
                                            onClick={() => removeCustomRow(region, idx)}
                                            className="p-2 hover:text-red-500 text-[var(--text-muted)] transition-colors active-scale"
                                            title="Delete Row"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        ) : (
                                          <span className="text-[10px] text-[var(--text-muted)]">-</span>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => addCustomRow(region)}
                              className="mt-3 px-3 py-1.5 border border-[var(--border-primary)] hover:border-[var(--accent-green)]/30 hover:bg-[var(--accent-green)]/5 text-[10px] font-bold rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-all active-scale"
                            >
                              <Plus size={12} />
                              {t[lang].addRowBtn}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary & Recommendations Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 md:p-6 space-y-4">
              <div className="text-xs font-bold text-[var(--text-primary)] tracking-wider uppercase border-b border-[var(--border-primary)] pb-2.5">
                {t[lang].summaryTitle}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t[lang].summaryLabel}
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    disabled={readOnly}
                    placeholder={t[lang].summaryPlaceholder}
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-28 resize-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t[lang].recommendationsLabel}
                  </label>
                  <textarea
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    disabled={readOnly}
                    placeholder={t[lang].recommendationsPlaceholder}
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-28 resize-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Right Sidebar (Body Map) */}
          <div className="space-y-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 md:p-6 space-y-4 sticky top-[100px]">
              <div className="text-xs font-bold text-[var(--text-primary)] tracking-wider uppercase border-b border-[var(--border-primary)] pb-2.5">
                {t[lang].bodyMapTitle}
              </div>
              <BodyMap markers={bodyMapMarkers} onChange={setBodyMapMarkers} readOnly={readOnly} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
