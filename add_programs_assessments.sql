-- 1. Create the `user_programs` table to track athlete enrollments
CREATE TABLE IF NOT EXISTS public.user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL, -- Assuming programs are managed in public.programs
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- active, completed, dropped
  notes TEXT
);

-- 2. Create the `assessments` table for performance evaluations
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assessment_date TIMESTAMPTZ NOT NULL,
  assessment_type TEXT NOT NULL, -- Initial, Monthly, Final, Special
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
  results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Users can view their own data
CREATE POLICY "Users can view their own programs" ON public.user_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own assessments" ON public.assessments FOR SELECT USING (auth.uid() = user_id);

-- Staff and Admins can manage all enrollments and assessments
-- (Assuming role column exists in public.profiles)
CREATE POLICY "Staff can manage all enrollments" ON public.user_programs 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'staff' OR role = 'superadmin')
  )
);

CREATE POLICY "Staff can manage all assessments" ON public.assessments 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'staff' OR role = 'superadmin')
  )
);
