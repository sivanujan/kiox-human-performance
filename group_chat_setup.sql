-- KIO-X GROUP CHAT SCHEMA MIGRATION
-- This script creates the `group_messages` table, configures strict role-based RLS policies for Coach and Medical groups, and enables real-time message broadcasting.

-- 1. CREATE GROUP MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_type TEXT NOT NULL CHECK (group_type IN ('coach', 'medical')),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- 3. SELECT POLICIES
-- Coaches/Staff/Admins can read 'coach' group.
-- Medical/Admins can read 'medical' group.
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
);

-- 4. INSERT POLICIES
-- Users must own their sent message, and must belong to the respective roles.
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
  )
);

-- 5. REGISTER STACK TO REALTIME BROADCAST PUBLICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If already in publication or lacks superuser/ownership privileges, ignore to avoid migration block
    NULL;
END $$;
