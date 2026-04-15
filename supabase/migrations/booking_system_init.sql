-- KIO-X SESSION BOOKING SYSTEM INITIALIZATION
-- This migration implements capacity management, waitlists, and recurring session templates.

-- 1. EXTEND TRAINING SESSIONS
ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS template_id UUID; -- Link to the template it was generated from

-- 2. SESSION TEMPLATES (Recurring weekly schedule)
CREATE TABLE IF NOT EXISTS public.session_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon...
    title TEXT NOT NULL,
    session_type TEXT CHECK (session_type IN ('STRENGTH', 'TACTICAL', 'CONDITIONING', 'RECOVERY', 'MATCH_PREP', 'CUSTOM')),
    start_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    max_capacity INTEGER DEFAULT 20,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SESSION BOOKINGS
CREATE TABLE IF NOT EXISTS public.session_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    booked_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLISTED', 'NO_SHOW')),
    booking_type TEXT DEFAULT 'SELF' CHECK (booking_type IN ('SELF', 'ADMIN_ASSIGNED')),
    notes TEXT,
    booked_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES public.profiles(id),
    cancellation_reason TEXT,
    UNIQUE(session_id, athlete_id, status) -- Prevents duplicate active bookings
);

-- 4. ATHLETE NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.athlete_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'WAITLIST_PROMOTED', 'APPROVAL_REQUIRED', 'BOOKING_REJECTED', 'SESSION_CANCELLED')),
    message TEXT NOT NULL,
    related_id UUID, -- booking_id or session_id
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. WAITLIST & CAPACITY LOGIC (Triggers)

-- Function to check capacity and assign status
CREATE OR REPLACE FUNCTION public.handle_booking_status()
RETURNS TRIGGER AS $$
DECLARE
    current_confirmed INTEGER;
    session_capacity INTEGER;
BEGIN
    -- Get current confirmed count
    SELECT COUNT(*) INTO current_confirmed 
    FROM public.session_bookings 
    WHERE session_id = NEW.session_id AND status = 'CONFIRMED';
    
    -- Get session capacity
    SELECT max_capacity INTO session_capacity 
    FROM public.training_sessions 
    WHERE id = NEW.session_id;

    -- Standard business logic
    IF NEW.status = 'PENDING' THEN
        IF current_confirmed >= session_capacity THEN
            NEW.status := 'WAITLISTED';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_booking_capacity
    BEFORE INSERT ON public.session_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_booking_status();

-- Function to promote from waitlist on cancellation
CREATE OR REPLACE FUNCTION public.promote_from_waitlist()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if a CONFIRMED booking was CANCELLED
    IF (OLD.status = 'CONFIRMED' AND NEW.status = 'CANCELLED') THEN
        -- Find the first person on the waitlist
        UPDATE public.session_bookings
        SET status = 'CONFIRMED', confirmed_at = now()
        WHERE id = (
            SELECT id FROM public.session_bookings
            WHERE session_id = OLD.session_id AND status = 'WAITLISTED'
            ORDER BY booked_at ASC
            LIMIT 1
        );
        
        -- Notification logic would go here or in a separate trigger
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_promote_waitlist
    AFTER UPDATE ON public.session_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.promote_from_waitlist();

-- 6. RLS POLICIES
ALTER TABLE public.session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_notifications ENABLE ROW LEVEL SECURITY;

-- Templates: Admin manage, all authenticated view
CREATE POLICY "Admins manage templates" ON public.session_templates FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));
CREATE POLICY "Authenticated users view templates" ON public.session_templates FOR SELECT TO authenticated USING (true);

-- Bookings: Athletes manage own, Admins manage all
CREATE POLICY "Athletes manage own bookings" ON public.session_bookings FOR ALL USING (athlete_id = auth.uid());
CREATE POLICY "Staff manage all bookings" ON public.session_bookings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));

-- Notifications: Athletes manage own
CREATE POLICY "Athletes view own notifications" ON public.athlete_notifications FOR SELECT USING (athlete_id = auth.uid());
CREATE POLICY "Staff create notifications" ON public.athlete_notifications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'superadmin')));
