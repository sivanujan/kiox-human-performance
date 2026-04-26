-- ============================================================
-- KIO-X BOOKING SYSTEM: COMPLETE SETUP SCRIPT
-- Run this ENTIRE script in Supabase SQL Editor (one click)
-- It uses IF NOT EXISTS everywhere so it's safe to re-run
-- ============================================================

-- =====================
-- 1. EXTEND training_sessions
-- =====================
ALTER TABLE public.training_sessions
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 10;

CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_id ON public.training_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_date ON public.training_sessions(coach_id, scheduled_date);

-- =====================
-- 2. COACH AVAILABILITY TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.coach_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    timezone TEXT DEFAULT 'UTC',
    is_online BOOLEAN DEFAULT false,
    session_duration INTEGER DEFAULT 60,
    max_capacity INTEGER DEFAULT 1,
    last_seen TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(coach_id)
);

-- =====================
-- 3. COACH SCHEDULE TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.coach_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_name TEXT NOT NULL CHECK (day_name IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    is_working BOOLEAN DEFAULT false,
    start_time TEXT DEFAULT '09:00',
    end_time TEXT DEFAULT '17:00',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(coach_id, day_name)
);

-- =====================
-- 4. SESSION TEMPLATES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.session_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    title TEXT NOT NULL,
    session_type TEXT CHECK (session_type IN ('STRENGTH', 'TACTICAL', 'CONDITIONING', 'RECOVERY', 'MATCH_PREP', 'CUSTOM')),
    start_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    max_capacity INTEGER DEFAULT 20,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 5. SESSION BOOKINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.session_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    booked_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLISTED', 'NO_SHOW')),
    booking_type TEXT DEFAULT 'SELF' CHECK (booking_type IN ('SELF', 'ADMIN_ASSIGNED')),
    notes TEXT,
    booked_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES public.profiles(id),
    cancellation_reason TEXT
);

-- Add unique constraint if not already there
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'session_bookings_session_id_athlete_id_status_key'
    ) THEN
        ALTER TABLE public.session_bookings 
        ADD CONSTRAINT session_bookings_session_id_athlete_id_status_key 
        UNIQUE(session_id, athlete_id, status);
    END IF;
END $$;

-- =====================
-- 6. ATHLETE NOTIFICATIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.athlete_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'WAITLIST_PROMOTED', 'APPROVAL_REQUIRED', 'BOOKING_REJECTED', 'SESSION_CANCELLED')),
    message TEXT NOT NULL,
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 7. STAFF NOTIFICATIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.staff_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('NEW_BOOKING', 'BOOKING_CANCELLED', 'SYSTEM_ALERT')),
    message TEXT NOT NULL,
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 8. ENABLE RLS ON ALL TABLES
-- =====================
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

-- =====================
-- 9. RLS POLICIES
-- =====================

-- PROFILES: All authenticated users can view all profiles (needed for booking)
DROP POLICY IF EXISTS "Public can view staff profiles" ON public.profiles;
DROP POLICY IF EXISTS "All users view all profiles" ON public.profiles;
CREATE POLICY "All users view all profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

-- COACH AVAILABILITY: Everyone can read, only superadmin manages
DROP POLICY IF EXISTS "Authenticated users can read coach availability" ON public.coach_availability;
CREATE POLICY "Authenticated users can read coach availability"
ON public.coach_availability FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can manage coach availability" ON public.coach_availability;
CREATE POLICY "Staff can manage coach availability"
ON public.coach_availability FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));

-- COACH SCHEDULE: Everyone can read, only staff/superadmin manages
DROP POLICY IF EXISTS "Authenticated users can read coach schedule" ON public.coach_schedule;
CREATE POLICY "Authenticated users can read coach schedule"
ON public.coach_schedule FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can manage coach schedule" ON public.coach_schedule;
CREATE POLICY "Staff can manage coach schedule"
ON public.coach_schedule FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));

-- SESSION TEMPLATES: Everyone can read, admins manage
DROP POLICY IF EXISTS "Admins manage templates" ON public.session_templates;
CREATE POLICY "Admins manage templates" ON public.session_templates FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));
DROP POLICY IF EXISTS "Authenticated users view templates" ON public.session_templates;
CREATE POLICY "Authenticated users view templates" ON public.session_templates FOR SELECT TO authenticated USING (true);

-- SESSION BOOKINGS: Athletes manage own, staff manage all
DROP POLICY IF EXISTS "Athletes manage own bookings" ON public.session_bookings;
DROP POLICY IF EXISTS "Staff manage all bookings" ON public.session_bookings;
CREATE POLICY "Athletes manage own bookings" ON public.session_bookings FOR ALL TO authenticated
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());
CREATE POLICY "Staff manage all bookings" ON public.session_bookings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));

-- TRAINING SESSIONS: Athletes can INSERT (for on-demand bookings), all can view
DROP POLICY IF EXISTS "Authenticated users can create on-demand sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Authenticated users can view all sessions" ON public.training_sessions;
CREATE POLICY "Authenticated users can create on-demand sessions"
ON public.training_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can view all sessions"
ON public.training_sessions FOR SELECT TO authenticated USING (true);

-- ATHLETE NOTIFICATIONS
DROP POLICY IF EXISTS "Athletes view own notifications" ON public.athlete_notifications;
DROP POLICY IF EXISTS "Staff create notifications" ON public.athlete_notifications;
CREATE POLICY "Athletes view own notifications" ON public.athlete_notifications FOR SELECT
USING (athlete_id = auth.uid());
CREATE POLICY "Staff create notifications" ON public.athlete_notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- STAFF NOTIFICATIONS
DROP POLICY IF EXISTS "Staff view own notifications" ON public.staff_notifications;
DROP POLICY IF EXISTS "Anyone can create staff notifications" ON public.staff_notifications;
CREATE POLICY "Staff view own notifications" ON public.staff_notifications FOR SELECT
USING (staff_id = auth.uid());
CREATE POLICY "Anyone can create staff notifications" ON public.staff_notifications FOR INSERT
TO authenticated WITH CHECK (true);

-- =====================
-- 10. VERIFY - Run after setup
-- =====================
SELECT 'Setup complete!' AS status;
SELECT count(*) AS booking_count FROM public.session_bookings;
SELECT count(*) AS staff_notif_count FROM public.staff_notifications;
