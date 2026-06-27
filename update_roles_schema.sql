-- 1. Add roles and status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'athlete' CHECK (role IN ('athlete', 'staff', 'superadmin')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
ADD COLUMN IF NOT EXISTS assigned_staff UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_program UUID;

-- 2. Create Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  level TEXT CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
  category TEXT CHECK (category IN ('Speed & Agility', 'Strength', 'Goalkeeper', 'Technique', 'Nutrition', 'Psychology', 'Full Program')),
  price NUMERIC,
  max_athletes INTEGER, 
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Create Bookings/Assignments Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES auth.users(id) NOT NULL,
  program_id UUID REFERENCES public.programs(id),
  booking_type TEXT CHECK (booking_type IN ('assessment', 'program', 'consultation')) DEFAULT 'assessment',
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  preferred_date DATE,
  preferred_time TEXT,
  confirmed_date DATE,
  confirmed_time TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS for new tables
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Programs
CREATE POLICY "Anyone can view active programs" ON public.programs
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage programs" ON public.programs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- 6. RLS Policies for Bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
FOR SELECT USING (auth.uid() = athlete_id);

CREATE POLICY "Staff can view assigned athlete bookings" ON public.bookings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'staff' OR role = 'superadmin')
  )
);

-- 7. Update handle_new_user to ensure default role/status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, status)
  VALUES (new.id, 'athlete', 'pending');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
