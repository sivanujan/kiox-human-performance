"use client";

import React, { useState } from "react";
import { Calendar, Download, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { createClient } from "@/utils/supabase/client";

interface DownloadSchedulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminRedirectPath: string; // "/admin/curriculum" or "/staff/curriculum"
}

export default function DownloadSchedulesModal({
  isOpen,
  onClose,
  adminRedirectPath
}: DownloadSchedulesModalProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const today = new Date();
  const tomorrow = addDays(today, 1);

  const fetchSessionsForDate = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("scheduled_date", dateStr)
      .eq("is_curriculum", true)
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data || [];
  };

  const fetchCoaches = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["staff", "superadmin"]);

    if (error) throw error;
    return data || [];
  };

  const printDailySchedule = async (date: Date) => {
    setLoading(true);
    try {
      const [sessions, coaches] = await Promise.all([
        fetchSessionsForDate(date),
        fetchCoaches()
      ]);

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow pop-ups to print the schedule.");
        return;
      }

      const dateLabel = format(date, "eeee, MMMM dd, yyyy");
      const generatedTime = format(new Date(), "dd.MM.yyyy HH:mm");

      let sessionsHtml = "";
      if (sessions.length === 0) {
        sessionsHtml = `
          <div class="no-sessions">
            No training sessions or curriculum items scheduled for this date.
          </div>
        `;
      } else {
        sessionsHtml = `
          <div class="timeline-container">
            ${sessions.map((s: any) => {
              const coach = coaches.find((c: any) => c.id === s.coach_id);
              const coachName = coach ? `${coach.first_name} ${coach.last_name || ""}` : "Unassigned";
              
              let catClass = "";
              if (s.session_type === "STRENGTH") catClass = "strength";
              else if (s.session_type === "CONDITIONING") catClass = "conditioning";
              else if (s.session_type === "RECOVERY") catClass = "recovery";
              else if (s.session_type === "CURFEW") catClass = "curfew";
              else if (s.session_type === "TACTICAL") catClass = "tactical";
              else if (s.session_type === "MEAL") catClass = "meal";
              else if (s.session_type === "LOGISTICS") catClass = "logistics";

              const parts = (s.start_time || "09:00").split(":");
              let h = parseInt(parts[0], 10);
              const m = parseInt(parts[1] || "00", 10);
              const durationMins = Number(s.duration_minutes) || 60;
              const totalStartMins = h * 60 + m;
              const totalEndMins = (totalStartMins + durationMins) % 1440;
              const endHRaw = Math.floor(totalEndMins / 60);
              const endMRaw = totalEndMins % 60;

              const format12hParts = (hour: number, min: number) => {
                const ampm = hour >= 12 ? "PM" : "AM";
                const displayH = hour % 12 || 12;
                const displayM = min.toString().padStart(2, "0");
                return { label: `${displayH}:${displayM}`, ampm, full: `${displayH}:${displayM} ${ampm}` };
              };

              const startTimeObj = format12hParts(h, m);
              const endTimeObj = format12hParts(endHRaw, endMRaw);
              const fullTimeRange = `${startTimeObj.full} - ${endTimeObj.full}`;

              return `
                <div class="timeline-item">
                  <!-- Time Column -->
                  <div class="timeline-time-col">
                    <span class="time-label">${startTimeObj.label} ${startTimeObj.ampm}</span>
                    <span class="time-ampm" style="margin-top:2px; font-size: 11px; color: #64748b;">TO ${endTimeObj.label} ${endTimeObj.ampm}</span>
                  </div>
                  <!-- Timeline Node Column -->
                  <div class="timeline-line-col">
                    <div class="timeline-dot ${catClass}"></div>
                    <div class="timeline-line"></div>
                  </div>
                  <!-- Session Card Column -->
                  <div class="timeline-card-col">
                    <div class="session-card ${catClass}">
                      <div class="card-header">
                        <span class="category-tag ${catClass}">${s.session_type === 'LOGISTICS' ? 'LOGISTICS/GENERAL' : s.session_type}</span>
                        <span class="duration-badge">⏱ ${fullTimeRange} (${s.duration_minutes} MIN)</span>
                      </div>
                      <div class="session-title">${s.title}</div>
                      <div class="session-meta">
                        ${s.location ? `<span>📍 ${s.location}</span>` : ""}
                        <span>👤 Coach: ${coachName}</span>
                      </div>
                      ${s.notes ? `<div class="session-notes">${s.notes}</div>` : ""}
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      }

      const htmlContent = `
        <html>
          <head>
            <title>KIO-X Daily Curriculum - ${dateLabel}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
            <style>
              @media print {
                html, body {
                  background-color: #ffffff !important;
                  color: #0c0a09 !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  height: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: hidden !important;
                }
                .watermark {
                  color: rgba(0, 0, 0, 0.015) !important;
                }
                .container {
                  height: 100% !important;
                  max-height: 98vh !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
              
              @page {
                size: A4 portrait;
                margin: 8mm 10mm 8mm 10mm;
              }

              * {
                box-sizing: border-box;
                font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
              }

              body {
                background-color: #ffffff;
                background-image: radial-gradient(#e2e8f0 1.5px, transparent 1.5px);
                background-size: 24px 24px;
                color: #0c0a09;
                margin: 0;
                padding: 4px;
                position: relative;
                min-height: 98vh;
              }

              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-35deg);
                font-size: 7.5rem;
                font-weight: 900;
                color: rgba(0, 0, 0, 0.015);
                z-index: -1;
                pointer-events: none;
                white-space: nowrap;
                letter-spacing: 12px;
                user-select: none;
              }

              .container {
                max-width: 850px;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 96vh;
              }

              /* HEADER SECTION */
              .header {
                background-color: #121212;
                color: #ffffff;
                padding: 14px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 4px solid #16a34a; /* bold green */
                border-radius: 8px;
                margin-bottom: 14px;
              }

              .header-left {
                display: flex;
                flex-direction: column;
              }

              .logo {
                font-size: 24px;
                font-weight: 900;
                letter-spacing: 2px;
                color: #ffffff;
                line-height: 1;
              }

              .logo span {
                color: #22c55e;
              }

              .subtitle {
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #a3a3a3;
                margin-top: 4px;
              }

              .header-right {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
              }

              .title {
                font-size: 16px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #ffffff;
                line-height: 1;
              }

              .date-label {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #22c55e;
                margin-top: 4px;
              }

              .gen-time {
                font-size: 8px;
                font-weight: 600;
                color: #737373;
                margin-top: 3px;
                letter-spacing: 1px;
              }

              /* TIMELINE CONTAINER & CARDS */
              .timeline-container {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                gap: 2px;
              }

              .timeline-item {
                display: flex;
                position: relative;
                page-break-inside: avoid;
                break-inside: avoid;
              }

              .timeline-time-col {
                width: 80px;
                text-align: right;
                padding-right: 10px;
                padding-top: 8px;
                display: flex;
                flex-direction: column;
                flex-shrink: 0;
              }

              .time-label {
                font-size: 12px;
                font-weight: 900;
                color: #0f172a;
                font-family: monospace;
                line-height: 1.1;
                white-space: nowrap;
              }

              .time-ampm {
                font-size: 9px;
                font-weight: 800;
                color: #64748b;
                text-transform: uppercase;
                margin-top: 2px;
                letter-spacing: 0.5px;
                white-space: nowrap;
              }

              .timeline-line-col {
                width: 24px;
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                flex-shrink: 0;
              }

              .timeline-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background-color: #cbd5e1;
                border: 2px solid #ffffff;
                box-shadow: 0 0 0 2px #cbd5e1;
                margin-top: 10px;
                z-index: 2;
              }

              /* TIMELINE COLOR CODING FOR DOTS */
              .timeline-dot.meal { background-color: #16a34a; box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2); }
              .timeline-dot.strength { background-color: #d97706; box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2); }
              .timeline-dot.tactical { background-color: #2563eb; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2); }
              .timeline-dot.conditioning { background-color: #15803d; box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.2); }
              .timeline-dot.recovery { background-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2); }
              .timeline-dot.curfew { background-color: #dc2626; box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2); }
              .timeline-dot.logistics { background-color: #0284c7; box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2); }

              .timeline-line {
                width: 2px;
                background-color: #cbd5e1;
                position: absolute;
                top: 22px;
                bottom: -15px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1;
              }

              .timeline-item:last-child .timeline-line {
                display: none;
              }

              .timeline-card-col {
                flex-grow: 1;
                padding-bottom: 8px;
                padding-left: 8px;
              }

              /* SESSION CARD DESIGN */
              .session-card {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-left: 5px solid #94a3b8;
                border-radius: 8px;
                padding: 8px 14px;
                display: flex;
                flex-direction: column;
                gap: 5px;
                position: relative;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
              }

              /* LEFT BORDERS */
              .session-card.meal { border-left-color: #16a34a; }
              .session-card.strength { border-left-color: #d97706; }
              .session-card.tactical { border-left-color: #2563eb; }
              .session-card.conditioning { border-left-color: #15803d; }
              .session-card.recovery { border-left-color: #7c3aed; }
              .session-card.curfew { border-left-color: #dc2626; }
              .session-card.logistics { border-left-color: #0284c7; }

              .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }

              /* PILL BADGES */
              .category-tag {
                font-size: 9px;
                font-weight: 800;
                padding: 2px 8px;
                border-radius: 12px;
                text-transform: uppercase;
                color: #ffffff;
                letter-spacing: 0.5px;
                display: inline-block;
              }

              .category-tag.meal { background-color: #16a34a; }
              .category-tag.strength { background-color: #d97706; }
              .category-tag.tactical { background-color: #2563eb; }
              .category-tag.conditioning { background-color: #15803d; }
              .category-tag.recovery { background-color: #7c3aed; }
              .category-tag.curfew { background-color: #dc2626; }
              .category-tag.logistics { background-color: #0284c7; }

              .duration-badge {
                font-size: 8.5px;
                font-weight: 800;
                background-color: #1e293b;
                color: #ffffff;
                padding: 2px 6px;
                border-radius: 4px;
                letter-spacing: 0.5px;
              }

              .session-title {
                font-size: 14px;
                font-weight: 900;
                color: #0f172a;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0;
              }

              .session-meta {
                display: flex;
                gap: 14px;
                font-size: 10.5px;
                font-weight: 700;
                color: #475569;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .session-notes {
                font-size: 10px;
                font-style: italic;
                color: #64748b;
                border-top: 1px dashed #e2e8f0;
                padding-top: 4px;
                margin-top: 2px;
              }

              .no-sessions {
                font-size: 13px;
                color: #64748b;
                text-align: center;
                padding: 40px 0;
                text-transform: uppercase;
                letter-spacing: 2px;
                background: #f8fafc;
                border: 1px dashed #cbd5e1;
                border-radius: 10px;
              }

              /* FOOTER SECTION */
              .footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #64748b;
                border-top: 2px solid #1e293b;
                padding-top: 8px;
                margin-top: 8px;
              }

              .footer-logo {
                font-weight: 900;
                color: #0f172a;
                margin-right: 6px;
              }

              .footer-logo span {
                color: #16a34a;
              }

              .footer-left {
                display: flex;
                align-items: center;
              }
            </style>
          </head>
          <body>
            <div class="watermark">CONFIDENTIAL</div>
            <div class="container">
              <div class="header">
                <div class="header-left">
                  <div class="logo">KIO<span>-</span>X</div>
                  <div class="subtitle">KIO-X Performance Center</div>
                </div>
                <div class="header-right">
                  <div class="title">Daily Curriculum</div>
                  <div class="date-label">${dateLabel}</div>
                  <div class="gen-time">GENERATED: ${generatedTime}</div>
                </div>
              </div>

              <div class="sessions-list">
                ${sessionsHtml}
              </div>

              <div class="footer">
                <div class="footer-left">
                  <span class="footer-logo">KIO<span>-</span>X</span>
                  <span>KIO-X PERFORMANCE CENTER | CONFIDENTIAL</span>
                </div>
                <div>OFFICIAL DAILY CURRICULUM</div>
                <div>Page 1 of 1</div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

    } catch (err) {
      console.error("Error generating daily PDF:", err);
      alert("Failed to generate PDF.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex justify-between items-center border-b border-[var(--border-primary)] pb-4">
          <div>
            <h3 className="text-sm font-black text-[var(--accent-green)] uppercase tracking-[3px]">Curriculum</h3>
            <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Download operational curriculum lists</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          {/* Download Today's Curriculum */}
          <button
            onClick={() => {
              printDailySchedule(today);
            }}
            disabled={loading}
            className="w-full py-4 bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all active-scale shadow-[0_4px_12px_rgba(34,197,94,0.15)] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download size={14} />
                Download Today's Curriculum
              </>
            )}
          </button>

          {/* Download Tomorrow's Curriculum */}
          <button
            onClick={() => {
              printDailySchedule(tomorrow);
            }}
            disabled={loading}
            className="w-full py-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-green)]/30 hover:bg-[var(--accent-green)]/5 text-[var(--text-primary)] font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all active-scale disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download size={14} className="text-[var(--accent-green)]" />
                Download Tomorrow's Curriculum
              </>
            )}
          </button>
        </div>

        <div className="border-t border-[var(--border-primary)] pt-4 text-center">
          <a
            href={adminRedirectPath}
            className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent-green)] transition-all flex items-center justify-center gap-1.5"
          >
            <Calendar size={12} />
            Go to Full Curriculum Calendar →
          </a>
        </div>
      </div>
    </div>
  );
}
