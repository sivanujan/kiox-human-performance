-- Add session_time to programs table
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS session_time TIME;
