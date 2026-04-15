import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "invite" | "recovery" | "signup" | "email_change" | null;
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle errors from Supabase (e.g., expired link)
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  const next = searchParams.get("next") || "/register";
  const response = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    } else if (token_hash && type) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type,
      });
      if (verifyError) throw verifyError;
    } else {
      // If neither code nor token_hash is present
      return NextResponse.redirect(
        new URL("/signin?error=Invalid authentication link", request.url)
      );
    }

    return response;
  } catch (err: any) {
    console.error("Auth callback exception:", err);
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(err.message || "Authentication failed")}`, request.url)
    );
  }
}