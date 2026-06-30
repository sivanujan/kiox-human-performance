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

const DEFAULT_REGIONS: Record<string, { test: string; procedure: string }[]> = {
  "1. Cervical Spine (Neck)": [
    { test: "Rotation 80/0/80", procedure: "Active movement in sitting position" },
    { test: "Seitneigung 45/0/45", procedure: "Active movement in sitting position" },
    { test: "Flexion/Extension 40/0/40", procedure: "Active movement in sitting position" }
  ],
  "2. Lumbar Spine (Lower Back)": [
    { test: "Vorbeugtest", procedure: "Standing forward bend, monitor pelvis & spine" }
  ],
  "3. Pelvis & Hip": [
    { test: "FABER-Test", procedure: "Flexion, Abduction, External Rotation" },
    { test: "Thomas-Test", procedure: "Evaluate hip flexion contracture/iliopsoas tightness" },
    { test: "Beweglichkeit-Hüfte", procedure: "Internal/External rotation & abduction" },
    { test: "Vorlauftest", procedure: "Standing spine flexion, palpate PSIS" },
    { test: "Sacrumtest", procedure: "Springing/provocation test on sacrum" }
  ],
  "4. Knee & Ankle": [
    { test: "Kniebeweglichkeit", procedure: "Flexion & extension mobility" },
    { test: "Tiefe Hocke", procedure: "Deep squat assessment, heels on floor" },
    { test: "Dorsalfexion-Test", procedure: "Weight-bearing lunge test" },
    { test: "OSG/Talus/Fibula", procedure: "Upper ankle joint translation & fibular head mobility" },
    { test: "USG/Navic./Cuboid/Calcium", procedure: "Subtalar joint and midfoot mobility" }
  ],
  "5. Jaw, Breathing Mechanics & Thorax": [
    { test: "Mundöffnung", procedure: "3-finger test width for jaw opening" },
    { test: "Thoraxexpansion", procedure: "Chest circumference change during deep breathing" },
    { test: "Zwerchfellaktivität", procedure: "Diaphragm excursions palpation" }
  ],
  "6. Visceral Check": [
    { test: "Oberbauch", procedure: "Palpation of liver, stomach, gallbladder area" },
    { test: "Unterbauch", procedure: "Palpation of intestines, cecum, sigmoid area" },
    { test: "Becken", procedure: "Urogenital system & pelvic floor visceral check" }
  ],
  "7. Isolated Strength Tests": [
    { test: "RL muscle group tests", procedure: "Supine isolated muscle resistance" },
    { test: "SL muscle group tests", procedure: "Side-lying isolated muscle resistance" },
    { test: "BL muscle group tests", procedure: "Prone isolated muscle resistance" }
  ],
  "8. Gait Analysis & Drop Jump": [
    { test: "Single Leg Stand 30sec", procedure: "Balance & stability check on left/right leg" }
  ]
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
      // Initialize default test results structure
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
      const { data, error } = await supabase
        .from("functional_checkups")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

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
    } catch (err) {
      console.error("Error loading checkup:", err);
      alert("Error loading functional assessment form.");
    } finally {
      setIsLoading(false);
    }
  };

  // State utility to override the missing setter
  const setIsLoading = (val: boolean) => {
    setLoading(val);
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
      alert("Please select an athlete.");
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
        console.log("CheckupForm: Submitting PUT request to /api/admin/checkup", { checkupId, payload });
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
        console.log("CheckupForm: Submitting POST request to /api/admin/checkup", { athleteId, payload });
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

      console.log("CheckupForm: Received response status", response.status);
      const responseData = await response.json();
      console.log("CheckupForm: Received response data", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save assessment form.");
      }

      alert(submitStatus === "SUBMITTED" ? "Assessment submitted successfully!" : "Assessment saved as draft.");
      onSaved();
    } catch (err: any) {
      console.error("Save checkup error:", err);
      alert(`Error saving: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const athlete = athletes.find((a) => a.id === athleteId);
    const athleteName = athlete ? `${athlete.first_name} ${athlete.last_name}` : "Unknown";
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Build vector SVG string
    const renderSvgString = (side: "front" | "back") => {
      const sideMarkers = bodyMapMarkers.filter((m) => m.side === side);
      const pinsHtml = sideMarkers
        .map((m) => {
          const globalIdx = bodyMapMarkers.findIndex((gm) => gm.id === m.id) + 1;
          return `
            <g>
              <circle cx="${m.x}" cy="${m.y}" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1" />
              <text x="${m.x}" y="${m.y + 2}" text-anchor="middle" font-size="7" font-weight="bold" fill="#ffffff" font-family="sans-serif">${globalIdx}</text>
            </g>
          `;
        })
        .join("");

      return `
        <svg viewBox="0 0 100 220" style="width: 140px; height: auto; border: 1px solid #e4e4e7; border-radius: 8px; padding: 10px; background: #fafafa;">
          <path d="M 50 15 C 42 15, 38 21, 38 28 C 38 35, 42 41, 50 41 C 58 41, 62 35, 62 28 C 62 21, 58 15, 50 15 Z M 45 41 L 55 41 L 55 48 L 45 48 Z M 45 48 C 33 49, 30 55, 27 63 L 14 105 C 12 110, 16 114, 20 110 L 28 80 L 28 125 C 28 127, 29 129, 31 129 C 33 129, 34 127, 34 125 L 34 70 L 37 70 L 37 135 L 63 135 L 63 70 L 66 70 L 66 125 C 66 127, 67 129, 69 129 C 71 129, 72 127, 72 125 L 72 80 L 80 110 C 84 114, 88 110, 86 105 L 73 63 C 70 55, 67 49, 55 48 Z M 37 135 L 63 135 L 60 155 L 40 155 Z M 40 155 L 35 200 L 38 245 C 38 249, 43 249, 44 245 L 49 200 L 49 155 Z M 60 155 L 65 200 L 62 245 C 62 249, 57 249, 56 245 L 51 200 L 51 155 Z" 
                fill="#e4e4e7" stroke="#27272a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          ${pinsHtml}
        </svg>
      `;
    };

    const frontSvg = renderSvgString("front");
    const backSvg = renderSvgString("back");

    // Build the test results HTML
    let testResultsHtml = "";
    Object.keys(testResults).forEach((region) => {
      const tests = testResults[region] || [];
      if (tests.length === 0) return;

      testResultsHtml += `
        <div class="avoid-break" style="margin-top: 20px;">
          <h3 style="font-size: 13px; font-weight: bold; border-bottom: 2px solid #22c55e; padding-bottom: 4px; margin-bottom: 8px; color: #111;">
            ${region}
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
            <thead>
              <tr style="background-color: #f4f4f5; text-align: left;">
                <th style="padding: 6px; border: 1px solid #e4e4e7; width: 30%;">Test</th>
                <th style="padding: 6px; border: 1px solid #e4e4e7; width: 30%;">Procedure</th>
                <th style="padding: 6px; border: 1px solid #e4e4e7; width: 15%;">Result</th>
                <th style="padding: 6px; border: 1px solid #e4e4e7; width: 25%;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${tests
                .map((t) => {
                  const finalBefund = t.result === "Custom" ? t.resultCustom : t.result;
                  const rowStyle = finalBefund === "Restricted" || finalBefund === "Eingeschränkt" ? 'style="background-color: #fff1f2; color: #9f1239;"' : "";
                  return `
                  <tr ${rowStyle}>
                    <td style="padding: 6px; border: 1px solid #e4e4e7; font-weight: bold;">${t.test || "Custom Test"}</td>
                    <td style="padding: 6px; border: 1px solid #e4e4e7; color: #555;">${t.procedure || "-"}</td>
                    <td style="padding: 6px; border: 1px solid #e4e4e7; font-weight: bold;">${finalBefund || "OK"}</td>
                    <td style="padding: 6px; border: 1px solid #e4e4e7;">${t.notes || "-"}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    });

    // Build the body map markers list
    const markersListHtml = bodyMapMarkers
      .map((m, idx) => `
        <li style="margin-bottom: 6px; font-size: 11px;">
          <strong>#${idx + 1} [${m.side === "front" ? "Front" : "Back"}]:</strong> ${m.note}
        </li>
      `)
      .join("");

    // Output raw HTML to the print window
    printWindow.document.write(`
      <html>
        <head>
          <title>KIO-X Functional Assessment - ${athleteName}</title>
          <style>
            @media print {
              body {
                background: white;
                color: black;
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 20px;
                font-size: 12px;
              }
              .no-print { display: none; }
              .avoid-break { page-break-inside: avoid; }
            }
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #333;
            }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .header-table td { padding: 5px 0; }
            .section-title {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 2px solid #000;
              padding-bottom: 6px;
              margin-top: 30px;
              margin-bottom: 12px;
            }
            .grid-col-2 { display: flex; gap: 20px; }
            .grid-col-2 > div { flex: 1; }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 8px 16px; background-color: #22c55e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
              Print / Save PDF
            </button>
          </div>

          <!-- KIO-X Header -->
          <table class="header-table">
            <tr>
              <td style="width: 50%;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px; color: #111;">KIO-X</h1>
                <span style="font-size: 10px; color: #666; letter-spacing: 2px; text-transform: uppercase;">Sports Performance Platform</span>
              </td>
              <td style="width: 50%; text-align: right; vertical-align: top;">
                <h2 style="margin: 0; font-size: 14px; font-weight: bold; text-transform: uppercase; color: #22c55e;">Functional Check-Up & Assessment Form</h2>
                <span style="font-size: 11px; color: #666;">Status: ${status === "SUBMITTED" ? "Submitted" : "Draft"}</span>
              </td>
            </tr>
          </table>

          <!-- General Details -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; border: 1px solid #e4e4e7; background: #fafafa;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e4e4e7; width: 25%;"><strong>Athlete/Patient:</strong></td>
              <td style="padding: 10px; border: 1px solid #e4e4e7; width: 25%;">${athleteName}</td>
              <td style="padding: 10px; border: 1px solid #e4e4e7; width: 25%;"><strong>Therapist:</strong></td>
              <td style="padding: 10px; border: 1px solid #e4e4e7; width: 25%;">${therapistName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e4e4e7;"><strong>Date:</strong></td>
              <td style="padding: 10px; border: 1px solid #e4e4e7;">${checkupDate}</td>
              <td style="padding: 10px; border: 1px solid #e4e4e7;"><strong>Created on:</strong></td>
              <td style="padding: 10px; border: 1px solid #e4e4e7;">${new Date().toLocaleDateString("en-US")}</td>
            </tr>
          </table>

          <!-- Anamnese -->
          <div class="section-title">Anamnesis & Complaints</div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px;">
            <tr>
              <td style="padding: 8px 0; vertical-align: top; width: 30%;"><strong>Current Pain:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5;">${currentPain.replace(/\n/g, "<br/>") || "No details provided"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top;"><strong>Movement Restrictions:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5;">${movementRestrictions.replace(/\n/g, "<br/>") || "No details provided"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top;"><strong>Previous Injuries:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5;">${previousInjuries.replace(/\n/g, "<br/>") || "No details provided"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top;"><strong>Allergies & Intolerances:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5;">${foodAllergies.replace(/\n/g, "<br/>") || "No details provided"}</td>
            </tr>
          </table>

          <!-- Body Map & Markers -->
          <div class="avoid-break">
            <div class="section-title">Problem Zones Body Map</div>
            <div class="grid-col-2">
              <div style="display: flex; gap: 15px; justify-content: center; align-items: center;">
                <div style="text-align: center;">
                  <div style="font-size: 9px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">Front</div>
                  ${frontSvg}
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 9px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">Back</div>
                  ${backSvg}
                </div>
              </div>
              <div>
                <h4 style="font-size: 11px; margin-top: 0; font-weight: bold; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;">Body Map Notes:</h4>
                ${
                  bodyMapMarkers.length === 0
                    ? '<p style="font-size: 11px; color: #777; font-style: italic;">No pain points marked</p>'
                    : `<ol style="padding-left: 15px; margin: 0;">${markersListHtml}</ol>`
                }
              </div>
            </div>
          </div>

          <!-- Test Results -->
          <div class="section-title">Clinical Findings & Tests</div>
          ${testResultsHtml}

          <!-- Summary & Recommendations -->
          <div class="avoid-break" style="margin-top: 30px;">
            <div class="section-title">Summary & Recommendations</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="width: 50%; vertical-align: top; padding-right: 15px;">
                  <strong style="font-size: 12px; display: block; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px;">Therapeutic Summary:</strong>
                  <div style="color: #444; line-height: 1.5;">${summary.replace(/\n/g, "<br/>") || "No summary entered"}</div>
                </td>
                <td style="width: 50%; vertical-align: top; padding-left: 15px; border-left: 1px solid #e4e4e7;">
                  <strong style="font-size: 12px; display: block; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px;">Training Recommendations:</strong>
                  <div style="color: #444; line-height: 1.5;">${recommendations.replace(/\n/g, "<br/>") || "No recommendations entered"}</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Signatures -->
          <div class="avoid-break" style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 11px;">
            <div style="width: 200px; border-top: 1px solid #000; text-align: center; padding-top: 6px;">
              Therapist Signature
            </div>
            <div style="width: 200px; border-top: 1px solid #000; text-align: center; padding-top: 6px;">
              Athlete/Patient Initials
            </div>
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
              {checkupId ? (readOnly ? "Functional Check-Up (View)" : "Functional Check-Up (Edit)") : "Create New Assessment Form"}
            </h2>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 uppercase tracking-widest">
              {checkupId ? `Check-Up ID: ${checkupId.substring(0, 8)}...` : "Digital Form • KIO-X Clinical"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {checkupId && (
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 border border-[var(--border-primary)] hover:border-[var(--accent-green)]/30 hover:bg-[var(--accent-green)]/5 text-xs text-[var(--text-primary)] rounded-xl font-bold flex items-center gap-2 transition-all active-scale"
            >
              <FileText size={14} className="text-[var(--accent-green)]" />
              PDF Export
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
                  Save Draft
                </button>
              )}
              <button
                onClick={() => handleSave("SUBMITTED")}
                disabled={loading}
                className="px-4 py-2 bg-[var(--accent-green)] text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[var(--accent-green)]/80 transition-all flex items-center gap-2 active-scale shadow-[0_0_15px_rgba(34,197,94,0.15)]"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                Submit & Finalize
              </button>
            </>
          )}
        </div>
      </div>

      {loading && !checkupId ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-[var(--accent-green)]" size={32} />
          <span className="text-xs text-[var(--text-secondary)] uppercase tracking-widest animate-pulse">
            Assessment form is syncing...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Form Left/Main Block */}
          <div className="xl:col-span-2 space-y-6">
            {/* Header Details Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 md:p-6 space-y-4">
              <div className="text-xs font-bold text-[var(--text-primary)] tracking-wider uppercase border-b border-[var(--border-primary)] pb-2.5">
                Demographics & Anamnesis
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Athlete / Patient
                  </label>
                  {readOnly ? (
                    <div className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl font-bold text-[var(--text-primary)]">
                      {athletes.find((a) => a.id === athleteId)
                        ? `${athletes.find((a) => a.id === athleteId).first_name} ${
                            athletes.find((a) => a.id === athleteId).last_name
                          }`
                        : "Loading athlete..."}
                    </div>
                  ) : (
                    <select
                      value={athleteId}
                      onChange={(e) => setAthleteId(e.target.value)}
                      className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] font-bold cursor-pointer"
                    >
                      <option value="">-- Select Athlete --</option>
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
                    Therapist / Osteopath
                  </label>
                  <input
                    type="text"
                    value={therapistName}
                    onChange={(e) => setTherapistName(e.target.value)}
                    disabled={readOnly}
                    placeholder="Therapist Name"
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] font-semibold disabled:opacity-75"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Date
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
                    Current Pain (Location, When, Since when)
                  </label>
                  <textarea
                    value={currentPain}
                    onChange={(e) => setCurrentPain(e.target.value)}
                    disabled={readOnly}
                    placeholder="e.g., Pulling pain in the lower back during rotation, for about 2 weeks..."
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-20 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Current Movement Restrictions
                  </label>
                  <textarea
                    value={movementRestrictions}
                    onChange={(e) => setMovementRestrictions(e.target.value)}
                    disabled={readOnly}
                    placeholder="e.g., Reduced bilateral hip joint flexion..."
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-20 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Previous Injuries / Operations
                  </label>
                  <textarea
                    value={previousInjuries}
                    onChange={(e) => setPreviousInjuries(e.target.value)}
                    disabled={readOnly}
                    placeholder="e.g., Ankle ligament tear left (2024)..."
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-20 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Food Allergies / Intolerances
                  </label>
                  <textarea
                    value={foodAllergies}
                    onChange={(e) => setFoodAllergies(e.target.value)}
                    disabled={readOnly}
                    placeholder="e.g., Gluten intolerance, pollen allergy..."
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Test Tables Region Card (Accordion) */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 md:p-6 space-y-4">
              <div className="text-xs font-bold text-[var(--text-primary)] tracking-wider uppercase border-b border-[var(--border-primary)] pb-2.5">
                Clinical Tests & Findings by Region
              </div>

              <div className="space-y-3">
                {Object.keys(DEFAULT_REGIONS).map((region) => {
                  const isExpanded = activeSection === region;
                  const tests = testResults[region] || [];
                  const restrictedCount = tests.filter(
                    (t) => t.result === "Restricted" || t.result === "Eingeschränkt" || (t.result === "Custom" && t.resultCustom)
                  ).length;

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
                            {region}
                          </span>
                          {restrictedCount > 0 && (
                            <span className="px-2 py-0.5 text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-full">
                              {restrictedCount} finding(s)
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
                                <th className="pb-2.5 width-[25%]">Test</th>
                                <th className="pb-2.5 width-[30%]">Procedure</th>
                                <th className="pb-2.5 width-[20%]">Result</th>
                                <th className="pb-2.5 width-[20%]">Notes</th>
                                {!readOnly && <th className="pb-2.5 w-[5%] text-right">Action</th>}
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
                                          placeholder="Test name..."
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
                                          placeholder="Procedure..."
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
                                          {testItem.result === "Custom" ? testItem.resultCustom || "Custom" : testItem.result === "Eingeschränkt" ? "Restricted" : testItem.result}
                                        </div>
                                      ) : (
                                        <div className="flex flex-col gap-1.5">
                                          <select
                                            value={testItem.result === "Eingeschränkt" ? "Restricted" : testItem.result}
                                            onChange={(e) => handleTestChange(region, idx, "result", e.target.value)}
                                            className="p-2 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-lg text-xs focus:outline-none focus:border-[var(--accent-green)] text-[var(--text-primary)]"
                                          >
                                            <option value="OK">OK</option>
                                            <option value="Restricted">Restricted</option>
                                            <option value="Custom">Custom...</option>
                                          </select>
                                          {testItem.result === "Custom" && (
                                            <input
                                              type="text"
                                              value={testItem.resultCustom || ""}
                                              onChange={(e) =>
                                                handleTestChange(region, idx, "resultCustom", e.target.value)
                                              }
                                              placeholder="Custom Result..."
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
                                          placeholder="No findings / OK"
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
                              Add Row
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
                Summary & Therapy Planning
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Summary
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    disabled={readOnly}
                    placeholder="• Cervical block cleared&#10;• M. iliopsoas trigger point release performed..."
                    className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-input)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] h-28 resize-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Training Recommendations
                  </label>
                  <textarea
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    disabled={readOnly}
                    placeholder="• Daily stretching of hip flexors&#10;• Eccentric calf training bilaterally..."
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
                Body Map (Problem Zones)
              </div>
              <BodyMap markers={bodyMapMarkers} onChange={setBodyMapMarkers} readOnly={readOnly} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
