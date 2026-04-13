-- Implementation of High-Fidelity Live Training Telemetry system
-- This schema enables real-time sensor streaming for HR, Speed, and Vitals.

-- 1. LIVE SESSIONS (Tracks active monitoring state)
CREATE TABLE IF NOT EXISTS public.athlete_live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. LIVE METRICS (High-frequency sensor data store)
CREATE TABLE IF NOT EXISTS public.athlete_live_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.athlete_live_sessions(id) ON DELETE CASCADE,
    heart_rate INTEGER NOT NULL, -- BPM
    speed DECIMAL(5,2) NOT NULL, -- KM/H
    distance_covered DECIMAL(10,3), -- KM
    calories INTEGER,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE REALTIME
-- This is critical for the Live Monitor dashboard to receive INSERT events.
ALTER PUBLICATION supabase_realtime ADD TABLE public.athlete_live_metrics;

-- 4. RLS POLICIES
ALTER TABLE public.athlete_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_live_metrics ENABLE ROW LEVEL SECURITY;

-- SESSIONS: Admins/Staff can manage, athletes can view their own
CREATE POLICY "Admin/Staff can manage all live sessions"
    ON public.athlete_live_sessions
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()))
    WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Athletes can view their own live sessions"
    ON public.athlete_live_sessions
    FOR SELECT
    TO authenticated
    USING (athlete_id = auth.uid());

-- METRICS: Admin/Staff can view all, athletes can view their own
CREATE POLICY "Admin/Staff can view all live metrics"
    ON public.athlete_live_metrics
    FOR SELECT
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Athletes can view their own live metrics"
    ON public.athlete_live_metrics
    FOR SELECT
    TO authenticated
    USING (athlete_id = auth.uid());

-- SYSTEM: Service role can insert metrics (simulating sensor input)
CREATE POLICY "Allow insertions of metrics"
    ON public.athlete_live_metrics
    FOR INSERT
    WITH CHECK (true);

-- 5. INDEXING FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_live_metrics_athlete_date ON public.athlete_live_metrics(athlete_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_sessions_active ON public.athlete_live_sessions(is_active) WHERE is_active = true;
