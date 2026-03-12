import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Portal routes (except /portal/login) ────────────────────────────────
  if (pathname.startsWith('/portal') && !pathname.startsWith('/portal/login')) {
    const portalClientId = request.cookies.get('portal_client_id');
    if (!portalClientId?.value) {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }
    return NextResponse.next();
  }

  // ── Dashboard routes ─────────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    // Portal sessions must never access dashboard
    const portalClientId = request.cookies.get('portal_client_id');
    if (portalClientId?.value) {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return supabaseResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*'],
};
