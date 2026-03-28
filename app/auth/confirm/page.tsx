'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Handles Supabase auth redirects that use hash fragments (implicit flow).
 * This is needed for invite links where Supabase puts tokens in the URL hash
 * (#access_token=...) which server-side Route Handlers cannot read.
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleHashTokens() {
      const hash = window.location.hash.substring(1); // remove leading #
      if (!hash) {
        setError('No authentication data found. The link may have expired.');
        return;
      }

      // Parse hash fragment into key-value pairs
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (!accessToken || !refreshToken) {
        setError('Invalid authentication link. Please request a new invite.');
        return;
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Manually set the session from the hash fragment tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError('Authentication failed or link expired. Please request a new invite.');
        return;
      }

      // Invited users need to set their password first
      if (type === 'invite') {
        router.replace('/auth/reset-password');
      } else {
        router.replace('/dashboard');
      }
    }

    handleHashTokens();
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
