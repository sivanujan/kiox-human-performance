/**
 * Time utility functions for KIO-X Human Performance Platform.
 * Supports calculating start times, end times, durations, and formatting time ranges.
 */

/**
 * Calculates End Time ("HH:mm") based on Start Time ("HH:mm") and Duration (minutes).
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return "10:00";
  const parts = startTime.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return "10:00";

  const duration = Number(durationMinutes) || 0;
  const totalMins = (h * 60 + m + duration) % 1440;
  const endH = Math.floor(totalMins / 60);
  const endM = totalMins % 60;
  return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
}

/**
 * Calculates Duration (minutes) based on Start Time ("HH:mm") and End Time ("HH:mm").
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 60;
  const sParts = startTime.split(":");
  const eParts = endTime.split(":");
  const sh = parseInt(sParts[0], 10);
  const sm = parseInt(sParts[1], 10);
  const eh = parseInt(eParts[0], 10);
  const em = parseInt(eParts[1], 10);

  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 60;

  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins < startMins) {
    endMins += 1440; // crossed midnight
  }
  const diff = endMins - startMins;
  return diff > 0 ? diff : 60;
}

/**
 * Formats a time string ("HH:mm" or "HH:mm:ss") into 12-hour format "h:mm AM/PM".
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Formats start time and duration into formatted range string e.g. "09:00 AM - 10:00 AM".
 */
export function formatTimeRange(startTime: string, durationMinutes: number): {
  startTimeStr: string;
  endTimeStr: string;
  timeRangeStr: string;
} {
  if (!startTime) return { startTimeStr: "", endTimeStr: "", timeRangeStr: "" };
  const endTime = calculateEndTime(startTime.slice(0, 5), durationMinutes);
  const startTimeStr = formatTime12h(startTime);
  const endTimeStr = formatTime12h(endTime);
  return {
    startTimeStr,
    endTimeStr,
    timeRangeStr: `${startTimeStr} - ${endTimeStr}`
  };
}
