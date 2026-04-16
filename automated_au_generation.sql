-- KIO-X AUTOMATED TRAINING LOAD GENERATION
-- This script replaces the old trigger that relied on manual load entries.
-- It automatically loops over every athlete assigned to a session that was just marked "COMPLETED",
-- calculates their AU based on Session Duration x Core Intensity, and logs it directly.

CREATE OR REPLACE FUNCTION public.sync_completed_session_load()
RETURNS TRIGGER AS $$
DECLARE
    base_rpe INTEGER;
    calculated_au INTEGER;
    athlete_uuid UUID;
BEGIN
    -- Only trigger this massive automation when the status changes to COMPLETED
    IF (NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED') THEN
        
        -- Step 1: Determine the core intensity multiplier (RPE)
        CASE NEW.session_type
            WHEN 'TACTICAL' THEN base_rpe := 8;
            WHEN 'STRENGTH' THEN base_rpe := 7;
            WHEN 'CONDITIONING' THEN base_rpe := 8;
            WHEN 'ASSESSMENT' THEN base_rpe := 9;
            WHEN 'RECOVERY' THEN base_rpe := 3;
            ELSE base_rpe := 6; -- Default 'Custom' intensity
        END CASE;

        -- Step 2: Calculate the mathematical load
        -- Formula: Duration (minutes) x RPE
        -- Fallback to 60 minutes if duration is somehow NULL
        calculated_au := COALESCE(NEW.duration_minutes, 60) * base_rpe;

        -- Step 3: Loop through EVERY athlete assigned to this session
        IF NEW.assigned_athletes IS NOT NULL AND array_length(NEW.assigned_athletes, 1) > 0 THEN
            FOREACH athlete_uuid IN ARRAY NEW.assigned_athletes
            LOOP
                -- Automatically insert the calculated load into the global load tracker using the correct schema columns
                INSERT INTO public.athlete_training_loads (
                    athlete_id, 
                    load_value, 
                    session_type, 
                    logged_date,
                    created_by
                ) VALUES (
                    athlete_uuid,
                    calculated_au,
                    NEW.session_type,
                    NEW.scheduled_date,
                    NEW.assigned_by
                );
            END LOOP;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger to ensure it's functioning
DROP TRIGGER IF EXISTS tr_sync_session_load_on_completion ON public.training_sessions;
CREATE TRIGGER tr_sync_session_load_on_completion
    AFTER UPDATE ON public.training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_completed_session_load();
