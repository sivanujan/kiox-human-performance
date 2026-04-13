-- ==========================================
-- KIO-X TRAINING LOAD INFRASTRUCTURE
-- Author: Antigravity / Elite Performance 
-- ==========================================

-- 1. Create Training Loads Table
CREATE TABLE IF NOT EXISTS public.athlete_training_loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    load_value INTEGER NOT NULL, -- AU (Arbitrary Units)
    logged_date DATE DEFAULT CURRENT_DATE,
    session_type TEXT NOT NULL, -- Strength, Tactical, Recovery, Conditioning, Gym
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Indexing for High-Velocity Queries
CREATE INDEX IF NOT EXISTS idx_load_athlete_date ON public.athlete_training_loads(athlete_id, logged_date);

-- 3. RLS Security Configuration
ALTER TABLE public.athlete_training_loads ENABLE ROW LEVEL SECURITY;

-- STAFF/ADMIN: Full Spectrum Control
CREATE POLICY "Staff/Admin full access on loads"
ON public.athlete_training_loads
FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ATHLETES: Read-only access to personal load telemetry
CREATE POLICY "Athletes read own loads"
ON public.athlete_training_loads
FOR SELECT
TO authenticated
USING (auth.uid() = athlete_id);

-- 4. Automated Weekly Load Synchronization
-- This function calculates the aggregate weekly AU for an athlete and updates their profile snapshot.
CREATE OR REPLACE FUNCTION public.sync_athlete_weekly_load()
RETURNS TRIGGER AS $$
DECLARE
    week_start DATE;
    week_end DATE;
    total_au INTEGER;
BEGIN
    -- Calculate fixed Monday-to-Sunday window
    week_start := date_trunc('week', COALESCE(NEW.logged_date, OLD.logged_date))::DATE;
    week_end := week_start + INTERVAL '6 days';

    -- Aggregate AU sum for the subject in the current cycle
    SELECT COALESCE(SUM(load_value), 0)
    INTO total_au
    FROM public.athlete_training_loads
    WHERE athlete_id = COALESCE(NEW.athlete_id, OLD.athlete_id)
      AND logged_date BETWEEN week_start AND week_end;

    -- Update Profiler Matrix
    UPDATE public.profiles
    SET weekly_load = total_au
    WHERE id = COALESCE(NEW.athlete_id, OLD.athlete_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger Activation
DROP TRIGGER IF EXISTS tr_sync_weekly_load ON public.athlete_training_loads;
CREATE TRIGGER tr_sync_weekly_load
AFTER INSERT OR UPDATE OR DELETE
ON public.athlete_training_loads
FOR EACH ROW
EXECUTE FUNCTION public.sync_athlete_weekly_load();
