-- KIO-X GLOBAL SECURITY SYNC
-- This script updates all performance tables to use the non-recursive safety function.

-- 1. Ensure the safety function is active
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_uid AND (
      raw_user_meta_data ->> 'role' = 'staff' OR 
      raw_user_meta_data ->> 'role' = 'superadmin' OR
      raw_user_meta_data ->> 'role' = 'medical'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Wellness & Performance
DROP POLICY IF EXISTS "Staff can view all wellness" ON public.wellness_logs;
CREATE POLICY "Staff can view all wellness" ON public.wellness_logs FOR SELECT USING (public.is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can manage performance" ON public.performance_logs;
CREATE POLICY "Staff can manage performance" ON public.performance_logs FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- 3. Update Match & Cognitive Stats
DROP POLICY IF EXISTS "Staff can view all match stats" ON public.match_stats;
CREATE POLICY "Staff can view all match stats" ON public.match_stats FOR SELECT USING (public.is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view all cognitive sessions" ON public.cognitive_sessions;
CREATE POLICY "Staff can view all cognitive sessions" ON public.cognitive_sessions FOR SELECT USING (public.is_admin_or_staff(auth.uid()));

-- 4. Update Training & Schedules
DROP POLICY IF EXISTS "Staff can manage training sessions" ON public.training_sessions;
CREATE POLICY "Staff can manage training sessions" ON public.training_sessions FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- 5. Profiles Sync (Double Check)
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin_or_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can update all profiles" ON public.profiles;
CREATE POLICY "Staff can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin_or_staff(auth.uid()));
