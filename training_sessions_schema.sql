-- Implementation of High-Fidelity Training Session Orchestration
-- This schema enables granular session tracking, attendance, and automated load synchronization.

-- 1. TRAINING SESSIONS (Core Operational Table)
CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    session_type TEXT CHECK (session_type IN ('STRENGTH', 'TACTICAL', 'CONDITIONING', 'RECOVERY', 'CUSTOM')),
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location TEXT,
    assigned_athletes UUID[] DEFAULT '{}',
    assigned_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    target_load_au INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist if table was created by a previous partial migration
DO $$ 
BEGIN
    -- Core identity & timing
    -- Standardize session_type check constraint (Handles Uppercase standard)
    ALTER TABLE public.training_sessions DROP CONSTRAINT IF EXISTS training_sessions_session_type_check;
    ALTER TABLE public.training_sessions ADD CONSTRAINT training_sessions_session_type_check 
        CHECK (session_type IN ('STRENGTH', 'TACTICAL', 'CONDITIONING', 'RECOVERY', 'ASSESSMENT', 'CUSTOM'));
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_sessions' AND column_name='scheduled_date') THEN
        ALTER TABLE public.training_sessions ADD COLUMN scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_sessions' AND column_name='start_time') THEN
        ALTER TABLE public.training_sessions ADD COLUMN start_time TIME NOT NULL DEFAULT '09:00:00';
    ELSE
        -- Ensure the column is explicitly TIME if it exists as another type (e.g., TIMESTAMPTZ)
        ALTER TABLE public.training_sessions ALTER COLUMN start_time TYPE TIME USING start_time::TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_sessions' AND column_name='duration_minutes') THEN
        ALTER TABLE public.training_sessions ADD COLUMN duration_minutes INTEGER DEFAULT 60;
    END IF;

    -- Operational Context
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_sessions' AND column_name='location') THEN
        ALTER TABLE public.training_sessions ADD COLUMN location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_sessions' AND column_name='assigned_athletes') THEN
        ALTER TABLE public.training_sessions ADD COLUMN assigned_athletes UUID[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_sessions' AND column_name='assigned_by') THEN
        ALTER TABLE public.training_sessions ADD COLUMN assigned_by UUID REFERENCES public.profiles(id);
    END IF;

    -- Standardize status check constraint (Handles Uppercase standard)
    ALTER TABLE public.training_sessions DROP CONSTRAINT IF EXISTS training_sessions_status_check;
    ALTER TABLE public.training_sessions ADD CONSTRAINT training_sessions_status_check 
        CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_sessions' AND column_name='notes') THEN
        ALTER TABLE public.training_sessions ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_sessions' AND column_name='target_load_au') THEN
        ALTER TABLE public.training_sessions ADD COLUMN target_load_au INTEGER;
    END IF;

    -- Legacy/External field cleanup
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_sessions' AND column_name='end_time') THEN
        ALTER TABLE public.training_sessions ALTER COLUMN end_time DROP NOT NULL;
    END IF;
END $$;

-- 2. SESSION ATHLETE LOADS (Granular Metric Table)
CREATE TABLE IF NOT EXISTS public.session_athlete_loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    actual_load_au INTEGER,
    rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
    attendance TEXT DEFAULT 'PRESENT' CHECK (attendance IN ('PRESENT', 'ABSENT', 'LATE')),
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS POLICIES
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_athlete_loads ENABLE ROW LEVEL SECURITY;

-- SESSIONS: Admin/Staff can manage, athletes can view if assigned
DROP POLICY IF EXISTS "Admin/Staff can manage all training sessions" ON public.training_sessions;
CREATE POLICY "Admin/Staff can manage all training sessions"
    ON public.training_sessions
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()))
    WITH CHECK (public.is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Athletes can view their assigned sessions" ON public.training_sessions;
CREATE POLICY "Athletes can view their assigned sessions"
    ON public.training_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = ANY(assigned_athletes));

-- LOADS: Admin/Staff can manage, athletes can view their own
DROP POLICY IF EXISTS "Admin/Staff can manage all session loads" ON public.session_athlete_loads;
CREATE POLICY "Admin/Staff can manage all session loads"
    ON public.session_athlete_loads
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_staff(auth.uid()))
    WITH CHECK (public.is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Athletes can view their own session loads" ON public.session_athlete_loads;
CREATE POLICY "Athletes can view their own session loads"
    ON public.session_athlete_loads
    FOR SELECT
    TO authenticated
    USING (athlete_id = auth.uid());

-- 4. AUTOMATED LOAD SYNCHRONIZATION
-- This function triggers when a session is marked COMPLETED
-- It syncs individual athlete loads to the main athlete_training_loads table
CREATE OR REPLACE FUNCTION public.sync_completed_session_load()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED') THEN
        -- Sync each athlete's log from the session to the historical load table
        INSERT INTO public.athlete_training_loads (athlete_id, load_au, session_type, recorded_date)
        SELECT 
            athlete_id, 
            COALESCE(actual_load_au, 0), 
            NEW.session_type, 
            NEW.scheduled_date
        FROM public.session_athlete_loads
        WHERE session_id = NEW.id;

        -- This insert will naturally trigger the existing weekly_load updates in athlete_training_loads
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_session_load_on_completion ON public.training_sessions;
CREATE TRIGGER tr_sync_session_load_on_completion
    AFTER UPDATE ON public.training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_completed_session_load();

-- 5. INDEXING FOR CALENDAR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.training_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_session_loads_athlete ON public.session_athlete_loads(athlete_id);
