-- KIO-X COACH CALENDAR SCHEMA MIGRATION
-- This script creates the `coach_calendar_events` table, sets up RLS policies, and registers it to supabase_realtime.

-- 1. CREATE CALENDAR EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.coach_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    session_type TEXT NOT NULL,
    notes TEXT,
    coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.coach_calendar_events ENABLE ROW LEVEL SECURITY;

-- 3. SELECT POLICY
-- Allowed for authenticated staff, medical, or superadmin users to view all sessions.
DROP POLICY IF EXISTS "Users can view all calendar events" ON public.coach_calendar_events;
CREATE POLICY "Users can view all calendar events" ON public.coach_calendar_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('staff', 'superadmin', 'medical')
  )
);

-- 4. INSERT POLICY
-- - A superadmin can insert any calendar event.
-- - A staff member can insert only if coach_id is themselves.
DROP POLICY IF EXISTS "Staff and admins can insert calendar events" ON public.coach_calendar_events;
CREATE POLICY "Staff and admins can insert calendar events" ON public.coach_calendar_events
FOR INSERT
TO authenticated
WITH CHECK (
  (coach_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff'))
  OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- 5. UPDATE POLICY
-- - A superadmin can update any calendar event.
-- - A staff member can update only if coach_id is themselves.
DROP POLICY IF EXISTS "Staff and admins can update calendar events" ON public.coach_calendar_events;
CREATE POLICY "Staff and admins can update calendar events" ON public.coach_calendar_events
FOR UPDATE
TO authenticated
USING (
  (coach_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff'))
  OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- 6. DELETE POLICY
-- - A superadmin can delete any calendar event.
-- - A staff member can delete only if coach_id is themselves.
DROP POLICY IF EXISTS "Staff and admins can delete calendar events" ON public.coach_calendar_events;
CREATE POLICY "Staff and admins can delete calendar events" ON public.coach_calendar_events
FOR DELETE
TO authenticated
USING (
  (coach_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff'))
  OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- 7. REGISTER TO REALTIME PUBLICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_calendar_events;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
