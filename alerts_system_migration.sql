-- ==========================================
-- KIO-X ALERTS & ANOMALY DETECTION SYSTEM
-- Author: Antigravity / Elite Performance
-- ==========================================

-- 1. Alerts Infrastructure Table
CREATE TABLE IF NOT EXISTS public.athlete_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- FATIGUE / HYDRATION / INJURY_RISK / SLEEP / OVERLOAD
    severity TEXT NOT NULL, -- LOW / MEDIUM / HIGH / CRITICAL
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- 2. Real-time Subscription Activation
ALTER TABLE public.athlete_alerts REPLICA IDENTITY FULL;
-- Note: Enable 'Realtime' for this table in the Supabase Dashboard > Replication.

-- 3. RLS Security Configuration
ALTER TABLE public.athlete_alerts ENABLE ROW LEVEL SECURITY;

-- STAFF/ADMIN: Total Control over anomalies
DROP POLICY IF EXISTS "Staff/Admin manage all alerts" ON public.athlete_alerts;
CREATE POLICY "Staff/Admin manage all alerts"
ON public.athlete_alerts
FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ATHLETES: Read-only access to personal flags
DROP POLICY IF EXISTS "Athletes view personal alerts" ON public.athlete_alerts;
CREATE POLICY "Athletes view personal alerts"
ON public.athlete_alerts
FOR SELECT
TO authenticated
USING (auth.uid() = athlete_id);

-- 4. Anomaly Detection Engine (PostgreSQL Triggers)

-- 4a. LOAD WATCHER (Triggers on profile update from load sync)
CREATE OR REPLACE FUNCTION public.check_load_anomalies()
RETURNS TRIGGER AS $$
BEGIN
    -- FATIGUE ALERT (> 650 AU)
    IF NEW.weekly_load > 650 AND NEW.weekly_load <= 975 AND (OLD.weekly_load <= 650 OR OLD.weekly_load IS NULL) THEN
        INSERT INTO public.athlete_alerts (athlete_id, alert_type, severity, message)
        VALUES (NEW.id, 'FATIGUE', 'HIGH', 'Weekly intensity (AU) has exceeded optimal target range.');
    END IF;

    -- OVERLOAD ALERT (> 975 AU / 150% of 650)
    IF NEW.weekly_load > 975 AND (OLD.weekly_load <= 975 OR OLD.weekly_load IS NULL) THEN
        INSERT INTO public.athlete_alerts (athlete_id, alert_type, severity, message)
        VALUES (NEW.id, 'OVERLOAD', 'CRITICAL', 'CRITICAL LOAD DETECTED: Intensive physiological strain detected (>150% Target).');
    END IF;

    -- AUTO-RESOLVE if load returns to normal? 
    -- (User didn't ask for auto-resolve, but it's a good practice. I'll stick to manual resolve for now as requested.)

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_load_anomalies ON public.profiles;
CREATE TRIGGER tr_check_load_anomalies
AFTER UPDATE OF weekly_load ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_load_anomalies();

-- 4b. INJURY WATCHER
CREATE OR REPLACE FUNCTION public.check_injury_anomalies()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure we have a valid athlete_id
    IF NEW.athlete_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Trigger for both Medium and High severity
    IF (NEW.severity = 'High' OR NEW.severity = 'Medium') AND NEW.status != 'Cleared' THEN
        -- 1. Create the Performance Hub Flag (for dashboard stats)
        INSERT INTO public.athlete_alerts (athlete_id, alert_type, severity, message)
        VALUES (
            NEW.athlete_id, 
            'INJURY_RISK', 
            UPPER(NEW.severity), 
            'Medical Flag: ' || UPPER(NEW.severity) || ' severity ' || NEW.injury_type || ' detected in ' || UPPER(COALESCE(NEW.body_part, 'unspecified area')) || '.'
        );

        -- 2. Create the System Notification (for the Bell Icon / Realtime Alert)
        INSERT INTO public.system_notifications (recipient_id, sender_id, title, message, type)
        VALUES (
            NEW.athlete_id,
            NEW.logged_by,
            'MEDICAL STATUS ALERT',
            'Management has updated your clinical status: ' || NEW.severity || ' risk ' || NEW.injury_type || ' detected.',
            'ALERT'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_injury_anomalies ON public.athlete_injury_logs;
CREATE TRIGGER tr_check_injury_anomalies
AFTER INSERT OR UPDATE ON public.athlete_injury_logs
FOR EACH ROW
EXECUTE FUNCTION public.check_injury_anomalies();

-- 4c. WELLNESS WATCHER (Sleep & Hydration)
CREATE OR REPLACE FUNCTION public.check_wellness_anomalies()
RETURNS TRIGGER AS $$
DECLARE
    hydration_score INTEGER;
    sleep_val INTEGER;
BEGIN
    -- Only trigger when survey is completed
    IF NEW.status = 'completed' AND (OLD.status = 'pending' OR OLD.status IS NULL) THEN
        
        -- Extract hydration
        hydration_score := (NEW.response_data ->> 'hydration')::INTEGER;
        IF hydration_score < 3 THEN
           INSERT INTO public.athlete_alerts (athlete_id, alert_type, severity, message)
           VALUES (NEW.athlete_id, 'HYDRATION', 'MEDIUM', 'Physiological anomaly: Subjective hydration score reported < 3.');
        END IF;

        -- Extract sleep
        sleep_val := (NEW.response_data ->> 'sleep_score')::INTEGER;
        IF sleep_val < 5 THEN
           INSERT INTO public.athlete_alerts (athlete_id, alert_type, severity, message)
           VALUES (NEW.athlete_id, 'SLEEP', 'MEDIUM', 'Recovery anomaly: Clinical sleep score reported < 5/10.');
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_wellness_anomalies ON public.athlete_surveys;
CREATE TRIGGER tr_check_wellness_anomalies
AFTER UPDATE ON public.athlete_surveys
FOR EACH ROW
EXECUTE FUNCTION public.check_wellness_anomalies();
