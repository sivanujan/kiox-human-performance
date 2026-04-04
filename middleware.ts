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

export async function middleware(request: NextRequest) {
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
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isAdminPath || isStaffPath || isDashboardPath) {
    if (!user) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', user.id)
      .single();

    if (isDashboardPath) {
      if (!profile || !isProfileComplete(profile)) {
        return NextResponse.redirect(new URL('/register', request.url));
      }
    }

    if (isAdminPath && profile?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isStaffPath && (profile?.role !== 'staff' && profile?.role !== 'superadmin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
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
  ],
};
