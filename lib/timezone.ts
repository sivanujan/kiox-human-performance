/**
 * Timezone Utility Functions
 */

// Helper to parse "GMT+5:30" or "GMT-8" into minutes
function parseOffsetToMinutes(offsetPart: string): number {
  const match = offsetPart.match(/([+-])(\d+)(?::(\d+))?/);
  if (match) {
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2]);
    const minutes = parseInt(match[3] || '0');
    return sign * (hours * 60 + minutes);
  }
  return 0;
}

// Helper to get offset minutes for a timezone at a specific date
function getOffsetMinutesFor(timezone: string, date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset'
  }).formatToParts(date);
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+0';
  return parseOffsetToMinutes(offsetPart);
}

// Get current time in any timezone
export function getCurrentTimeIn(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch (e) {
    return '00:00';
  }
}

// Convert a time from one timezone to another
export function convertTime(
  dateString: string,
  timeString: string,
  fromTimezone: string,
  toTimezone: string
): string {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create a date object. Note: month is 0-indexed in JS Date
    const baseDate = new Date(year, month - 1, day, hours, minutes);
    
    // Find the offset difference between fromTimezone and UTC
    const fromOffset = getOffsetMinutesFor(fromTimezone, baseDate);
    
    // Create UTC date: Subtract the offset from the local time to get UTC
    // e.g. 10:00 AM GMT-4 -> 10:00 - (-4) = 14:00 UTC
    const utcDate = new Date(baseDate.getTime() - (fromOffset * 60 * 1000));

    // Format in target timezone
    return new Intl.DateTimeFormat('en-US', {
      timeZone: toTimezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(utcDate);
  } catch (e) {
    console.error('convertTime error:', e);
    return `${dateString} ${timeString}`;
  }
}

// Convert time only (no date)
export function convertTimeOnly(
  timeString: string,
  fromTimezone: string,
  toTimezone: string
): string {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    
    // We use today as a reference date for DST purposes
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    // Get offset of source timezone
    const fromOffset = getOffsetMinutesFor(fromTimezone, baseDate);
    
    // Calculate UTC time
    const utcDate = new Date(baseDate.getTime() - (fromOffset * 60 * 1000));

    return new Intl.DateTimeFormat('en-US', {
      timeZone: toTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(utcDate);
  } catch (e) {
    console.error('convertTimeOnly error:', e);
    return timeString;
  }
}

// Get timezone offset label e.g. "GMT+5:30"
export function getOffsetLabel(timezone: string): string {
  try {
    const date = new Date();
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).format(date);

    const parts = formatted.split(' ');
    return parts[parts.length - 1];
  } catch (e) {
    return 'GMT';
  }
}

// Get friendly timezone display e.g. "Colombo (GMT+5:30)"
export function getFriendlyTimezone(timezone: string): string {
  const city = timezone.split('/')[1]?.replace(/_/g, ' ') || timezone;
  const offset = getOffsetLabel(timezone);
  return `${city} (${offset})`;
}

// Check if two timezones are different
export function isDifferentTimezone(timezone1: string, timezone2: string): boolean {
  return timezone1 !== timezone2;
}

// Get time difference label e.g. "+3 hours from you"
export function getTimeDifference(userTimezone: string, coachTimezone: string): string {
  try {
    const now = new Date();

    const userOffset = new Date(
      now.toLocaleString('en-US', { timeZone: userTimezone })
    ).getTime();

    const coachOffset = new Date(
      now.toLocaleString('en-US', { timeZone: coachTimezone })
    ).getTime();

    const diffHours = Math.round((coachOffset - userOffset) / (1000 * 60 * 60));

    if (diffHours === 0) return 'Same timezone as you';
    if (diffHours > 0) return `+${diffHours}h from your time`;
    return `${diffHours}h from your time`;
  } catch (e) {
    return 'Timezone mismatch';
  }
}

// Expose a function to get all supported timezones sorted by offset
export function getFullTimezoneList() {
  try {
    const timezones = (Intl as any).supportedValuesOf('timeZone') || [
      'UTC', 'Asia/Colombo', 'Asia/Kolkata', 'Asia/Tokyo', 'Europe/London', 
      'Europe/Berlin', 'America/New_York', 'America/Los_Angeles'
    ];

    const now = new Date();
    
    return timezones.map((tz: string) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'shortOffset'
      }).formatToParts(now);
      
      const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+0';
      const offsetMinutes = parseOffsetToMinutes(offsetPart);

      // Get city name from TZ string
      const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
      const region = tz.split('/')[0];

      // Check if this TZ exists in our curated list to get country info
      const curated = TIMEZONE_LIST.find(t => t.value === tz);

      return {
        value: tz,
        label: `${city} (${offsetPart})`,
        region: region,
        offset: offsetMinutes,
        displayOffset: offsetPart,
        country: curated?.country || region,
        code: curated?.code || ''
      };
    }).sort((a: any, b: any) => a.offset - b.offset);
  } catch (e) {
    return TIMEZONE_LIST;
  }
}

// Curated list for quick selection
export const TIMEZONE_LIST = [
  // Curated list stays for compatibility but we'll prefer getFullTimezoneList in the new UI
  { label: 'Sri Lanka (GMT+5:30)', value: 'Asia/Colombo', country: 'Sri Lanka', code: 'LK' },
  { label: 'India (GMT+5:30)', value: 'Asia/Kolkata', country: 'India', code: 'IN' },
  { label: 'Pakistan (GMT+5)', value: 'Asia/Karachi', country: 'Pakistan', code: 'PK' },
  { label: 'UAE (GMT+4)', value: 'Asia/Dubai', country: 'United Arab Emirates', code: 'AE' },
  { label: 'Japan (GMT+9)', value: 'Asia/Tokyo', country: 'Japan', code: 'JP' },
  { label: 'Germany (CET/CEST)', value: 'Europe/Berlin', country: 'Germany', code: 'DE' },
  { label: 'UK (GMT/BST)', value: 'Europe/London', country: 'United Kingdom', code: 'GB' },
  { label: 'France (CET/CEST)', value: 'Europe/Paris', country: 'France', code: 'FR' },
  { label: 'Spain (CET/CEST)', value: 'Europe/Madrid', country: 'Spain', code: 'ES' },
  { label: 'New York (EST/EDT)', value: 'America/New_York', country: 'United States', code: 'US' },
  { label: 'Los Angeles (PST/PDT)', value: 'America/Los_Angeles', country: 'United States', code: 'US' },
  { label: 'Chicago (CST/CDT)', value: 'America/Chicago', country: 'United States', code: 'US' },
  { label: 'Toronto (EST/EDT)', value: 'America/Toronto', country: 'Canada', code: 'CA' },
  { label: 'Sao Paulo (BRT)', value: 'America/Sao_Paulo', country: 'Brazil', code: 'BR' },
  { label: 'Lagos (WAT)', value: 'Africa/Lagos', country: 'Nigeria', code: 'NG' },
  { label: 'Nairobi (EAT)', value: 'Africa/Nairobi', country: 'Kenya', code: 'KE' },
  { label: 'Johannesburg (SAST)', value: 'Africa/Johannesburg', country: 'South Africa', code: 'ZA' },
  { label: 'Cairo (EET)', value: 'Africa/Cairo', country: 'Egypt', code: 'EG' },
  { label: 'Accra (GMT)', value: 'Africa/Accra', country: 'Ghana', code: 'GH' },
  { label: 'Dakar (GMT)', value: 'Africa/Dakar', country: 'Senegal', code: 'SN' },
  { label: 'Sydney (AEST/AEDT)', value: 'Australia/Sydney', country: 'Australia', code: 'AU' },
  { label: 'UTC (GMT+0)', value: 'UTC', country: 'Universal', code: 'UN' },
];
