-- external_clients_support.sql
-- Add support for external client role and restrict their training session access via RLS.

-- 1. EXTEND ROLES CHECK CONSTRAINT
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('athlete', 'staff', 'superadmin', 'medical', 'parent', 'external'));

-- 2. UPDATE HANDLE NEW USER SIGNUP TRIGGER
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
    CASE WHEN chosen_role IN ('staff', 'medical', 'parent', 'external') THEN 'active' ELSE 'pending' END,
    parent_of_uuid
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-CREATE SELECT POLICY FOR SESSIONS WITH EXTERNAL ACCESS CONTROL
DROP POLICY IF EXISTS "Athletes can view appropriate sessions" ON public.training_sessions;
CREATE POLICY "Athletes can view appropriate sessions" ON public.training_sessions
    FOR SELECT
    TO authenticated
    USING (
        (EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('athlete', 'parent')
         ) AND (is_curriculum = true OR is_emergency = true OR auth.uid() = ANY(assigned_athletes)))
        OR
        (EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'external'
         ) AND auth.uid() = ANY(assigned_athletes))
    );
