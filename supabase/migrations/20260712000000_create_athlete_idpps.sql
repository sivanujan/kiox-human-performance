-- 1. Create athlete_idpps Table
CREATE TABLE IF NOT EXISTS public.athlete_idpps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    coach_name TEXT NOT NULL,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    review_date DATE,
    status TEXT CHECK (status IN ('DRAFT', 'SUBMITTED')) DEFAULT 'DRAFT',
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.athlete_idpps ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for athlete_idpps

DROP POLICY IF EXISTS "Allow select for staff/admin/medical or own athlete on idpps" ON public.athlete_idpps;
CREATE POLICY "Allow select for staff/admin/medical or own athlete on idpps" ON public.athlete_idpps
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('superadmin', 'staff', 'medical')
  )
  OR athlete_id = auth.uid()
);

DROP POLICY IF EXISTS "Allow insert for staff/admin/medical on idpps" ON public.athlete_idpps;
CREATE POLICY "Allow insert for staff/admin/medical on idpps" ON public.athlete_idpps
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('superadmin', 'staff', 'medical')
  )
);

DROP POLICY IF EXISTS "Allow update for staff/admin/medical on idpps" ON public.athlete_idpps;
CREATE POLICY "Allow update for staff/admin/medical on idpps" ON public.athlete_idpps
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('superadmin', 'staff', 'medical')
  )
);

DROP POLICY IF EXISTS "Allow delete for admin on idpps" ON public.athlete_idpps;
CREATE POLICY "Allow delete for admin on idpps" ON public.athlete_idpps
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);
