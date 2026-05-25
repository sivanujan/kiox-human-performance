-- KIO-X ROLES AND REALTIME CHAT MIGRATION
-- This script updates the roles schema to include 'medical' and 'parent' roles, 
-- adds the 'parent_of' linking column, updates the signup trigger, and sets up 1-on-1 direct message chat.

-- 1. EXTEND ROLES CHECK CONSTRAINT
-- We drop the old role check constraint and create a new one that allows 'medical' and 'parent' roles.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('athlete', 'staff', 'superadmin', 'medical', 'parent'));

-- 2. ADD PARENT_OF FIELD LINKING TO A PLAYER
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_of UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. CREATE CHAT CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    participant_2 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate 1-on-1 threads
    CONSTRAINT unique_participants UNIQUE (participant_1, participant_2),
    -- Ensure participants are distinct users
    CONSTRAINT participants_different CHECK (participant_1 <> participant_2)
);

-- 4. CREATE CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS) FOR CHAT TABLES
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES FOR CONVERSATIONS
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" 
ON public.conversations FOR SELECT 
TO authenticated
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Users can insert conversations they are part of" ON public.conversations;
CREATE POLICY "Users can insert conversations they are part of" 
ON public.conversations FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations" 
ON public.conversations FOR UPDATE 
TO authenticated
USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- 7. CREATE RLS POLICIES FOR MESSAGES
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id AND (auth.uid() = c.participant_1 OR auth.uid() = c.participant_2)
  )
);

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations" 
ON public.messages FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id AND (auth.uid() = c.participant_1 OR auth.uid() = c.participant_2)
  )
);

-- 8. UPDATE HANDLE NEW USER SIGNUP TRIGGER
-- We read the role and parent_of metadata from the new user auth records and create profiles appropriately.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  chosen_role TEXT;
  parent_of_val TEXT;
  parent_of_uuid UUID;
BEGIN
  chosen_role := COALESCE(new.raw_user_meta_data->>'role', 'athlete');
  parent_of_val := new.raw_user_meta_data->>'parent_of_email_or_id';

  -- If the role is parent, resolve the child player ID in the trigger as a backup
  IF chosen_role = 'parent' AND parent_of_val IS NOT NULL THEN
    -- Try to match by profile ID (UUID)
    IF parent_of_val ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      SELECT id INTO parent_of_uuid FROM public.profiles 
      WHERE id = parent_of_val::UUID AND role = 'athlete' LIMIT 1;
    END IF;

    -- Try to match by username if not matched yet
    IF parent_of_uuid IS NULL THEN
      SELECT id INTO parent_of_uuid FROM public.profiles 
      WHERE LOWER(username) = LOWER(parent_of_val) AND role = 'athlete' LIMIT 1;
    END IF;

    -- Try to match by email if not matched yet (requires security definer context to read auth.users)
    IF parent_of_uuid IS NULL THEN
      SELECT id INTO parent_of_uuid FROM auth.users 
      WHERE LOWER(email) = LOWER(parent_of_val) LIMIT 1;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, role, status, parent_of)
  VALUES (
    new.id, 
    chosen_role, 
    CASE WHEN chosen_role IN ('staff', 'medical', 'parent') THEN 'active' ELSE 'pending' END,
    parent_of_uuid
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ADD TABLES TO REALTIME PUBLICATION
-- Enable realtime for message streams and conversation listing updates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback/no-op if the publication cannot be modified directly (e.g. permission or already exists)
    NULL;
END $$;
