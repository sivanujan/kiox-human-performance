-- KIO-X PERSISTENCE & SECURITY FIX
-- Run this in your Supabase SQL Editor to enable real-time dashboard updates

-- 1. ADD PERFORMANCE & MATCH COLUMNS TO PROFILES
-- Ensures the dashboard has "Live" slots to display entries
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS top_speed NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS distance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sprints INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS goals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assists INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS xg NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pass_accuracy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duels_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pressures INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vo2_max NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS power_output NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS hrv INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resting_hr INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS protocol_directives TEXT DEFAULT 'SUBJECT PROTOCOL NEUTRAL // NO DIRECTIVES FOUND',
ADD COLUMN IF NOT EXISTS last_intensity INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS last_duration INTEGER DEFAULT 60;

-- 2. UNLOCK PROFILE UPDATES FOR STAFF
-- Currently, only the owner can update their profile. 
-- Coaches/Admins need permission to update athlete metrics.
DROP POLICY IF EXISTS "Staff can update athlete profiles" ON public.profiles;

CREATE POLICY "Staff can update athlete profiles" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('staff', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('staff', 'superadmin')
  )
);

-- 3. UNLOCK PERFORMANCE LOGS FOR STAFF
DROP POLICY IF EXISTS "Staff can manage performance" ON public.performance_logs;
CREATE POLICY "Staff can manage performance" 
ON public.performance_logs FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin'))
);

-- 4. UNLOCK MATCH STATS FOR STAFF
DROP POLICY IF EXISTS "Staff can manage all match stats" ON public.match_stats;
CREATE POLICY "Staff can manage all match stats" 
ON public.match_stats FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin'))
);
