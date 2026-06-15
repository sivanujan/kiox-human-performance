-- curriculum_and_schedules_separation.sql
-- Separate curriculum and schedule systems, adding columns and role-based policies.

-- 1. Add columns to training_sessions
ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS is_curriculum BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS external_player_name TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('PENDING', 'CONFIRMED')) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS confirmed_by_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS session_category TEXT CHECK (session_category IN ('CURRICULUM', 'SCHEDULE', 'EMERGENCY')) DEFAULT 'SCHEDULE';

-- Populate session_category based on boolean flags
UPDATE public.training_sessions SET session_category = 'CURRICULUM' WHERE is_curriculum = true;
UPDATE public.training_sessions SET session_category = 'EMERGENCY' WHERE is_emergency = true;

-- 2. Drop existing RLS policies on training_sessions
DROP POLICY IF EXISTS "Admin/Staff can manage all training sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Staff can manage training sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Athletes can view their assigned sessions" ON public.training_sessions;

-- 3. Re-create SELECT policy for athletes
-- Academy players can see curriculum sessions, emergency sessions, or sessions where they are assigned.
CREATE POLICY "Athletes can view appropriate sessions" ON public.training_sessions
    FOR SELECT
    TO authenticated
    USING (
        is_curriculum = true 
        OR is_emergency = true 
        OR auth.uid() = ANY(assigned_athletes)
    );

-- 4. Re-create SELECT policy for staff/coaches/medical
CREATE POLICY "Staff can view all sessions" ON public.training_sessions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('staff', 'superadmin', 'medical')
        )
    );

-- 5. Re-create WRITE policy (Insert, Update, Delete)
-- - Only superadmin can create/edit curriculum (is_curriculum = true).
-- - Both superadmin and staff (coaches) can create/edit schedules (is_curriculum = false).
-- - Medical role cannot create or edit any sessions.
CREATE POLICY "Admins and coaches can manage appropriate sessions" ON public.training_sessions
    FOR ALL
    TO authenticated
    USING (
        (is_curriculum = true AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
        ))
        OR
        (COALESCE(is_curriculum, false) = false AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'staff')
        ))
    )
    WITH CHECK (
        (is_curriculum = true AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
        ))
        OR
        (COALESCE(is_curriculum, false) = false AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'staff')
        ))
    );
