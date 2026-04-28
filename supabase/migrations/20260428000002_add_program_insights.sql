-- Add cycle insights fields to programs table
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS weekly_commitment INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS recovery_blocks INTEGER DEFAULT 3;
