
-- 1. Ensure Profiles table has role column (Safety)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'athlete';

-- 2. Extend Training Sessions for Special Events
ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

-- 3. Fix Session Bookings Constraint (Prevent ANY duplicate for same athlete/session)
-- First, remove the old loose constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'session_bookings_session_id_athlete_id_status_key'
    ) THEN
        ALTER TABLE public.session_bookings DROP CONSTRAINT session_bookings_session_id_athlete_id_status_key;
    END IF;
END $$;

-- Add the strict constraint: one booking per athlete per session
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'session_bookings_unique_athlete_session'
    ) THEN
        ALTER TABLE public.session_bookings 
        ADD CONSTRAINT session_bookings_unique_athlete_session 
        UNIQUE(session_id, athlete_id);
    END IF;
END $$;

-- 4. Enable RLS on new column usage in policies (Update existing policies if needed)
-- (Already handled by previous scripts using ROLE)
