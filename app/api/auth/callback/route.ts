import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle errors from Supabase (e.g., expired link)
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/signin?error=No authorization code provided", request.url)
    );
  }

  // Create base response
  const response = NextResponse.redirect(new URL("/register", request.url));

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
    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Exchange error:", exchangeError.message);
      return NextResponse.redirect(
        new URL(`/signin?error=${encodeURIComponent(exchangeError.message)}`, request.url)
      );
    }

    return response;
  } catch (err) {
    console.error("Auth callback exception:", err);
    return NextResponse.redirect(
      new URL("/signin?error=Authentication failed. Please try again.", request.url)
    );
  }
}