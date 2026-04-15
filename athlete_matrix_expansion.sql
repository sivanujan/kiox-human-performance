-- KIO-X ELITE MATRIX EXPANSION
-- This migration sets up historical tracking and granular metrics for athletes and trainers.

-- 1. Wellness Logs (Historical daily check-ins)
CREATE TABLE IF NOT EXISTS public.wellness_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 10),
    soreness_score INTEGER CHECK (soreness_score BETWEEN 0 AND 10),
    hydration_status TEXT CHECK (hydration_status IN ('low', 'optimal', 'high')),
    mood TEXT,
    stress_level TEXT CHECK (stress_level IN ('low', 'moderate', 'high')),
    hrv_ms INTEGER,
    resting_hr_bpm INTEGER,
    recommendations TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 2. Performance Logs (Physical metrics per session/day)
CREATE TABLE IF NOT EXISTS public.performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    top_speed_kmh NUMERIC,
    total_distance_km NUMERIC,
    sprint_count INTEGER,
    power_output_watts NUMERIC,
    vo2_max NUMERIC,
    high_intensity_efforts INTEGER,
    training_load_au INTEGER,
    duration_mins INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Match Stats (Granular performance per game)
CREATE TABLE IF NOT EXISTS public.match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id TEXT, -- External ID or Link
    match_date DATE NOT NULL,
    opponent TEXT,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    xg NUMERIC DEFAULT 0,
    pass_accuracy_percent INTEGER,
    duels_won_percent INTEGER,
    pressures INTEGER,
    heatmap_url TEXT,
    tactical_compliance_percent INTEGER,
    coach_rating NUMERIC CHECK (coach_rating BETWEEN 0 AND 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Cognitive Sessions
CREATE TABLE IF NOT EXISTS public.cognitive_sessions (
    id PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    test_type TEXT, -- reaction, focus, decision
    score NUMERIC,
    reaction_time_ms INTEGER,
    focus_percentage INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Training Sessions (Granular scheduling & slots)
CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    session_type TEXT CHECK (session_type IN ('strength', 'tactical', 'recovery', 'assessment')),
    scheduled_date DATE DEFAULT CURRENT_DATE,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    max_capacity INTEGER DEFAULT 1,
    location TEXT,
    assigned_athletes UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Updating Existing Tables
ALTER TABLE public.video_clips 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS tactical_compliance_percent INTEGER;

-- 7. RLS & Security
ALTER TABLE public.wellness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

-- 8. Policies
-- Wellness & Performance: Owners can view/insert, Staff can view/edit
CREATE POLICY "Users can manage their own wellness" ON public.wellness_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all wellness" ON public.wellness_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));

CREATE POLICY "Users can view their performance" ON public.performance_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can manage performance" ON public.performance_logs FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));

CREATE POLICY "Anyone can view training sessions" ON public.training_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage training sessions" ON public.training_sessions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));
