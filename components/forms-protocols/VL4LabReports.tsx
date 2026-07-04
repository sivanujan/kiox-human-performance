"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Download, Loader2, Calendar, Users, Database, FileText } from "lucide-react";
import { format } from "date-fns";

interface StageData {
  stage: number;
  speed_kmh: number | null;
  time: string | null;
  lactate_mmol: number | null;
  heart_rate: number | null;
}

interface VL4ReportProps {
  // Empty props
}

export default function VL4LabReports({}: VL4ReportProps) {
  const supabase = createClient();
  const [sourceType, setSourceType] = useState<"scheduled" | "curriculum">("scheduled");
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [assignedAthletes, setAssignedAthletes] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<Record<string, any>>({});
  
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  // 1. Fetch training sessions / curriculum items based on toggle (filtered to recent or test-existing items)
  useEffect(() => {
    const fetchSessions = async () => {
      setLoadingSessions(true);
      setSelectedSessionId("");
      setAssignedAthletes([]);
      setLabTests({});
      try {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

        // Fetch test session IDs and recent training sessions in parallel
        const [testRes, recentRes] = await Promise.all([
          supabase
            .from("vl4_lab_tests")
            .select("session_id"),
          supabase
            .from("training_sessions")
            .select("id, title, scheduled_date, start_time, session_type, is_curriculum, assigned_athletes")
            .eq("is_curriculum", sourceType === "curriculum")
            .gte("scheduled_date", oneWeekAgoStr)
            .lte("scheduled_date", todayStr)
        ]);

        if (testRes.error) throw testRes.error;
        if (recentRes.error) throw recentRes.error;

        const testSessionIds = testRes.data?.map((t: any) => t.session_id).filter(Boolean) || [];
        const recentSessions = recentRes.data || [];
        const recentSessionIds = new Set(recentSessions.map((s: any) => s.id));

        // Find test session IDs that are not in the recent list
        const missingIds = testSessionIds.filter((id: string) => !recentSessionIds.has(id));

        let finalSessions = [...recentSessions];

        // Fetch older sessions that have tests if there are any
        if (missingIds.length > 0) {
          const { data: oldSessions, error: oldErr } = await supabase
            .from("training_sessions")
            .select("id, title, scheduled_date, start_time, session_type, is_curriculum, assigned_athletes")
            .eq("is_curriculum", sourceType === "curriculum")
            .in("id", missingIds);

          if (!oldErr && oldSessions) {
            finalSessions = [...finalSessions, ...oldSessions];
          }
        }

        // Sort final sessions by date descending, then start_time descending
        finalSessions.sort((a: any, b: any) => {
          const dateCompare = b.scheduled_date.localeCompare(a.scheduled_date);
          if (dateCompare !== 0) return dateCompare;
          return (b.start_time || "").localeCompare(a.start_time || "");
        });

        // Filter out any integration/automated test sessions from the list
        const filtered = finalSessions.filter((s: any) => {
          const titleLower = (s.title || "").toLowerCase();
          return !titleLower.includes("integration test") && !titleLower.includes("next.js app");
        });

        setSessions(filtered);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [sourceType]);

  // 2. Fetch roster athletes and lab test records once a session is selected
  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchSessionRoster = async () => {
      setLoadingRoster(true);
      setAssignedAthletes([]);
      setLabTests({});
      try {
        // Find session in state
        const session = sessions.find(s => s.id === selectedSessionId);
        if (!session || !session.assigned_athletes || session.assigned_athletes.length === 0) {
          setLoadingRoster(false);
          return;
        }

        // Fetch profiles of assigned athletes
        const { data: profiles, error: pError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, date_of_birth, height, weight, avatar_url")
          .in("id", session.assigned_athletes)
          .order("first_name");

        if (pError) throw pError;

        // Fetch any lab tests registered for this session
        const { data: tests, error: tError } = await supabase
          .from("vl4_lab_tests")
          .select("*")
          .eq("session_id", selectedSessionId);

        if (tError) throw tError;

        const testsMap: Record<string, any> = {};
        if (tests) {
          tests.forEach((t: any) => {
            testsMap[t.athlete_id] = t;
          });
        }

        setAssignedAthletes(profiles || []);
        setLabTests(testsMap);
      } catch (err) {
        console.error("Failed to load roster lab records:", err);
      } finally {
        setLoadingRoster(false);
      }
    };

    fetchSessionRoster();
  }, [selectedSessionId, sessions]);

  const calculateAge = (dobString?: string) => {
    if (!dobString) return "N/A";
    try {
      const dob = new Date(dobString);
      const diff = Date.now() - dob.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
    } catch (e) {
      return "N/A";
    }
  };

  const getPaceFromSpeed = (speedKmh: number): string => {
    if (speedKmh <= 0) return "--:--";
    const decimalMins = 60 / speedKmh;
    const mins = Math.floor(decimalMins);
    const secs = Math.round((decimalMins - mins) * 60);
    const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    return `${paddedMins}:${paddedSecs}`;
  };

  const getMarathonTimeFromSpeed = (speedKmh: number): string => {
    if (speedKmh <= 0) return "--:--";
    const marathonDistance = 42.195;
    const decimalHours = marathonDistance / speedKmh;
    const hours = Math.floor(decimalHours);
    const mins = Math.round((decimalHours - hours) * 60);
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    const paddedHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${paddedHours}:${paddedMins}`;
  };

  const performLactateInterpolation = (
    stages: StageData[],
    restingLactate: number | null,
    restingHr: number | null,
    targetLactate: number
  ) => {
    const validStages = stages
      .filter(s => s.lactate_mmol !== null && s.speed_kmh !== null && s.heart_rate !== null)
      .sort((a, b) => (a.lactate_mmol || 0) - (b.lactate_mmol || 0)) as { stage: number; speed_kmh: number; time: string; lactate_mmol: number; heart_rate: number }[];

    if (validStages.length === 0) {
      return { speed: 0, hr: 0, lactate: targetLactate };
    }

    const firstStage = validStages[0];
    const restLac = restingLactate !== null ? restingLactate : 1.6;
    const restHr = restingHr !== null ? restingHr : 80;

    if (targetLactate < firstStage.lactate_mmol) {
      const startLac = restLac;
      const startHr = restHr;
      const startSpeed = firstStage.speed_kmh * 0.6; // Start speed approximation

      if (targetLactate <= startLac) {
        return { speed: startSpeed, hr: startHr, lactate: targetLactate };
      }

      const f = (targetLactate - startLac) / (firstStage.lactate_mmol - startLac);
      const speed = startSpeed + f * (firstStage.speed_kmh - startSpeed);
      const hr = startHr + f * (firstStage.heart_rate - startHr);
      return { speed, hr, lactate: targetLactate };
    }

    const lastStage = validStages[validStages.length - 1];
    if (targetLactate >= lastStage.lactate_mmol) {
      return { speed: lastStage.speed_kmh, hr: lastStage.heart_rate, lactate: targetLactate };
    }

    for (let i = 0; i < validStages.length - 1; i++) {
      const current = validStages[i];
      const next = validStages[i + 1];
      if (targetLactate >= current.lactate_mmol && targetLactate <= next.lactate_mmol) {
        const f = (targetLactate - current.lactate_mmol) / (next.lactate_mmol - current.lactate_mmol);
        const speed = current.speed_kmh + f * (next.speed_kmh - current.speed_kmh);
        const hr = current.heart_rate + f * (next.heart_rate - current.heart_rate);
        return { speed, hr, lactate: targetLactate };
      }
    }

    return { speed: lastStage.speed_kmh, hr: lastStage.heart_rate, lactate: targetLactate };
  };

  const handleDownloadPdf = async (athlete: any, testData: any) => {
    setGeneratingPdfId(athlete.id);
    try {
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

      // Extract details
      const stages: StageData[] = Array.isArray(testData.stage_data) ? testData.stage_data : [];
      const restLac = testData.resting_lactate !== null ? parseFloat(testData.resting_lactate) : 1.6;
      const restHr = testData.resting_hr !== null ? parseInt(testData.resting_hr) : 80;

      // Find minimum lactate during test
      const stageLactates = stages.filter(s => s.lactate_mmol !== null).map(s => s.lactate_mmol || 0);
      const testMinLactate = stageLactates.length > 0 ? Math.min(...stageLactates) : restLac;
      const lactateMin = Math.min(restLac, testMinLactate);

      // Threshold levels
      const asVal = 2.0;
      const vl3Val = 3.0;
      const ansVal = 4.0;
      const iatVal = lactateMin + 0.5;
      const dickhuthVal = lactateMin + 2.0;

      const asMetrics = performLactateInterpolation(stages, restLac, restHr, asVal);
      const vl3Metrics = performLactateInterpolation(stages, restLac, restHr, vl3Val);
      const ansMetrics = performLactateInterpolation(stages, restLac, restHr, ansVal);
      const iatMetrics = performLactateInterpolation(stages, restLac, restHr, iatVal);
      const dickhuthMetrics = performLactateInterpolation(stages, restLac, restHr, dickhuthVal);

      // Max values
      const validStages = stages.filter(s => s.speed_kmh !== null && s.heart_rate !== null && s.lactate_mmol !== null);
      const maxSpeed = validStages.length > 0 ? Math.max(...validStages.map(s => s.speed_kmh || 0)) : 0;
      const maxHr = validStages.length > 0 ? Math.max(...validStages.map(s => s.heart_rate || 0)) : 0;
      const maxLactate = validStages.length > 0 ? Math.max(...validStages.map(s => s.lactate_mmol || 0)) : 0;

      const thresholdRows = [
        { name: "Aerobic Threshold (AS)", lactate: asVal, hr: Math.round(asMetrics.hr), speed: asMetrics.speed },
        { name: "VL3 Threshold (VL3)", lactate: vl3Val, hr: Math.round(vl3Metrics.hr), speed: vl3Metrics.speed },
        { name: "Anaerobic Threshold (ANS)", lactate: ansVal, hr: Math.round(ansMetrics.hr), speed: ansMetrics.speed },
        { name: "Individual Aerobic Threshold (IAT)", lactate: iatVal, hr: Math.round(iatMetrics.hr), speed: iatMetrics.speed },
        { name: "Dickhuth Model Threshold", lactate: dickhuthVal, hr: Math.round(dickhuthMetrics.hr), speed: dickhuthMetrics.speed },
        { name: "Maximum Performance (Max)", lactate: maxLactate, hr: maxHr, speed: maxSpeed }
      ];

      // Training Zones relative to Dickhuth speed and heart rate
      const dickhuthSpeed = dickhuthMetrics.speed || maxSpeed || 10.0;
      const dickhuthHr = dickhuthMetrics.hr || maxHr || 160;

      const zoneRows = [
        {
          name: "Active Recovery (EL/AL)",
          intensity: "Regeneration",
          lacRange: `< ${asVal.toFixed(1)}`,
          speedMin: dickhuthSpeed * 0.65,
          speedMax: dickhuthSpeed * 0.74,
          hrMin: dickhuthHr * 0.73,
          hrMax: dickhuthHr * 0.78
        },
        {
          name: "Basic Endurance 1 (GA1)",
          intensity: "Endurance",
          lacRange: `${asVal.toFixed(1)} - ${vl3Val.toFixed(1)}`,
          speedMin: dickhuthSpeed * 0.75,
          speedMax: dickhuthSpeed * 0.89,
          hrMin: dickhuthHr * 0.83,
          hrMax: dickhuthHr * 0.94
        },
        {
          name: "Basic Endurance 2 (GA2)",
          intensity: "Development",
          lacRange: `${vl3Val.toFixed(1)} - ${dickhuthVal.toFixed(1)}`,
          speedMin: dickhuthSpeed * 0.90,
          speedMax: dickhuthSpeed * 0.98,
          hrMin: dickhuthHr * 0.94,
          hrMax: dickhuthHr * 0.99
        },
        {
          name: "Threshold Training (Wettkampf)",
          intensity: "Threshold",
          lacRange: `${dickhuthVal.toFixed(1)} - ${ansVal.toFixed(1)}`,
          speedMin: dickhuthSpeed * 0.98,
          speedMax: dickhuthSpeed * 1.06,
          hrMin: dickhuthHr * 0.99,
          hrMax: dickhuthHr * 1.05
        },
        {
          name: "Anaerobic Intervals (Intervalle)",
          intensity: "Intervals",
          lacRange: `> ${ansVal.toFixed(1)}`,
          speedMin: dickhuthSpeed * 1.06,
          speedMax: Math.max(dickhuthSpeed * 1.15, maxSpeed),
          hrMin: dickhuthHr * 1.05,
          hrMax: Math.max(dickhuthHr * 1.10, maxHr)
        }
      ];

      // Formatted names
      const athleteName = `${athlete.first_name || ""} ${athlete.last_name || ""}`.trim();
      const athleteDob = athlete.date_of_birth ? format(new Date(athlete.date_of_birth), "dd.MM.yyyy") : "N/A";
      const testDateFormatted = format(new Date(testData.test_date), "dd.MM.yyyy");

      // Build PDF pages (A4 size styled HTML)
      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed;
        top: -99999px;
        left: -99999px;
        width: 794px;
        z-index: -1;
        background: #ffffff;
        color: #000000;
        pointer-events: none;
        box-sizing: border-box;
      `;

      const reportHtml = `
        <style>
          .pdf-page {
            width: 794px;
            height: 1123px;
            padding: 60px;
            box-sizing: border-box;
            background: #ffffff;
            color: #0c0a09;
            position: relative;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .pdf-header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .pdf-logo {
            font-weight: 800;
            font-size: 14px;
            letter-spacing: 2px;
            color: #0f172a;
          }
          .pdf-title-sub {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .pdf-content {
            flex-grow: 1;
            padding: 40px 0;
          }
          .pdf-footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #94a3b8;
          }
          .main-title {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 50px;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .test-date-label {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 40px;
          }
          .info-box {
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 30px;
          }
          .info-box-title {
            font-weight: 700;
            font-size: 16px;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          .info-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 16px;
            font-size: 12px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px dashed #e2e8f0;
          }
          .info-label {
            font-weight: 600;
            color: #475569;
          }
          .info-value {
            font-weight: 700;
            color: #0f172a;
          }
          .section-heading {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 24px;
            margin-bottom: 12px;
            text-transform: uppercase;
            border-left: 4px solid #10b981;
            padding-left: 8px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 10px;
            margin-bottom: 20px;
          }
          .data-table th {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: 700;
            text-align: center;
            padding: 10px 8px;
            border: 1px solid #475569;
            text-transform: uppercase;
          }
          .data-table td {
            padding: 8px;
            border: 1px solid #cbd5e1;
            text-align: center;
          }
          .data-table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .metrics-summary-box {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 20px;
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 16px;
            font-size: 11px;
            margin-bottom: 20px;
          }
          .text-explanation {
            font-size: 10px;
            color: #64748b;
            line-height: 1.5;
          }
        </style>

        <!-- PAGE 1: TITLE & ATHLETE GENERAL INFO -->
        <div class="pdf-page">
          <div class="pdf-header">
            <span class="pdf-logo">KIO-X SPORT & MEDICINE</span>
            <span class="pdf-title-sub">Diagnostic Lab Report</span>
          </div>
          <div class="pdf-content" style="display: flex; flex-direction: column; justify-content: center; align-items: stretch;">
            <div style="text-align: center;">
              <h1 class="main-title">Performance Diagnostics</h1>
              <div class="test-date-label">Test Date: ${testDateFormatted}</div>
            </div>
            
            <div class="info-box">
              <div class="info-box-title">Evaluation for:</div>
              <div class="info-grid">
                <div class="info-row" style="grid-column: span 2;">
                  <span class="info-label">Name:</span>
                  <span class="info-value" style="font-size: 14px;">${athleteName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Age:</span>
                  <span class="info-value">${calculateAge(athlete.date_of_birth)} (${athleteDob})</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Weight:</span>
                  <span class="info-value">${athlete.weight || "0.0"} kg</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Height:</span>
                  <span class="info-value">${athlete.height || "0.0"} cm</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Calculated BMI:</span>
                  <span class="info-value">
                    ${(athlete.height > 0 && athlete.weight > 0) 
                      ? (athlete.weight / Math.pow(athlete.height / 100, 2)).toFixed(1) 
                      : "0.0"} kg/m²
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Body Fat %:</span>
                  <span class="info-value">N/A</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Test Method:</span>
                  <span class="info-value">${testData.test_method}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Temperature:</span>
                  <span class="info-value">${testData.temperature || "0.0"} °C</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Incline %:</span>
                  <span class="info-value">${testData.incline_percent || "0"}%</span>
                </div>
                <div class="info-row" style="grid-column: span 2;">
                  <span class="info-label">Tester:</span>
                  <span class="info-value">${testData.tester_name || "Unassigned"}</span>
                </div>
                <div class="info-row" style="grid-column: span 2; border-bottom: none; flex-direction: column; align-items: flex-start; margin-top: 10px;">
                  <span class="info-label" style="margin-bottom: 4px;">Notes:</span>
                  <span class="info-value" style="font-weight: 500; color: #334155; font-style: italic;">
                    ${testData.notes || "No special comments."}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="pdf-footer">
            <span>KIO-X Athlete Assessment Diagnostics</span>
            <span>Page 1 of 3</span>
            <span>${athleteName} (${calculateAge(athlete.date_of_birth)}) ${testDateFormatted}</span>
          </div>
        </div>

        <!-- PAGE 2: TEST STAGES & DATA -->
        <div class="pdf-page">
          <div class="pdf-header">
            <span class="pdf-logo">KIO-X SPORT & MEDICINE</span>
            <span class="pdf-title-sub">Step Test Telemetry</span>
          </div>
          <div class="pdf-content">
            <div class="section-heading">Step Test Measured Data</div>
            <p style="font-size: 11px; color: #475569; margin-top: 0; margin-bottom: 16px;">
              The following metrics were recorded during the incremental step protocol:
            </p>

            <div class="metrics-summary-box">
              <div>
                <strong>Resting Lactate:</strong> ${restLac.toFixed(2)} mmol/l
              </div>
              <div>
                <strong>Resting Heart Rate:</strong> ${restHr} bpm
              </div>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Speed (km/h)</th>
                  <th>Time (Duration)</th>
                  <th>Lactate (mmol/l)</th>
                  <th>Heart Rate (bpm)</th>
                </tr>
              </thead>
              <tbody>
                ${stages.map(s => `
                  <tr>
                    <td><strong>${s.stage}</strong></td>
                    <td>${s.speed_kmh !== null ? s.speed_kmh.toFixed(1) : "-"}</td>
                    <td>${s.time || "-"}</td>
                    <td>${s.lactate_mmol !== null ? s.lactate_mmol.toFixed(2) : "-"}</td>
                    <td>${s.heart_rate !== null ? s.heart_rate : "-"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="section-heading">Recovery Telemetry</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Recovery Lactate</strong></td>
                  <td>${testData.recovery_lactate !== null ? `${parseFloat(testData.recovery_lactate).toFixed(2)} mmol/l` : "Not measured"}</td>
                </tr>
                <tr>
                  <td><strong>Recovery Heart Rate</strong></td>
                  <td>${testData.recovery_hr !== null ? `${testData.recovery_hr} bpm` : "Not measured"}</td>
                </tr>
                <tr>
                  <td><strong>Recovery Time</strong></td>
                  <td>${testData.recovery_time || "Not measured"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pdf-footer">
            <span>KIO-X Athlete Assessment Diagnostics</span>
            <span>Page 2 of 3</span>
            <span>${athleteName} (${calculateAge(athlete.date_of_birth)}) ${testDateFormatted}</span>
          </div>
        </div>

        <!-- PAGE 3: ANALYSIS RESULTS & TRAINING ZONES -->
        <div class="pdf-page">
          <div class="pdf-header">
            <span class="pdf-logo">KIO-X SPORT & MEDICINE</span>
            <span class="pdf-title-sub">Lactate Analysis Results</span>
          </div>
          <div class="pdf-content">
            <div class="section-heading">Analysis Thresholds</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Threshold</th>
                  <th>Lactate (mmol/l)</th>
                  <th>HR (bpm)</th>
                  <th>Speed (km/h)</th>
                  <th>1000m Pace</th>
                  <th>Marathon Time</th>
                  <th>Max Performance</th>
                </tr>
              </thead>
              <tbody>
                ${thresholdRows.map(row => `
                  <tr>
                    <td style="text-align: left; padding-left: 12px;"><strong>${row.name}</strong></td>
                    <td>${row.lactate.toFixed(2)}</td>
                    <td>${row.hr > 0 ? row.hr : "-"}</td>
                    <td>${row.speed > 0 ? row.speed.toFixed(1) : "-"}</td>
                    <td>${row.speed > 0 ? getPaceFromSpeed(row.speed) : "-"}</td>
                    <td>${row.speed > 0 ? getMarathonTimeFromSpeed(row.speed) : "-"}</td>
                    <td>${row.speed > 0 ? `${((row.speed / (maxSpeed || 1)) * 100).toFixed(1)}%` : "-"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="section-heading">Recommended Training Zones</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Training Zone</th>
                  <th>Intensity</th>
                  <th>Lactate Range</th>
                  <th>Heart Rate Range</th>
                  <th>Speed Range</th>
                  <th>1000m Pace</th>
                </tr>
              </thead>
              <tbody>
                ${zoneRows.map(z => `
                  <tr>
                    <td style="text-align: left; padding-left: 12px;"><strong>${z.name}</strong></td>
                    <td>${z.intensity}</td>
                    <td>${z.lacRange}</td>
                    <td>${Math.round(z.hrMin)} - ${Math.round(z.hrMax)} bpm</td>
                    <td>${z.speedMin.toFixed(1)} - ${z.speedMax.toFixed(1)} km/h</td>
                    <td>${getPaceFromSpeed(z.speedMax)} - ${getPaceFromSpeed(z.speedMin)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="text-explanation">
              <strong>Understanding the training zones:</strong><br>
              - <strong>Active Recovery (EL/AL)</strong>: Extremely light load focusing on active recovery, promoting blood circulation and muscle repair.<br>
              - <strong>Basic Endurance 1 (GA1)</strong>: Aerobic base development. Enhances fat metabolism and cardiovascular efficiency.<br>
              - <strong>Basic Endurance 2 (GA2)</strong>: Moderate load. Develops aerobic capacity, muscular endurance, and glycolytic efficiency.<br>
              - <strong>Threshold Training (Wettkampf)</strong>: Anaerobic threshold training. Enhances the body's ability to buffer and remove lactate under stress.<br>
              - <strong>Anaerobic Intervals (Intervalle)</strong>: High-intensity anaerobic intervals. Develops maximal oxygen uptake (VO2 max) and peak velocity.
            </div>
          </div>
          <div class="pdf-footer">
            <span>KIO-X Athlete Assessment Diagnostics</span>
            <span>Page 3 of 3</span>
            <span>${athleteName} (${calculateAge(athlete.date_of_birth)}) ${testDateFormatted}</span>
          </div>
        </div>
      `;

      container.innerHTML = reportHtml;
      document.body.appendChild(container);

      // Wait to render
      await new Promise(r => setTimeout(r, 1000));

      const pages = Array.from(container.querySelectorAll(".pdf-page")) as HTMLElement[];
      const pdf = new jsPDF({ unit: "px", format: [794, 1123], orientation: "portrait", hotfixes: ["px_scaling"] });

      for (let i = 0; i < pages.length; i++) {
        const canvas = await h2c(pages[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 794,
          height: 1123,
          windowWidth: 794,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) pdf.addPage([794, 1123], "portrait");
        pdf.addImage(imgData, "JPEG", 0, 0, 794, 1123);
      }

      const safeFilename = `${athlete.last_name || ""}_${athlete.first_name || ""}_VL4_Lab_Report_${testData.test_date}.pdf`.replace(/[\s,]+/g, "_");
      pdf.save(safeFilename);

      document.body.removeChild(container);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      alert(`Failed to generate PDF: ${err.message || err}`);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl space-y-6">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">VL4 Lab Report Downloader</h2>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Select scheduled training sessions or curriculum items to view their rosters and download player lactate diagnostics reports as PDFs in English.
          </p>
        </div>

        {/* Selection options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Select Data Source</label>
            <div className="flex bg-bg-primary border border-border-primary/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSourceType("scheduled")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  sourceType === "scheduled"
                    ? "bg-[var(--accent-green)]/10 text-[var(--accent-green)] font-black"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Scheduled Sessions
              </button>
              <button
                type="button"
                onClick={() => setSourceType("curriculum")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  sourceType === "curriculum"
                    ? "bg-[var(--accent-green)]/10 text-[var(--accent-green)] font-black"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Curriculum Activities
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Select Activity / Session</label>
            {loadingSessions ? (
              <div className="h-10 flex items-center px-4 bg-bg-primary border border-border-primary/50 rounded-xl">
                <Loader2 className="animate-spin text-accent-green mr-2" size={14} />
                <span className="text-xs text-text-muted">Loading activities...</span>
              </div>
            ) : (
              <select
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-2 px-3 text-xs text-text-primary focus:border-accent-green outline-none font-semibold"
              >
                <option value="">Select activity...</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.scheduled_date}] {s.title} ({s.session_type})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {selectedSessionId && (
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
            <Users size={16} className="text-accent-green" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Participating Athletes</h3>
          </div>

          {loadingRoster ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-accent-green" size={24} />
              <span className="text-[10px] text-text-secondary uppercase tracking-widest animate-pulse font-bold">
                Loading Roster Lab Tests...
              </span>
            </div>
          ) : assignedAthletes.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted font-medium">
              No athletes are assigned to this session.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedAthletes.map(athlete => {
                const test = labTests[athlete.id];
                const hasTestData = !!test;
                const athleteName = `${athlete.first_name || ""} ${athlete.last_name || ""}`.trim();
                const isGenerating = generatingPdfId === athlete.id;

                return (
                  <div
                    key={athlete.id}
                    className="p-4 bg-bg-primary/50 border border-border-primary/50 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white uppercase tracking-wide">{athleteName}</div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-text-muted">
                        <span>Age: {calculateAge(athlete.date_of_birth)}</span>
                        <span>•</span>
                        <span>
                          {hasTestData ? (
                            <span className="text-accent-green font-black">TEST LOGGED ({test.test_method})</span>
                          ) : (
                            <span className="text-red-500/80">NO LAB TEST</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      {hasTestData ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(athlete, test)}
                          disabled={isGenerating}
                          className="flex items-center gap-2 px-3 py-1.5 bg-accent-green/10 border border-accent-green/20 hover:bg-accent-green hover:text-black rounded-xl text-[10px] font-black text-accent-green transition-all active-scale"
                        >
                          {isGenerating ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            <Download size={12} />
                          )}
                          DOWNLOAD PDF
                        </button>
                      ) : (
                        <span className="text-[9px] text-text-muted font-black uppercase tracking-widest bg-white/5 px-2 py-1.5 rounded-lg">
                          N/A
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
