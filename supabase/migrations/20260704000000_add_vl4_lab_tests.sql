-- ==========================================
-- KIO-X VL4 LAB TESTS INFRASTRUCTURE
-- Author: Antigravity / Elite Performance
-- Date: 2026-07-04
-- ==========================================

-- 1. Create VL4 Lab Tests Table
CREATE TABLE IF NOT EXISTS public.vl4_lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  test_method TEXT NOT NULL,
  temperature DECIMAL,
  incline_percent DECIMAL,
  tester_name TEXT,
  notes TEXT,
  resting_lactate DECIMAL,
  resting_hr INTEGER,
  stage_data JSONB DEFAULT '[]',
  recovery_lactate DECIMAL,
  recovery_hr INTEGER,
  recovery_time TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_session_athlete UNIQUE (session_id, athlete_id)
);

-- 2. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_vl4_session_athlete ON public.vl4_lab_tests(session_id, athlete_id);
CREATE INDEX IF NOT EXISTS idx_vl4_athlete_date ON public.vl4_lab_tests(athlete_id, test_date);

-- 3. Trigger for updated_at column
CREATE TRIGGER set_vl4_lab_tests_updated_at
  BEFORE UPDATE ON public.vl4_lab_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.vl4_lab_tests ENABLE ROW LEVEL SECURITY;

-- 5. Access Policies (Only Admin, Staff, Coach, Medical can View & Fill)
CREATE POLICY "Manage vl4_lab_tests policy" ON public.vl4_lab_tests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('superadmin', 'staff', 'coach', 'medical')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('superadmin', 'staff', 'coach', 'medical')
    )
  );
