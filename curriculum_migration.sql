-- KIO-X CURRICULUM & DAILY PROGRAM SYSTEM MIGRATION
-- This script alters the training_sessions constraint to support new categories (MEAL, CURFEW, LOGISTICS)
-- and creates the system_settings table to support editable Program Director contact info.

-- 1. EXTEND session_type CHECK CONSTRAINT ON training_sessions
ALTER TABLE public.training_sessions DROP CONSTRAINT IF EXISTS training_sessions_session_type_check;
ALTER TABLE public.training_sessions ADD CONSTRAINT training_sessions_session_type_check 
    CHECK (session_type IN ('STRENGTH', 'TACTICAL', 'CONDITIONING', 'RECOVERY', 'ASSESSMENT', 'CUSTOM', 'MEAL', 'CURFEW', 'LOGISTICS'));

-- 2. CREATE SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Initialize default contact details if not exist
INSERT INTO public.system_settings (key, value)
VALUES ('staff_contact_info', '{"name": "Coach Alexander", "role": "Program Director", "phone": "+1 (555) 901-2026"}')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security (RLS) on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- SELECT POLICY: Anyone authenticated can read settings
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;
CREATE POLICY "Anyone can view settings" ON public.system_settings 
    FOR SELECT TO authenticated USING (true);

-- UPDATE/INSERT POLICY: Admins/Staff can modify settings
DROP POLICY IF EXISTS "Admins and staff can manage settings" ON public.system_settings;
CREATE POLICY "Admins and staff can manage settings" ON public.system_settings 
    FOR ALL TO authenticated USING (public.is_admin_or_staff(auth.uid())) WITH CHECK (public.is_admin_or_staff(auth.uid()));
