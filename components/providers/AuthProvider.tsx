"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, SupabaseClient, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Move supabase initialization outside to ensure it remains a singleton across re-renders
const supabase = createClient();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const userRef = useRef<User | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes in milliseconds

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();
      
      if (error) {
        console.error("Profile fetch error:", error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Profile fetch exception:", err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      userRef.current = currentUser;
      setUser(currentUser);
      await fetchProfile(currentUser.id);
    } else {
      userRef.current = null;
      setUser(null);
      setProfile(null);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // 1. Clear local state identity immediately to stop background activity
      userRef.current = null;
      setUser(null);
      setProfile(null);

      // 2. Parallel sign out (Client + Server)
      // We don't 'await' them strictly to prevent one hang from blocking the entire redirect
      Promise.all([
        supabase.auth.signOut(),
        fetch('/api/auth/signout', { method: 'POST' }).catch(() => {})
      ]).catch(err => console.error("Sign-out async warning:", err));
      
      // 3. Force immediate hard redirect
      // Using window.location.href ensures a complete cache and state purge
      window.location.href = "/signin";
      
    } catch (err) {
      console.error("Sign-out protocol failure:", err);
      window.location.href = "/signin";
    } finally {
      // Small delay to ensure redirect is triggered before loading state could potentially flip back
      setTimeout(() => {
        if (typeof window !== 'undefined') setLoading(false);
      }, 100);
    }
  };

  useEffect(() => {
    let mounted = true;
    let authListener: any = null;

    const initializeAuth = async () => {
      try {
        // 1. Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        const initialUser = session?.user ?? null;
        userRef.current = initialUser;
        setUser(initialUser);

        if (initialUser) {
          await fetchProfile(initialUser.id);
        }

        // 2. Setup listener for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
          if (!mounted) return;

          const currentUser = session?.user ?? null;
          
          // Use ref to compare against the absolute latest state, bypassing closure staleness
          if (currentUser?.id !== userRef.current?.id || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            userRef.current = currentUser;
            setUser(currentUser);
            
            if (currentUser) {
              await fetchProfile(currentUser.id);
            } else {
              setProfile(null);
            }
          }
        });

        authListener = subscription;
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authListener) authListener.unsubscribe();
    };
  }, []); // Only run once on mount

  // Inactivity Logout Logic
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Global activity listeners
    const events = ["mousedown", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Verification interval - checks every 30 seconds
    const interval = setInterval(async () => {
      // Check for Remember Me preference
      const rememberMe = localStorage.getItem("kiox_remember_me") === "true";
      
      if (rememberMe) {
        // If Remember Me is active, bypass inactivity logout
        return;
      }

      const now = Date.now();
      const diff = now - lastActivityRef.current;

      if (diff > INACTIVITY_LIMIT) {
        console.log("Inactivity limit exceeded. Signing out...");
        await supabase.auth.signOut();
        router.push("/signin?message=Session expired due to inactivity");
      }
    }, 30000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [user, router]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
