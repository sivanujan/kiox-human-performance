-- KIO-X INDIVIDUAL MANAGEMENT FOUNDATION
-- 4-Pillar performance management system migration

-- 1. Training Plans (Pillar 1: Strategic Planning)
CREATE TABLE IF NOT EXISTS public.athlete_training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    phase TEXT CHECK (phase IN ('Strength', 'Tactical', 'Recovery', 'Conditioning')),
    notes TEXT,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Injury Logs (Pillar 2: Health & Risk)
CREATE TABLE IF NOT EXISTS public.athlete_injury_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    injury_type TEXT CHECK (injury_type IN ('Muscle Strain', 'Joint', 'Fatigue', 'Illness', 'Other')),
    severity TEXT CHECK (severity IN ('Low', 'Medium', 'High')),
    body_part TEXT,
    notes TEXT,
    status TEXT CHECK (status IN ('Active Injury', 'In Recovery', 'Cleared')) DEFAULT 'Active Injury',
    logged_by UUID REFERENCES auth.users(id),
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Wellness Surveys (Pillar 3: Subjective Monitoring)
CREATE TABLE IF NOT EXISTS public.athlete_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    survey_type TEXT CHECK (survey_type IN ('Daily Wellness', 'Sleep Quality', 'Load Readiness', 'Post-Match Recovery')),
    due_date DATE,
    instructions TEXT,
    status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    response_data JSONB,
    completed_at TIMESTAMPTZ
);

-- 4. Video Feedback (Pillar 4: Tactical Analysis)
CREATE TABLE IF NOT EXISTS public.athlete_video_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT CHECK (category IN ('Technique', 'Tactical', 'Strength', 'General')),
    notes TEXT,
    video_url TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Automatic Risk Badge Sync
-- This trigger updates the 'profiles.injury_risk' whenever an injury is logged or updated.
CREATE OR REPLACE FUNCTION public.sync_athlete_injury_risk()
RETURNS TRIGGER AS $$
DECLARE
    latest_severity TEXT;
BEGIN
    -- Get the most severe active/in-recovery injury
    SELECT severity INTO latest_severity
    FROM public.athlete_injury_logs
    WHERE athlete_id = NEW.athlete_id AND status != 'Cleared'
    ORDER BY CASE 
        WHEN severity = 'High' THEN 1
        WHEN severity = 'Medium' THEN 2
        ELSE 3
    END ASC
    LIMIT 1;

    -- Default to 'low' if no active injuries found
    IF latest_severity IS NULL THEN
        latest_severity := 'low';
    ELSE
        latest_severity := LOWER(latest_severity);
    END IF;

    -- Update the profile
    UPDATE public.profiles
    SET injury_risk = latest_severity
    WHERE id = NEW.athlete_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER update_injury_risk_on_log
AFTER INSERT OR UPDATE ON public.athlete_injury_logs
FOR EACH ROW EXECUTE FUNCTION public.sync_athlete_injury_risk();

-- 6. Row Level Security (RLS)
-- We use the pre-defined is_admin_or_staff() to prevent recursive loops.

-- Enable RLS
ALTER TABLE public.athlete_training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_injury_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_video_feedback ENABLE ROW LEVEL SECURITY;

-- Training Plans
DROP POLICY IF EXISTS "Admins can manage plans" ON public.athlete_training_plans;
CREATE POLICY "Admins can manage plans" ON public.athlete_training_plans FOR ALL USING (public.is_admin_or_staff(auth.uid()));
DROP POLICY IF EXISTS "Athletes can view their plans" ON public.athlete_training_plans;
CREATE POLICY "Athletes can view their plans" ON public.athlete_training_plans FOR SELECT USING (auth.uid() = athlete_id);

-- Injury Logs
DROP POLICY IF EXISTS "Admins can manage injuries" ON public.athlete_injury_logs;
CREATE POLICY "Admins can manage injuries" ON public.athlete_injury_logs FOR ALL USING (public.is_admin_or_staff(auth.uid()));
DROP POLICY IF EXISTS "Athletes can view their injuries" ON public.athlete_injury_logs;
CREATE POLICY "Athletes can view their injuries" ON public.athlete_injury_logs FOR SELECT USING (auth.uid() = athlete_id);

-- Surveys
DROP POLICY IF EXISTS "Admins can assign surveys" ON public.athlete_surveys;
CREATE POLICY "Admins can assign surveys" ON public.athlete_surveys FOR ALL USING (public.is_admin_or_staff(auth.uid()));
DROP POLICY IF EXISTS "Athletes can manage their surveys" ON public.athlete_surveys;
CREATE POLICY "Athletes can manage their surveys" ON public.athlete_surveys FOR ALL USING (auth.uid() = athlete_id);

-- Video Feedback
DROP POLICY IF EXISTS "Admins can manage video" ON public.athlete_video_feedback;
CREATE POLICY "Admins can manage video" ON public.athlete_video_feedback FOR ALL USING (public.is_admin_or_staff(auth.uid()));
DROP POLICY IF EXISTS "Athletes can view their video" ON public.athlete_video_feedback;
CREATE POLICY "Athletes can view their video" ON public.athlete_video_feedback FOR SELECT USING (auth.uid() = athlete_id);

-- 7. Storage Bucket Setup (Metadata)
-- Note: Bucket creation normally happens via the Supabase Dashboard, 
-- but we define the RLS for 'feedback_videos' here.
-- Assuming bucket 'feedback_videos' exists.
INSERT INTO storage.buckets (id, name, public) VALUES ('feedback_videos', 'feedback_videos', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Admins can upload feedback" ON storage.objects;
CREATE POLICY "Admins can upload feedback" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'feedback_videos' AND public.is_admin_or_staff(auth.uid()));
DROP POLICY IF EXISTS "Athletes can view feedback" ON storage.objects;
CREATE POLICY "Athletes can view feedback" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'feedback_videos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin_or_staff(auth.uid())));
