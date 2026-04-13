-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable viewing profile photos (Public)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 3. Enable uploading profile photos (Authenticated)
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 4. Enable users to update their own photos
DROP POLICY IF EXISTS "User Update" ON storage.objects;
CREATE POLICY "User Update" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);

-- 5. Enable users to delete their own photos
DROP POLICY IF EXISTS "User Delete" ON storage.objects;
CREATE POLICY "User Delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);
