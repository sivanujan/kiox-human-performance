"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to calculate if a coach is currently online based on their schedule
 * @param {Array} schedule - Array of day schedule objects
 * @returns {Object} { isOnline, todaySchedule }
 */
export function useOnlineStatus(schedule = []) {
  const [isOnline, setIsOnline] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState(null);

  const checkStatus = () => {
    if (!schedule || schedule.length === 0) {
      setIsOnline(false);
      setTodaySchedule(null);
      return;
    }

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[now.getDay()];
    const currentTimeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');

    const today = schedule.find(s => s.day_name === currentDayName);
    setTodaySchedule(today);

    if (!today || !today.is_working) {
      setIsOnline(false);
      return;
    }

    const isCurrent = currentTimeStr >= today.start_time && currentTimeStr <= today.end_time;
    setIsOnline(isCurrent);
  };

  useEffect(() => {
    checkStatus();
    
    // Refresh status every 60 seconds
    const interval = setInterval(checkStatus, 60000);
    
    return () => clearInterval(interval);
  }, [schedule]);

  return { isOnline, todaySchedule };
}
