import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance: ReturnType<typeof createBrowserClient> | undefined;

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== "undefined") {
      console.error(
        "CRITICAL: Supabase Configuration Missing. Check .env.local for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
  }

  const clientOptions = {
    global: {
      fetch: (url: RequestInfo | URL, options?: RequestInit) => {
        return fetch(url, { ...options, cache: 'no-store' });
      }
    }
  };

  if (typeof window === "undefined") {
    return createBrowserClient(
      supabaseUrl || "",
      supabaseAnonKey || "",
      clientOptions
    );
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      supabaseUrl || "",
      supabaseAnonKey || "",
      clientOptions
    );
  }

  return supabaseInstance;
};