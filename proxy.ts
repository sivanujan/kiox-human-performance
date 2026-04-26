import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Helper to check if profile is complete
function isProfileComplete(profile: any): boolean {
  const requiredFields = [
    'first_name',
    'last_name',
    'username',
    'date_of_birth',
    'phone_number',
    'address',
    'country',
    'emergency_contact_name',
    'emergency_contact_phone',
    'height',
    'weight',
    'position_played',
    'training_goals',
  ];

  return requiredFields.every(field => {
    const value = profile?.[field];
    return value !== null && value !== undefined && value !== '';
  });
}

const PROFILE_FIELDS = 'first_name, last_name, username, date_of_birth, phone_number, address, country, emergency_contact_name, emergency_contact_phone, height, weight, position_played, training_goals, role';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // For API routes: just refresh the session token so RLS (auth.uid()) works, then continue
  if (path.startsWith('/api/')) {
    return response;
  }

  // Protected routes
  const isAdminPath = path.startsWith('/admin');
  const isStaffPath = path.startsWith('/staff');
  const isDashboardPath = path.startsWith('/dashboard');
  const isRegisterPath = path.startsWith('/register');
  const isAuthPath = path.startsWith('/signin') || path.startsWith('/forgot-password') || path.startsWith('/reset-password');

  if (isRegisterPath && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', user.id)
      .single();

    if (profile && isProfileComplete(profile)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPath && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'superadmin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else if (profile?.role === 'staff') {
      return NextResponse.redirect(new URL('/staff', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isAdminPath || isStaffPath || isDashboardPath) {
    if (!user) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select(PROFILE_FIELDS)
        .eq('id', user.id)
        .single();

      if (isDashboardPath) {
        // Only enforce profile completion for athletes. Staff/Admins bypass this flow.
        if (profile?.role === 'athlete' && !isProfileComplete(profile)) {
          return NextResponse.redirect(new URL('/register', request.url));
        }
      }

      if (isAdminPath && profile?.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (isStaffPath && (profile?.role !== 'staff' && profile?.role !== 'superadmin')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (err) {
      console.error("Middleware Safety Intercept:", err);
      // In case of error, continue the request and let the client-side AuthProvider handle the re-fetch
      // This prevents a hard 500 error for the user.
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/staff/:path*',
    '/dashboard/:path*',
    '/register',
    '/api/:path*',
  ],
};
