-- KIO-X MEDICAL OFFICERS GROUP CHAT SCHEMA MIGRATION
-- This script alters the group_messages RLS policies and constraints to support two distinct groups:
-- 1. 'medical' - Group chat for medical staff to converse together (Coaches excluded).
-- 2. 'medical_broadcast' - Broadcast channel for Coaches/Admins to send messages to all medical staff 1-on-1.

-- 1. ALTER TABLE: Drop existing group type check constraint and add 'medical_broadcast'
ALTER TABLE public.group_messages DROP CONSTRAINT IF EXISTS group_messages_group_type_check;
ALTER TABLE public.group_messages ADD CONSTRAINT group_messages_group_type_check CHECK (group_type IN ('coach', 'medical', 'parent_staff', 'parent', 'medical_broadcast'));

-- 2. RLS SELECT POLICY
DROP POLICY IF EXISTS "Users can view group messages" ON public.group_messages;
CREATE POLICY "Users can view group messages" ON public.group_messages
FOR SELECT
TO authenticated
USING (
  (group_type = 'coach' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')
  ))
  -- Only medical staff and superadmins can view the medical group chat
  OR
  (group_type = 'medical' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('medical', 'superadmin')
  ))
  -- Only coaches and superadmins can view the medical broadcast history
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
    -- Only medical staff and superadmins can insert into the medical group chat
    OR
    (group_type = 'medical' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('medical', 'superadmin')
    ))
    -- Only coaches and superadmins can write to the medical broadcast channel
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
  )
);
