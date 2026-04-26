-- 7. Staff Notifications Table
CREATE TABLE IF NOT EXISTS public.staff_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('NEW_BOOKING', 'BOOKING_CANCELLED', 'SYSTEM_ALERT')),
    message TEXT NOT NULL,
    related_id UUID, -- booking_id
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view own notifications" ON public.staff_notifications 
FOR SELECT USING (staff_id = auth.uid());

CREATE POLICY "Anyone can create staff notifications" ON public.staff_notifications 
FOR INSERT WITH CHECK (true);
