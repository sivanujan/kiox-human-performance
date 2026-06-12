-- KIO-X PARENT-STAFF GROUP CHAT SCHEMA MIGRATION
-- This script alters the group_messages table to support 'parent_staff' type,
-- adds a parent_id column to associate parent-staff messages with a specific parent,
-- and configures strict RLS policies for Parent-Staff group communications.

-- 1. ALTER TABLE: Drop existing group type check constraint and add 'parent_staff'
ALTER TABLE public.group_messages DROP CONSTRAINT IF EXISTS group_messages_group_type_check;
ALTER TABLE public.group_messages ADD CONSTRAINT group_messages_group_type_check CHECK (group_type IN ('coach', 'medical', 'parent_staff'));

-- 2. ALTER TABLE: Add parent_id column referencing profiles
ALTER TABLE public.group_messages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NULL;

-- 3. RLS SELECT POLICY
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
  (group_type = 'parent_staff' AND (
    auth.uid() = parent_id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')
    )
  ))
);

-- 4. RLS INSERT POLICY
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
    (group_type = 'parent_staff' AND (
      (auth.uid() = parent_id AND EXISTS (
         SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent'
      ))
      OR
      EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')
      )
    ))
  )
);
