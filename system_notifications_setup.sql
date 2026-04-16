-- KIO-X REALTIME NOTIFICATION SYSTEM

-- 1. Create the Unified Notifications Table
CREATE TABLE IF NOT EXISTS public.system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('ALERT', 'MESSAGE', 'UPDATE', 'SUCCESS')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Setup Row Level Security (RLS)
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their OWN notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.system_notifications;
CREATE POLICY "Users can view their own notifications" ON public.system_notifications 
FOR SELECT USING (auth.uid() = recipient_id);

-- Admins/Staff can send notifications to anyone. 
-- Athletes can ALSO send notifications to Staff (e.g. Wellness checkin completed)
DROP POLICY IF EXISTS "Users can insert notifications" ON public.system_notifications;
CREATE POLICY "Users can insert notifications" ON public.system_notifications 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can mark their own notifications as read
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.system_notifications;
CREATE POLICY "Users can update their own notifications" ON public.system_notifications 
FOR UPDATE USING (auth.uid() = recipient_id);

-- 3. Enable SUPABASE REALTIME for this table
-- This is critical to ensure the browser hears the event the millisecond it's inserted.
BEGIN;
  -- Remove it first if it exists to avoid duplicates
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.system_notifications;
