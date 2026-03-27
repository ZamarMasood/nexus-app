import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Portal routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/portal')) {
    // Portal login page is public
    if (pathname === '/portal/login') return withSecurityHeaders(NextResponse.next());

    const portalClientId = request.cookies.get('portal_client_id');
    if (!portalClientId?.value) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify CSRF token cookie is present alongside the session cookie
    const csrfToken = request.cookies.get('portal_csrf_token');
    if (!csrfToken?.value) {
      // Missing CSRF token — force re-login to get a fresh token pair
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('portal_client_id');
      return response;
    }

    return withSecurityHeaders(NextResponse.next());
  }

  // ── Dashboard routes ──────────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    // Portal (client) sessions must never access dashboard
    const portalClientId = request.cookies.get('portal_client_id');
    if (portalClientId?.value) {
      return NextResponse.redirect(new URL('/portal/tasks', request.url));
    }

    // Check Supabase Auth (team session)
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Clear stale auth cookies to prevent refresh-token loop
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
          response.cookies.delete(cookie.name);
        }
      });
      return response;
    }

    return withSecurityHeaders(supabaseResponse);
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  // Public routes (not listed here, so middleware never runs on them):
  //   /login, /signup, /setup-org, /portal/login, and all other non-dashboard/portal paths
  matcher: ['/dashboard/:path*', '/portal/:path*'],
};
