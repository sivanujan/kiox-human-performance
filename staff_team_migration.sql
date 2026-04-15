-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update Profiles with Team Relationship
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id),
ADD COLUMN IF NOT EXISTS staff_title TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 3. Seed Default Tactical Teams
INSERT INTO public.teams (name, description) VALUES 
('KIO-X Academy', 'High-performance youth development unit'),
('Elite First Team', 'Professional squad performance management'),
('Tactical Analysis Unit', 'Advanced performance telemetry and video analysis'),
('Medical & Recovery', 'Health, injury risk, and rehabilitation oversight')
ON CONFLICT (name) DO NOTHING;

-- 4. Enable RLS on Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams" ON public.teams
FOR SELECT USING (true);

CREATE POLICY "Only admins can manage teams" ON public.teams
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);
