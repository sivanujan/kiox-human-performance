-- KIO-X WELLNESS SYNC FIX
-- This script fixes constraint violations and RLS issues in the coaching platform.

-- 1. Update Notification Enum Constraint
-- The 'type' check constraint prevents 'WELLNESS_CHECKIN' and other modern types.
ALTER TABLE public.athlete_notifications 
DROP CONSTRAINT IF EXISTS athlete_notifications_type_check;

ALTER TABLE public.athlete_notifications 
ADD CONSTRAINT athlete_notifications_type_check 
CHECK (type IN (
    'BOOKING_CONFIRMED', 
    'BOOKING_CANCELLED', 
    'WAITLIST_PROMOTED', 
    'APPROVAL_REQUIRED', 
    'BOOKING_REJECTED', 
    'SESSION_CANCELLED',
    'WELLNESS_CHECKIN',  -- NEW
    'SYSTEM_NOTICE'      -- NEW
));

-- 2. Notification RLS Policies
-- Allow athletes to insert their own notifications (e.g. from self-service check-ins)
DROP POLICY IF EXISTS "Athletes can insert own notifications" ON public.athlete_notifications;
CREATE POLICY "Athletes can insert own notifications" 
ON public.athlete_notifications 
FOR INSERT 
WITH CHECK (athlete_id = auth.uid());

-- 3. Profile Wellness Update RLS
-- Allow athletes to update their own wellness fields
DROP POLICY IF EXISTS "Athletes can update own wellness stats" ON public.profiles;
CREATE POLICY "Athletes can update own wellness stats" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4. Wellness Logs Cleanup (Optional safety)
-- In case there are duplicates for today (unlikely but causes 500)
-- DELETE FROM public.wellness_logs WHERE user_id = 'YOUR_USER_ID' AND date = CURRENT_DATE;
