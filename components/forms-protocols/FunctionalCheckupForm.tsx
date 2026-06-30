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
      console.log("CheckupForm: Fetching details via GET from /api/admin/checkup?id=", id);
      const res = await fetch(`/api/admin/checkup?id=${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch checkup details.");
      }

      console.log("CheckupForm: Successfully loaded checkup details", data);

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
      alert(`Error loading functional assessment form: ${err.message}`);
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

      testResultsHtml += `
        <div class="avoid-break" style="margin-top: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <h3 style="font-size: 13px; font-weight: 800; display: flex; align-items: center; gap: 8px; color: #0f172a; margin-bottom: 12px;">
            <span style="color: #22c55e; display: flex; align-items: center;">${regionIcon}</span>
            <span>${region}</span>
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff; text-align: left; border-bottom: 2px solid #22c55e;">
                <th style="padding: 10px 12px; font-family: 'Outfit', sans-serif; font-weight: 800; border-top-left-radius: 8px; border-bottom-left-radius: 8px; width: 30%;">Test</th>
                <th style="padding: 10px 12px; font-family: 'Outfit', sans-serif; font-weight: 800; width: 30%;">Procedure</th>
                <th style="padding: 10px 12px; font-family: 'Outfit', sans-serif; font-weight: 800; width: 15%;">Result</th>
                <th style="padding: 10px 12px; font-family: 'Outfit', sans-serif; font-weight: 800; border-top-right-radius: 8px; border-bottom-right-radius: 8px; width: 25%;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${tests
                .map((t, index) => {
                  const finalBefund = t.result === "Custom" ? t.resultCustom : t.result;
                  const isRestricted = finalBefund === "Restricted" || finalBefund === "Eingeschränkt";
                  
                  let badgeHtml = "";
                  if (finalBefund === "OK") {
                    badgeHtml = `<span style="background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase;">OK</span>`;
                  } else if (isRestricted) {
                    badgeHtml = `<span style="background-color: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase;">Restricted</span>`;
                  } else {
                    badgeHtml = `<span style="background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase;">${finalBefund || 'Custom'}</span>`;
                  }

                  const rowBg = index % 2 === 0 ? "#ffffff" : "#f8fafc";
                  const rowBorder = isRestricted ? "border-left: 3px solid #f97316;" : "";
                  const rowStyle = isRestricted ? 'style="background-color: #fffaf8;"' : `style="background-color: ${rowBg};"`;

                  return `
                  <tr ${rowStyle}>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 700; ${rowBorder}">${t.test || "Custom Test"}</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #475569;">${t.procedure || "-"}</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">${badgeHtml}</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #475569; font-weight: 500;">${t.notes || "-"}</td>
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
          <style>
            @media print {
              body {
                background: white;
                color: #0f172a;
                margin: 0;
                padding: 15px;
                font-size: 11px;
              }
              .no-print { display: none; }
              .avoid-break { page-break-inside: avoid; }
              .page-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 35px;
                background: white;
                border-top: 1px solid #e2e8f0;
                font-size: 8px;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 1px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 8px;
              }
              body {
                padding-bottom: 50px;
              }
            }
            .page-footer {
              border-top: 1px solid #e2e8f0;
              margin-top: 50px;
              padding-top: 15px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            body {
              font-family: 'Inter', sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #334155;
              background-color: #ffffff;
            }
            .header-layout {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .section-title {
              font-family: 'Outfit', sans-serif;
              font-size: 13px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #0f172a;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 4px;
              margin-top: 25px;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .grid-col-2 { display: flex; gap: 20px; }
            .grid-col-2 > div { flex: 1; }
            .card-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }
            .info-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 10px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .info-icon {
              width: 26px;
              height: 26px;
              background: #f0fdf4;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #22c55e;
              shrink-0;
            }
            .info-label {
              font-size: 8px;
              text-transform: uppercase;
              font-weight: 800;
              color: #64748b;
              letter-spacing: 0.5px;
            }
            .info-value {
              font-size: 10px;
              font-weight: bold;
              color: #0f172a;
              margin-top: 1px;
            }
            .anamnese-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 20px;
            }
            .anamnese-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 12px;
              min-height: 60px;
            }
            .anamnese-header {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 6px;
            }
            .anamnese-label {
              font-family: 'Outfit', sans-serif;
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #334155;
            }
            .anamnese-text {
              font-size: 10px;
              color: #475569;
              line-height: 1.4;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 8px 16px; background-color: #22c55e; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-family: 'Outfit', sans-serif; font-size: 12px; transition: all 0.2s;">
              Print / Save PDF
            </button>
          </div>

          <!-- KIO-X Header -->
          <div class="header-layout">
            <div>
              <svg viewBox="0 0 160 40" width="120" height="30" style="vertical-align: middle;">
                <rect width="160" height="40" rx="8" fill="#18181b" />
                <rect x="12" y="10" width="5" height="20" rx="2" fill="#22c55e" />
                <text x="26" y="26" font-family="'Outfit', sans-serif" font-weight="900" font-size="16" fill="#ffffff" letter-spacing="1">KIO-X</text>
                <text x="86" y="24" font-family="'Outfit', sans-serif" font-weight="600" font-size="8" fill="#a1a1aa" letter-spacing="1.5">CLINICAL</text>
              </svg>
              <div style="font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; font-weight: 800;">SPORTS PERFORMANCE PLATFORM</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a; tracking-wide: 1px;">Functional Assessment</h2>
              <div style="margin-top: 4px;">
                <span style="background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; padding: 3px 8px; border-radius: 9999px; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${status === "SUBMITTED" ? "Submitted" : "Draft"}
                </span>
              </div>
            </div>
          </div>

          <!-- Athlete Card Info Grid -->
          <div class="card-grid">
            <div class="info-card">
              <div class="info-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div class="info-label">Athlete / Patient</div>
                <div class="info-value">${athleteName}</div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4.8 20h14.4M12 4v12M8 8l4-4 4 4"/></svg>
              </div>
              <div>
                <div class="info-label">Therapist</div>
                <div class="info-value">${therapistName}</div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div>
                <div class="info-label">Assessment Date</div>
                <div class="info-value">${checkupDate}</div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <div class="info-label">Report Generated</div>
                <div class="info-value">${new Date().toLocaleDateString("en-US")}</div>
              </div>
            </div>
          </div>

          <!-- Anamnese Grid Cards -->
          <div class="section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: #22c55e;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Anamnesis & Complaints</span>
          </div>
          
          <div class="anamnese-grid">
            <!-- Pain -->
            <div class="anamnese-card" style="${currentPain ? 'background: #fffaf8; border-color: #ffdcd3;' : ''}">
              <div class="anamnese-header">
                <span style="color: ${currentPain ? '#ef4444' : '#64748b'}; display: flex; align-items: center;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </span>
                <span class="anamnese-label" style="${currentPain ? 'color: #991b1b;' : ''}">Current Pain</span>
              </div>
              <div class="anamnese-text" style="${currentPain ? 'color: #7f1d1d;' : ''}">${currentPain.replace(/\n/g, "<br/>") || "No pain reported"}</div>
            </div>

            <!-- Restrictions -->
            <div class="anamnese-card" style="${movementRestrictions ? 'background: #fffaf8; border-color: #ffdcd3;' : ''}">
              <div class="anamnese-header">
                <span style="color: ${movementRestrictions ? '#f97316' : '#64748b'}; display: flex; align-items: center;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 3h5v5M8 21H3v-5M12 12L21 3M12 12l-9 9"/></svg>
                </span>
                <span class="anamnese-label" style="${movementRestrictions ? 'color: #c2410c;' : ''}">Movement Restrictions</span>
              </div>
              <div class="anamnese-text" style="${movementRestrictions ? 'color: #9a3412;' : ''}">${movementRestrictions.replace(/\n/g, "<br/>") || "No restrictions noted"}</div>
            </div>

            <!-- Injuries -->
            <div class="anamnese-card">
              <div class="anamnese-header">
                <span style="color: #64748b; display: flex; align-items: center;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </span>
                <span class="anamnese-label">Previous Injuries & Operations</span>
              </div>
              <div class="anamnese-text">${previousInjuries.replace(/\n/g, "<br/>") || "No previous injuries declared"}</div>
            </div>

            <!-- Allergies -->
            <div class="anamnese-card">
              <div class="anamnese-header">
                <span style="color: #64748b; display: flex; align-items: center;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 22h20L12 2z"/></svg>
                </span>
                <span class="anamnese-label">Allergies & Intolerances</span>
              </div>
              <div class="anamnese-text">${foodAllergies.replace(/\n/g, "<br/>") || "No allergies declared"}</div>
            </div>
          </div>

          <!-- Body Map & Markers -->
          <div class="avoid-break" style="margin-bottom: 25px;">
            <div class="section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: #22c55e;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Problem Zones Body Map</span>
            </div>
            <div class="grid-col-2" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
              <div style="display: flex; gap: 20px; justify-content: center; align-items: center; border-right: 1px solid #f1f5f9; padding-right: 20px;">
                <div style="text-align: center;">
                  <div style="font-family: 'Outfit', sans-serif; font-size: 9px; font-weight: 800; margin-bottom: 6px; text-transform: uppercase; color: #64748b;">Front</div>
                  ${frontSvg}
                </div>
                <div style="text-align: center;">
                  <div style="font-family: 'Outfit', sans-serif; font-size: 9px; font-weight: 800; margin-bottom: 6px; text-transform: uppercase; color: #64748b;">Back</div>
                  ${backSvg}
                </div>
              </div>
              <div style="padding-left: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px;">
                  <h4 style="font-size: 11px; font-weight: 800; color: #0f172a; margin: 0;">Marker Details</h4>
                  
                  <!-- Mini Severity Legend -->
                  <div style="display: flex; gap: 8px; font-size: 7px; font-weight: 800; text-transform: uppercase; color: #64748b;">
                    <span style="display: flex; align-items: center; gap: 2px;"><span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #eab308;"></span>Mild</span>
                    <span style="display: flex; align-items: center; gap: 2px;"><span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #f97316;"></span>Mod</span>
                    <span style="display: flex; align-items: center; gap: 2px;"><span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #ef4444;"></span>Sev</span>
                  </div>
                </div>
                
                <div style="max-height: 250px; overflow-y: auto;">
                  ${
                    bodyMapMarkers.length === 0
                      ? '<p style="font-size: 10px; color: #94a3b8; font-style: italic; text-align: center; margin-top: 20px;">No pain points marked</p>'
                      : markersListHtml
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Test Results -->
          <div class="section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: #22c55e;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Clinical Findings & Tests</span>
          </div>
          ${testResultsHtml}

          <!-- Summary & Recommendations -->
          <div class="avoid-break" style="margin-top: 30px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <div class="section-title" style="margin-top: 0; border-bottom: 2px solid #0f172a; padding-bottom: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: #22c55e;"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Summary & Recommendations</span>
            </div>
            
            <div style="display: flex; gap: 20px;">
              <div style="flex: 1; min-width: 0;">
                <h4 style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">Therapeutic Summary</h4>
                <div style="color: #475569; font-size: 10px; line-height: 1.5; font-weight: 500;">
                  ${summary.replace(/\n/g, "<br/>") || "No summary entered"}
                </div>
              </div>
              <div style="flex: 1; min-width: 0; border-left: 1px dashed #cbd5e1; padding-left: 20px;">
                <h4 style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">Training Recommendations</h4>
                <div style="color: #475569; font-size: 10px; line-height: 1.5; font-weight: 500;">
                  ${recommendations.replace(/\n/g, "<br/>") || "No recommendations entered"}
                </div>
              </div>
            </div>
          </div>

          <!-- Signatures -->
          <div class="avoid-break" style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 10px;">
            <div style="width: 220px; border-top: 2px solid #0f172a; text-align: center; padding-top: 8px; font-family: 'Outfit', sans-serif; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">
              Therapist Signature
            </div>
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
