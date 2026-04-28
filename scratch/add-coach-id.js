const { createClient } = require('@supabase/supabase-js');

async function migrate() {
  // Use service role key for direct SQL or just use the client if we have a helper
  // But wait, I don't have a direct SQL rpc by default.
  // I'll check if I can just use the supabase CLI to run a migration.
  console.log("Please run this SQL in your Supabase SQL Editor:");
  console.log("ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.profiles(id);");
}

migrate();
