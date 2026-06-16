-- Add external booking details to public.training_sessions if they do not exist
ALTER TABLE public.training_sessions
ADD COLUMN IF NOT EXISTS external_person_phone TEXT,
ADD COLUMN IF NOT EXISTS external_person_email TEXT,
ADD COLUMN IF NOT EXISTS training_start_date DATE,
ADD COLUMN IF NOT EXISTS training_end_date DATE,
ADD COLUMN IF NOT EXISTS payment_notes TEXT,
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES public.profiles(id);

-- Update staff_notifications constraint to allow 'EMERGENCY_SESSION' along with all existing types
ALTER TABLE public.staff_notifications
DROP CONSTRAINT IF EXISTS staff_notifications_type_check;

ALTER TABLE public.staff_notifications
ADD CONSTRAINT staff_notifications_type_check
CHECK (type IN ('NEW_BOOKING', 'BOOKING_CANCELLED', 'SYSTEM_ALERT', 'EMERGENCY_SESSION', 'PROGRAM_ASSIGNED', 'PROGRAM_REQUESTED'));

