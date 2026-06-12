-- KIO-X STAFF & MEDICAL COMMON GROUP CHAT SCHEMA MIGRATION
-- This script alters the group_messages RLS policies and constraints to support 'staff_medical' group type.

-- 1. ALTER TABLE: Drop existing group type check constraint and add 'staff_medical'
ALTER TABLE public.group_messages DROP CONSTRAINT IF EXISTS group_messages_group_type_check;
ALTER TABLE public.group_messages ADD CONSTRAINT group_messages_group_type_check CHECK (group_type IN ('coach', 'medical', 'parent_staff', 'parent', 'medical_broadcast', 'staff_medical'));

-- 2. RLS SELECT POLICY
DROP POLICY IF EXISTS "Users can view group messages" ON public.group_messages;
CREATE POLICY "Users can view group messages" ON public.group_messages
FOR SELECT
TO authenticated
USING (
  (group_type = 'coach' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')
  ))
  OR
  (group_type = 'medical' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('medical', 'superadmin')
  ))
  OR
  (group_type = 'medical_broadcast' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')
  ))
  OR
  (group_type = 'parent_staff' AND (
    auth.uid() = parent_id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')
    )
  ))
  OR
  (group_type = 'parent' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('parent', 'staff', 'superadmin')
  ))
  -- Allow both staff (coaches) and medical staff (plus admins) to view staff_medical messages
  OR
  (group_type = 'staff_medical' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'medical', 'superadmin')
  ))
);

-- 3. RLS INSERT POLICY
DROP POLICY IF EXISTS "Users can insert group messages" ON public.group_messages;
CREATE POLICY "Users can insert group messages" ON public.group_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND (
    (group_type = 'coach' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')
    ))
    OR
    (group_type = 'medical' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('medical', 'superadmin')
    ))
    OR
    (group_type = 'medical_broadcast' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')
    ))
    OR
    (group_type = 'parent_staff' AND (
      (auth.uid() = parent_id AND EXISTS (
         SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent'
      ))
      OR
      EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')
      )
    ))
    OR
    (group_type = 'parent' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin')
    ))
    -- Allow both staff (coaches) and medical staff (plus admins) to post to staff_medical group
    OR
    (group_type = 'staff_medical' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'medical', 'superadmin')
    ))
  )
);
