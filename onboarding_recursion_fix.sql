-- 1. Create a security definer function to break the recursion loop
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uid AND (role = 'staff' OR role = 'superadmin')
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
