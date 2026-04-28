-- Fix relationship between user_programs and programs
ALTER TABLE public.user_programs 
ALTER COLUMN program_id SET DATA TYPE UUID;

ALTER TABLE public.user_programs
ADD CONSTRAINT user_programs_program_id_fkey 
FOREIGN KEY (program_id) 
REFERENCES public.programs(id) 
ON DELETE CASCADE;
