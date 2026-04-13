-- Add avatar_url to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS policies to ensure avatars are visible to everyone (public read)
-- but only updatable by the owner or service role.
-- Note: 'profiles' table should already have SELECT/UPDATE policies from create_profiles_table.sql.
-- If not, these are the recommended additions for the new field.

-- Storage configuration is handled via the Supabase Dashboard, 
-- but ensure you create a bucket named 'avatars' with Public access.
