import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Sign out from Supabase (this handles server-side session cleanup)
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Server-side signout error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Return success. The client will handle the final redirect to ensure local state is wiped.
  return NextResponse.json({ success: true });
}
