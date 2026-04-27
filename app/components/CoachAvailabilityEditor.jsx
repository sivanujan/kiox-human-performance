"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, Calendar, Check, X, Loader2, Globe } from 'lucide-react';
import { TIMEZONE_LIST, getCurrentTimeIn, getFriendlyTimezone } from '@/lib/timezone';
import TimezoneSearchPicker from '@/components/ui/TimezoneSearchPicker';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CoachAvailabilityEditor({ coach, onSave }) {
  const [schedule, setSchedule] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [maxCapacity, setMaxCapacity] = useState(1);
  const [coachTimezone, setCoachTimezone] = useState('UTC');
  const [coachCountry, setCoachCountry] = useState('');
  const [coachCountryCode, setCoachCountryCode] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => setCurrentTime(getCurrentTimeIn(coachTimezone));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [coachTimezone]);

  useEffect(() => {
    if (coach) {
      // Initialize schedule from coach data or defaults
      const initialSchedule = DAYS.map(day => {
        const existing = coach.schedule?.find(s => s.day_name === day);
        return {
          day_name: day,
          is_working: existing ? existing.is_working : false,
          start_time: existing ? existing.start_time : '09:00',
          end_time: existing ? existing.end_time : '17:00'
        };
      });
      setSchedule(initialSchedule);
      setSessionDuration(coach.availability?.session_duration || 60);
      setMaxCapacity(coach.availability?.max_capacity || 1);
      setCoachTimezone(coach.availability?.timezone || 'UTC');
      setCoachCountry(coach.availability?.country || '');
      setCoachCountryCode(coach.availability?.country_code || '');
    }
  }, [coach]);

  const toggleDay = (dayName) => {
    setSchedule(prev => prev.map(s => 
      s.day_name === dayName ? { ...s, is_working: !s.is_working } : s
    ));
  };

  const updateTime = (dayName, field, value) => {
    setSchedule(prev => prev.map(s => 
      s.day_name === dayName ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const result = await onSave(coach.id, schedule, {
        session_duration: sessionDuration || 60,
        max_capacity: maxCapacity || 1,
        timezone: coachTimezone,
        country: coachCountry,
        country_code: coachCountryCode
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Availability updated successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update availability' });
      }
    } catch (err) {
      console.error('handleSave error:', err);
      setMessage({ type: 'error', text: 'An unexpected error occurred during transmission.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!coach) return (
    <div className="h-full flex items-center justify-center text-gray-500 font-display uppercase tracking-widest text-sm italic">
      Select a coach to edit availability
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#22c55e]/10 pb-4">
        <div>
          <h2 className="font-display text-xl text-white uppercase tracking-wider">
            Edit Availability: <span className="text-[#22c55e]">{coach.first_name} {coach.last_name}</span>
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
            Set working hours and session parameters
          </p>
        </div>
      </div>

      {/* Session Parameters */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-2xl">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">
            Session Duration (Min)
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#22c55e]" size={14} />
            <input 
              type="number" 
              value={sessionDuration || ''}
              onChange={(e) => setSessionDuration(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full bg-black/40 border border-[#22c55e]/20 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-[#22c55e] focus:outline-none transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">
            Max Persons / Slot
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#22c55e]" size={14} />
            <input 
              type="number" 
              value={maxCapacity || ''}
              onChange={(e) => setMaxCapacity(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full bg-black/40 border border-[#22c55e]/20 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-[#22c55e] focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Timezone & Country Registry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">
            Operational Timezone
          </label>
          <div className="relative">
            <TimezoneSearchPicker 
              value={coachTimezone}
              onChange={(val, data) => {
                setCoachTimezone(val);
                if (data) {
                  setCoachCountry(data.country);
                  setCoachCountryCode(data.code);
                }
              }}
            />
          </div>
        </div>

        <div className="bg-[#22c55e]/5 border border-[#22c55e]/10 rounded-xl p-4 flex flex-col justify-center">
          <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Coach Local Time</div>
          <div className="text-xl font-mono font-bold text-[#22c55e] tracking-widest">
            {currentTime} <span className="text-[10px] text-gray-500 ml-2">{coachTimezone.split('/')[1]?.replace('_', ' ')}</span>
          </div>
          <div className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
             Deploy Base: {coachCountry || 'Global Registry'} {coachCountryCode && `[${coachCountryCode}]`}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {schedule.map((day) => (
          <div 
            key={day.day_name}
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
              day.is_working 
                ? 'bg-[#22c55e]/5 border-[#22c55e]/20' 
                : 'bg-black/40 border-white/5 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4 mb-3 sm:mb-0">
              <button 
                onClick={() => toggleDay(day.day_name)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  day.is_working ? 'bg-[#22c55e]' : 'bg-[#333]'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  day.is_working ? 'left-7' : 'left-1'
                }`} />
              </button>
              <span className={`font-display text-sm tracking-widest uppercase ${day.is_working ? 'text-white' : 'text-gray-500'}`}>
                {day.day_name}
              </span>
            </div>

            {day.is_working ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input 
                    type="time" 
                    value={day.start_time}
                    onChange={(e) => updateTime(day.day_name, 'start_time', e.target.value)}
                    className="bg-[#080808] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-[#22c55e] focus:outline-none transition-all"
                  />
                </div>
                <span className="text-gray-600">—</span>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input 
                    type="time" 
                    value={day.end_time}
                    onChange={(e) => updateTime(day.day_name, 'end_time', e.target.value)}
                    className="bg-[#080808] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-[#22c55e] focus:outline-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-4 py-2 bg-black/20 rounded-lg border border-white/5">
                Day Off
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-[#22c55e]/10 space-y-4">
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-center text-xs font-bold uppercase tracking-widest ${
              message.type === 'success' ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-[#22c55e] hover:bg-white text-black font-black uppercase text-sm tracking-[0.2em] rounded-xl transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-3 active-scale"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? 'SAVING...' : 'SAVE AVAILABILITY'}
        </button>

        {coach.availability?.updated_at && (
          <div className="text-center text-[10px] text-gray-600 uppercase tracking-widest">
            Last updated: {new Date(coach.availability.updated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
