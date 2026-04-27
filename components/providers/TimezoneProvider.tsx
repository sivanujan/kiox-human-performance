"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

interface TimezoneContextType {
  userTimezone: string;
  userCountry: string | null;
  userCountryCode: string | null;
  isDetecting: boolean;
  setTimezone: (tz: string, source?: 'auto' | 'manual') => Promise<void>;
}

const TimezoneContext = createContext<TimezoneContextType>({
  userTimezone: 'UTC',
  userCountry: null,
  userCountryCode: null,
  isDetecting: true,
  setTimezone: async () => {},
});

export const useTimezoneContext = () => useContext(TimezoneContext);

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [userTimezone, setUserTimezone] = useState('UTC');
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [userCountryCode, setUserCountryCode] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    async function initTimezone() {
      try {
        // 1. If profile has a timezone, use it
        if (profile?.timezone) {
          setUserTimezone(profile.timezone);
          setUserCountry(profile.country || null);
          setUserCountryCode(profile.country_code || null);
          setIsDetecting(false);
          return;
        }

        // 2. Try localStorage as fallback
        const stored = localStorage.getItem('user_timezone');
        if (stored) {
          setUserTimezone(stored);
          setIsDetecting(false);
          // If logged in but no TZ in DB, sync it
          if (user) {
            syncWithDB(stored);
          }
          return;
        }

        // 3. Detect from Browser (Most accurate for current device)
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (browserTz) {
          setUserTimezone(browserTz);
          setIsDetecting(false);
          
          // Optionally still fetch IP info for country/code but don't let it override the browser TZ
          fetch('/api/detect-timezone')
            .then(res => res.json())
            .then(data => {
              if (data.country) setUserCountry(data.country);
              if (data.country_code) setUserCountryCode(data.country_code);
              if (user) syncWithDB(browserTz, data.country, data.country_code);
            })
            .catch(() => {});
          
          return;
        }

        // 4. Fallback to IP if browser API fails
        const res = await fetch('/api/detect-timezone');
        const data = await res.json();
        if (data.timezone) {
          setUserTimezone(data.timezone);
          setUserCountry(data.country || null);
          setUserCountryCode(data.country_code || null);
          if (user) await syncWithDB(data.timezone, data.country, data.country_code);
        }
      } catch (err) {
        console.error('Timezone initialization error:', err);
      } finally {
        setIsDetecting(false);
      }
    }

    initTimezone();
  }, [user, profile]);

  const syncWithDB = async (tz: string, country?: string, code?: string, source: 'auto' | 'manual' = 'auto') => {
    try {
      await fetch('/api/user/timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: tz, country, country_code: code, source })
      });
    } catch (e) {
      console.error('Failed to sync timezone with DB:', e);
    }
  };

  const setTimezone = async (tz: string, source: 'auto' | 'manual' = 'manual') => {
    setUserTimezone(tz);
    localStorage.setItem('user_timezone', tz);
    if (user) {
      await syncWithDB(tz, undefined, undefined, source);
    }
  };

  return (
    <TimezoneContext.Provider value={{ userTimezone, userCountry, userCountryCode, isDetecting, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}
