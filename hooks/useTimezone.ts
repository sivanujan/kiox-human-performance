"use client";

import { useTimezoneContext } from '@/components/providers/TimezoneProvider';
import { 
  convertTime, 
  convertTimeOnly, 
  getCurrentTimeIn, 
  getFriendlyTimezone, 
  getTimeDifference,
  isDifferentTimezone 
} from '@/lib/timezone';

export function useTimezone() {
  const { 
    userTimezone, 
    userCountry, 
    userCountryCode, 
    isDetecting, 
    setTimezone 
  } = useTimezoneContext();

  return {
    userTimezone,
    userCountry,
    userCountryCode,
    isDetecting,
    setTimezone,
    
    // Helpers
    formatToLocal: (date: string, time: string, coachTz: string = 'UTC') => 
      convertTime(date, time, coachTz, userTimezone),
      
    formatTimeOnly: (time: string, coachTz: string = 'UTC') => 
      convertTimeOnly(time, coachTz, userTimezone),
      
    getCurrentLocalTime: () => getCurrentTimeIn(userTimezone),
    
    getFriendlyLabel: (tz?: string) => getFriendlyTimezone(tz || userTimezone),
    
    getDiffLabel: (coachTz: string) => getTimeDifference(userTimezone, coachTz),
    
    isMismatch: (coachTz: string) => isDifferentTimezone(userTimezone, coachTz)
  };
}
