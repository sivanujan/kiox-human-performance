import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client using the SERVICE_ROLE key.
 * This bypasses RLS and should ONLY be used in server-side API routes
 * that perform their own authorization checks.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
