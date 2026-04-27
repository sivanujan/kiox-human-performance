-- Timezone Support System Migration

-- 1. Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS timezone_detected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS timezone_source TEXT DEFAULT 'auto' CHECK (timezone_source IN ('auto', 'manual'));

-- 2. Update training_sessions table
ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS coach_timezone TEXT DEFAULT 'UTC';

-- 3. Update session_bookings table
ALTER TABLE public.session_bookings 
ADD COLUMN IF NOT EXISTS athlete_timezone TEXT,
ADD COLUMN IF NOT EXISTS session_time_athlete_local TEXT;

-- 4. Update coach_availability table
ALTER TABLE public.coach_availability 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Refresh Realtime (Handled by Supabase Dashboard usually, but keeping comment for reference)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
