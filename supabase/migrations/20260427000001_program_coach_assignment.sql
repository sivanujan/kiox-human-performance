-- Add coach_id to programs to allow assignment of coaching staff to specific architectures
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.profiles(id);

-- Update user_programs for Request & Payment workflow
ALTER TABLE public.user_programs 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'confirmed' CHECK (payment_status IN ('pending', 'confirmed', 'failed')),
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('requested', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- NOTE: Defaulting existing records to 'confirmed'/'approved' to avoid breaking current users.

-- Create program_schedule table for weekly sessions
CREATE TABLE IF NOT EXISTS public.program_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    title TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Update staff_notifications type constraint
ALTER TABLE public.staff_notifications DROP CONSTRAINT IF EXISTS staff_notifications_type_check;
ALTER TABLE public.staff_notifications ADD CONSTRAINT staff_notifications_type_check 
CHECK (type IN ('NEW_BOOKING', 'BOOKING_CANCELLED', 'SYSTEM_ALERT', 'PROGRAM_ASSIGNED', 'PROGRAM_REQUESTED'));

-- Enable RLS for program_schedule
ALTER TABLE public.program_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view program schedules" ON public.program_schedule 
FOR SELECT USING (true);

CREATE POLICY "Coaches can manage their own program schedules" ON public.program_schedule 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.programs 
    WHERE id = program_id AND (coach_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  )
);
