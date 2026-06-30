-- 1. Create functional_checkups Table
CREATE TABLE IF NOT EXISTS public.functional_checkups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    therapist_name TEXT NOT NULL,
    checkup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_pain TEXT,
    movement_restrictions TEXT,
    previous_injuries TEXT,
    food_allergies TEXT,
    body_map_markers JSONB DEFAULT '[]'::jsonb,
    test_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary TEXT,
    recommendations TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('DRAFT', 'SUBMITTED')) DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create documents_library Table
CREATE TABLE IF NOT EXISTS public.documents_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT CHECK (category IN ('PERFORMANCE_REPORT', 'LAB_TEST', 'TRAINING_PROGRAM', 'PROTOCOL')) NOT NULL,
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on Tables
ALTER TABLE public.functional_checkups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_library ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for functional_checkups
DROP POLICY IF EXISTS "Allow select for staff/medical/admin" ON public.functional_checkups;
CREATE POLICY "Allow select for staff/medical/admin" ON public.functional_checkups
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('superadmin', 'staff', 'medical')
  )
);

DROP POLICY IF EXISTS "Allow insert for medical/admin" ON public.functional_checkups;
CREATE POLICY "Allow insert for medical/admin" ON public.functional_checkups
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('superadmin', 'medical')
  )
);

DROP POLICY IF EXISTS "Allow update for medical/admin" ON public.functional_checkups;
CREATE POLICY "Allow update for medical/admin" ON public.functional_checkups
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('superadmin', 'medical')
  )
);

DROP POLICY IF EXISTS "Allow delete for admin" ON public.functional_checkups;
CREATE POLICY "Allow delete for admin" ON public.functional_checkups
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- 5. RLS Policies for documents_library
DROP POLICY IF EXISTS "Allow select for staff/admin/medical or own athlete" ON public.documents_library;
CREATE POLICY "Allow select for staff/admin/medical or own athlete" ON public.documents_library
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('superadmin', 'staff', 'medical')
  )
  OR athlete_id = auth.uid()
);

DROP POLICY IF EXISTS "Allow insert for staff/admin/medical" ON public.documents_library;
CREATE POLICY "Allow insert for staff/admin/medical" ON public.documents_library
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('superadmin', 'staff', 'medical')
  )
);

DROP POLICY IF EXISTS "Allow delete for admin" ON public.documents_library;
CREATE POLICY "Allow delete for admin" ON public.documents_library
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- 6. Setup private documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
DROP POLICY IF EXISTS "Allow select for staff or own athlete folder" ON storage.objects;
CREATE POLICY "Allow select for staff or own athlete folder" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'staff', 'medical'))
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Allow insert for staff" ON storage.objects;
CREATE POLICY "Allow insert for staff" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'staff', 'medical'))
);

DROP POLICY IF EXISTS "Allow delete for admin" ON storage.objects;
CREATE POLICY "Allow delete for admin" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);
