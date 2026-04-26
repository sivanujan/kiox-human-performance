-- Coach Availability System Setup

-- 1. Create coach_availability table
CREATE TABLE IF NOT EXISTS public.coach_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timezone TEXT DEFAULT 'UTC',
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(coach_id)
);

-- 2. Create coach_schedule table
CREATE TABLE IF NOT EXISTS public.coach_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_name TEXT NOT NULL CHECK (day_name IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    is_working BOOLEAN DEFAULT false,
    start_time TEXT DEFAULT '09:00',
    end_time TEXT DEFAULT '17:00',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(coach_id, day_name)
);

-- 3. Enable RLS
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_schedule ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for coach_availability
CREATE POLICY "Authenticated users can read coach availability"
ON public.coach_availability FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only superadmins can manage coach availability"
ON public.coach_availability FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'superadmin'
    )
);

-- 5. RLS Policies for coach_schedule
CREATE POLICY "Authenticated users can read coach schedule"
ON public.coach_schedule FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only superadmins can manage coach schedule"
ON public.coach_schedule FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'superadmin'
    )
);

-- 6. Functions for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_coach_availability_updated_at
    BEFORE UPDATE ON public.coach_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_coach_schedule_updated_at
    BEFORE UPDATE ON public.coach_schedule
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Realtime Enablement (This part depends on Supabase project settings, 
-- but we can add the publication if it doesn't exist)
-- Note: Supabase UI is the preferred way to enable Realtime, but these SQL commands work too.
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_availability;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_schedule;
