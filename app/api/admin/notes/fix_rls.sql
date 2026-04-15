-- Fix RLS Policies for trainer_notes to allow Staff access
-- 1. Drop old restrictive policy if it exists
DROP POLICY IF EXISTS "Admins can manage all notes" ON public.trainer_notes;
DROP POLICY IF EXISTS "Users can view notes about themselves" ON public.trainer_notes;

-- 2. Create refined policy for Admin/Staff
CREATE POLICY "Admin/Staff can manage all trainer notes"
ON public.trainer_notes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'superadmin' OR role = 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'superadmin' OR role = 'staff')
  )
);

-- 3. Create view policy for Athletes (only their own notes)
CREATE POLICY "Athletes can view their own trainer notes"
ON public.trainer_notes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure user_id can be NULL for general staff logs
ALTER TABLE public.trainer_notes ALTER COLUMN user_id DROP NOT NULL;
