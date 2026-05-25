-- 1. Create a security definer function to break the recursion loop
-- We query auth.users instead of public.profiles to completely avoid RLS recursion on the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_uid AND (
      raw_user_meta_data ->> 'role' = 'staff' OR 
      raw_user_meta_data ->> 'role' = 'superadmin' OR
      raw_user_meta_data ->> 'role' = 'medical'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the buggy recursive policies
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can update all profiles" ON public.profiles;

-- 3. Re-create the policies using the non-recursive function
CREATE POLICY "Staff can view all profiles" 
ON public.profiles FOR SELECT 
USING ( public.is_admin_or_staff(auth.uid()) );

CREATE POLICY "Staff can update all profiles" 
ON public.profiles FOR UPDATE 
USING ( public.is_admin_or_staff(auth.uid()) );
