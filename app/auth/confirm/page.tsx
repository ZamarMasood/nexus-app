'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Handles Supabase auth redirects that use hash fragments (implicit flow).
 * This is needed for invite links where Supabase puts tokens in the URL hash
 * (#access_token=...) which server-side Route Handlers cannot read.
 *
 * The Supabase browser client automatically picks up hash fragment tokens
 * via onAuthStateChange.
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // The Supabase client auto-detects hash fragment tokens on init.
    // Listen for the session to be established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Check if this is an invite flow — user needs to set password
        const hash = window.location.hash;
        if (hash.includes('type=invite')) {
          router.replace('/reset-password');
        } else {
          router.replace('/dashboard');
        }
      }
    });

    // Fallback: if no auth event fires within 5s, something went wrong
    const timeout = setTimeout(() => {
      setError('Authentication failed or link expired. Please request a new invite.');
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-page p-4">
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
    <div className="flex min-h-screen items-center justify-center bg-surface-page">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
        <p className="text-sm text-muted-app">Verifying your invitation...</p>
      </div>
    </div>
  );
}
