-- 1. Extend Training Sessions for Special Events
ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'TACTICAL';

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_is_special ON public.training_sessions(is_special);

-- 3. Notification enhancement
ALTER TABLE public.athlete_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
