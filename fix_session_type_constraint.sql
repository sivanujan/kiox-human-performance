-- SQL Script to resolve: new row for relation "training_sessions" violates check constraint "training_sessions_session_type_check"
-- This drops the constraint to allow custom session type inputs.

ALTER TABLE public.training_sessions DROP CONSTRAINT IF EXISTS training_sessions_session_type_check;
