-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.gallery_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add Category Support to Gallery Items
ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Insert Initial Default Categories
INSERT INTO public.gallery_categories (name, display_order)
VALUES 
    ('TRAINING', 1),
    ('GAMES', 2),
    ('PERFORMANCE', 3),
    ('CARE', 4),
    ('COMMITMENT', 5)
ON CONFLICT (name) DO NOTHING;

-- 4. Enable RLS for Categories
ALTER TABLE public.gallery_categories ENABLE ROW LEVEL SECURITY;

-- 5. Categories Policies
DROP POLICY IF EXISTS "Allow public read categories" ON public.gallery_categories;
CREATE POLICY "Allow public read categories" ON public.gallery_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins to manage categories" ON public.gallery_categories;
CREATE POLICY "Allow admins to manage categories" ON public.gallery_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'superadmin' OR profiles.role = 'staff')
        )
    );
