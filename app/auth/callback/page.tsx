'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Handles Supabase auth redirects for BOTH flows:
 *  - PKCE code exchange (?code=...) — server-initiated signUp / resetPassword
 *  - Implicit / hash fragment (#access_token=...) — email link redirects
 *
 * After establishing a session, triggers workspace provisioning for signup
 * and redirects the user to the appropriate page.
 */
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const next = searchParams.get('next') ?? '/dashboard';
    const type = searchParams.get('type');

    async function handle() {
      // ── 1. Check for errors in the hash fragment ────────────────────────
      const hash = window.location.hash.substring(1);
      if (hash) {
        const hp = new URLSearchParams(hash);
        const hashError = hp.get('error');
        if (hashError) {
          const code = hp.get('error_code') ?? '';
          if (code === 'otp_expired') {
            router.replace('/login?error=link_expired');
          } else {
            router.replace('/login?error=auth_callback_failed');
          }
          return;
        }
      }

      // ── 2. Create browser client (auto-detects hash tokens) ─────────────
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // ── 3. PKCE code exchange (if present) ──────────────────────────────
      const code = searchParams.get('code');
      if (code) {
        const { error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (codeErr) {
          router.replace('/login?error=auth_callback_failed');
          return;
        }
      }

      // ── 4. Hash-fragment flow: manually set session from tokens ─────────
      if (!code && hash) {
        const hp = new URLSearchParams(hash);
        const accessToken = hp.get('access_token');
        const refreshToken = hp.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionErr) {
            router.replace('/login?error=auth_callback_failed');
            return;
          }
        }
      }

      // ── 5. Verify we now have a session ─────────────────────────────────
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login?error=auth_callback_failed');
        return;
      }

      // ── 6. Handle invite → set password first ───────────────────────────
      if (type === 'invite') {
        router.replace('/reset-password');
        return;
      }

      // ── 7. Handle signup → provision workspace via API ──────────────────
      if (type === 'signup') {
        try {
          const res = await fetch('/api/auth/provision-workspace', { method: 'POST' });
          const data = await res.json();
          if (!res.ok) {
            router.replace(`/login?error=${encodeURIComponent(data.error || 'provision_failed')}`);
            return;
          }
        } catch {
          router.replace('/login?error=provision_failed');
          return;
        }
      }

      // ── 8. Redirect to destination ──────────────────────────────────────
      router.replace(next);
    }

    handle();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-sm text-rose-400 max-w-md text-center">
          <p>{error}</p>
          <a href="/login" className="mt-3 inline-block text-violet-400 hover:text-violet-300 font-medium">
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center"
      style={{ background: 'radial-gradient(ellipse 140% 120% at 50% 0%, #2d1060 0%, #1a0845 35%, #120828 65%, #0e0620 100%)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
        <p className="text-sm text-white/45">Verifying your account...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center"
          style={{ background: 'radial-gradient(ellipse 140% 120% at 50% 0%, #2d1060 0%, #1a0845 35%, #120828 65%, #0e0620 100%)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
            <p className="text-sm text-white/45">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
