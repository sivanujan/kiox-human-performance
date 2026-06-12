-- 1. Create a function to sync public.profiles.avatar_url to auth.users.raw_user_meta_data
CREATE OR REPLACE FUNCTION public.sync_profile_avatar_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.avatar_url IS DISTINCT FROM OLD.avatar_url)) THEN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('avatar_url', NEW.avatar_url)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the trigger if it already exists to prevent duplicate triggers
DROP TRIGGER IF EXISTS on_profile_avatar_updated ON public.profiles;

-- 3. Create the trigger to sync on INSERT or UPDATE
CREATE TRIGGER on_profile_avatar_updated
  AFTER INSERT OR UPDATE OF avatar_url ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_avatar_to_auth();

-- 4. Backfill existing avatar URLs from public.profiles to auth.users raw_user_meta_data
UPDATE auth.users u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('avatar_url', p.avatar_url)
FROM public.profiles p
WHERE u.id = p.id AND p.avatar_url IS NOT NULL AND (u.raw_user_meta_data->>'avatar_url' IS DISTINCT FROM p.avatar_url OR u.raw_user_meta_data IS NULL);

-- 5. Modify handle_new_user() function to sync initial avatar from oauth/metadata if present
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'avatarUrl'
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET avatar_url = EXCLUDED.avatar_url;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
