-- 1. Extend coach_availability with session parameters
ALTER TABLE public.coach_availability
ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 1;

-- 2. Link training_sessions to coaches
ALTER TABLE public.training_sessions
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.profiles(id);

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_id ON public.training_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_date ON public.training_sessions(coach_id, scheduled_date);

-- 4. Update session_bookings UNIQUE constraint to handle session-based logic better
-- This ensures an athlete can't book the same session twice
ALTER TABLE public.session_bookings DROP CONSTRAINT IF EXISTS session_bookings_session_id_athlete_id_status_key;
ALTER TABLE public.session_bookings ADD CONSTRAINT session_bookings_session_id_athlete_id_status_key 
UNIQUE(session_id, athlete_id, status);

-- 5. RLS Policy for Profiles
-- Allow all authenticated users to view staff profiles (needed for booking)
DROP POLICY IF EXISTS "Public can view staff profiles" ON public.profiles;
CREATE POLICY "Public can view staff profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (role = 'staff' OR id = auth.uid());

-- 6. RLS Policy for Training Sessions (On-Demand)
-- Allow authenticated users to create and view sessions (needed for the dynamic booking system)
DROP POLICY IF EXISTS "Authenticated users can create on-demand sessions" ON public.training_sessions;
CREATE POLICY "Authenticated users can create on-demand sessions"
ON public.training_sessions FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view all sessions" ON public.training_sessions;
CREATE POLICY "Authenticated users can view all sessions"
ON public.training_sessions FOR SELECT
TO authenticated
USING (true);
