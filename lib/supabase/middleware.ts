import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  // If env vars are misconfigured, skip Supabase auth instead of crashing
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !(supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))
  ) {
    console.error(
      'Supabase middleware: invalid configuration. ' +
        `NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}", ` +
        `NEXT_PUBLIC_SUPABASE_ANON_KEY set=${Boolean(supabaseAnonKey)}`
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect authenticated routes
  const protectedRoutes = ['/dashboard', '/create', '/books'];
  const isProtected = protectedRoutes.some((r) => request.nextUrl.pathname.startsWith(r));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  const authRoutes = ['/auth/login', '/auth/signup'];
  if (authRoutes.some((r) => request.nextUrl.pathname.startsWith(r)) && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
