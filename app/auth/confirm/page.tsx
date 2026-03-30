'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Layers } from 'lucide-react';
import { provisionSignupAction } from './actions';

/**
 * Handles Supabase auth redirects that use the implicit flow (hash fragments).
 * Server-side Route Handlers cannot read URL hash fragments, so any emailRedirectTo
 * that Supabase resolves with tokens in the hash must point here instead.
 *
 * Handles: type=signup, type=recovery, type=invite
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Verifying…');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleHashTokens() {
      const hash = window.location.hash.substring(1);
      if (!hash) {
        router.replace('/login?error=auth_callback_failed');
        return;
      }

      const params      = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token') ?? '';
      const type        = params.get('type');

      if (!accessToken) {
        router.replace('/login?error=auth_callback_failed');
        return;
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Establish session from hash tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token:  accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError('Authentication failed or link expired. Please try again.');
        return;
      }

      // Clear tokens from the URL bar without a page reload
      window.history.replaceState(null, '', window.location.pathname);

      if (type === 'signup') {
        setMessage('Setting up your workspace…');
        const result = await provisionSignupAction();
        if (result.error) {
          setError(result.error);
          return;
        }
        router.replace(result.redirectTo);
      } else if (type === 'recovery') {
        router.replace('/auth/reset-password');
      } else if (type === 'invite') {
        // Invited users must set their own password first
        router.replace('/auth/reset-password');
      } else {
        // Non-signup, non-recovery flow — redirect to dashboard (middleware will handle slug redirect)
        router.replace('/dashboard');
      }
    }

    handleHashTokens();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4"
        style={{ background: 'radial-gradient(ellipse 140% 120% at 50% 0%, #2d1060 0%, #1a0845 35%, #120828 65%, #0e0620 100%)' }}>
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-sm text-rose-400">
            {error}
          </div>
          <a
            href="/login"
            className="inline-block text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            ← Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'radial-gradient(ellipse 140% 120% at 50% 0%, #2d1060 0%, #1a0845 35%, #120828 65%, #0e0620 100%)' }}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            background:  'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
            boxShadow:   '0 0 0 1px rgba(124,58,237,0.5), 0 8px 32px rgba(124,58,237,0.4)',
          }}
        >
          <Layers size={20} className="text-white" />
        </div>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
        <p className="text-sm text-white/50">{message}</p>
      </div>
    </div>
  );
}
