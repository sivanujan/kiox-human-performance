-- 1. Create the `profiles` table in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Step 3: Personal Info
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  date_of_birth DATE,

  -- Step 4: Contact Info
  phone_number TEXT,
  address TEXT,
  country TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  -- Step 5: Training Profile
  height NUMERIC,      -- In cm or inches
  weight NUMERIC,      -- In kg or lbs
  position_played TEXT,
  training_goals TEXT,
  medical_history TEXT,
  waiver_accepted BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow profile creation during registration (Supabase Service Role or Authenticated)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. Create an automatic profile on user signup (Optional but recommended)
-- This function will trigger whenever a user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger that calls the function
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
