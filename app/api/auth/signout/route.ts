import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Sign out from Supabase (this handles server-side session cleanup)
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn("Server-side supabase.auth.signOut warning:", error.message);
    }
  } catch (err: any) {
    console.error("Server-side supabase.auth.signOut exception:", err?.message || err);
  }

  // 2. Clear all Supabase cookies manually as a failsafe to ensure they are wiped
  try {
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith("sb-")) {
        cookieStore.delete(cookie.name);
      }
    });
  } catch (cookieErr) {
    console.error("Failed to delete cookies manually:", cookieErr);
  }

  // 3. Always return success. The client will handle the final redirect to ensure local state is wiped.
  return NextResponse.json({ success: true });
}
