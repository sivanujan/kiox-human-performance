-- Drop the session_type check constraint on training_sessions table
-- to allow custom text inputs for the session type field.
ALTER TABLE public.training_sessions DROP CONSTRAINT IF EXISTS training_sessions_session_type_check;
