-- Create document_downloads_log Table
CREATE TABLE IF NOT EXISTS public.document_downloads_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    document_name TEXT NOT NULL,
    downloaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on document_downloads_log
ALTER TABLE public.document_downloads_log ENABLE ROW LEVEL SECURITY;

-- Allow select for staff/admin only
DROP POLICY IF EXISTS "Allow select for staff/admin" ON public.document_downloads_log;
CREATE POLICY "Allow select for staff/admin" ON public.document_downloads_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('superadmin', 'staff')
  )
);

-- Allow insert for authenticated users
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.document_downloads_log;
CREATE POLICY "Allow insert for authenticated users" ON public.document_downloads_log
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
);
