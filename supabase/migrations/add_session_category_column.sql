-- Migration: add_session_category_column.sql
-- Adds session_category column to training_sessions table and migrates existing data.

ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS session_category TEXT CHECK (session_category IN ('CURRICULUM', 'SCHEDULE', 'EMERGENCY')) DEFAULT 'SCHEDULE';

-- Migrate existing data based on the boolean flags
UPDATE public.training_sessions
SET session_category = 'CURRICULUM'
WHERE is_curriculum = true;

UPDATE public.training_sessions
SET session_category = 'EMERGENCY'
WHERE is_emergency = true;
