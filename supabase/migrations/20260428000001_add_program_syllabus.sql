-- Add syllabus column to programs table
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS syllabus JSONB DEFAULT '[]';

-- Optional: Initialize existing programs with a default syllabus if needed
-- This depends on the category, but for now we'll leave it empty and let admins fill it.
