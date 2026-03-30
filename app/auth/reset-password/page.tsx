'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { createBrowserClient } from '@supabase/ssr';
import { Layers, Eye, EyeOff, Lock, Sun, Moon, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const bg         = mounted ? (isDark ? '#120828' : '#f5f3ff') : '#120828';
  const cardBg     = mounted ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.72)') : 'rgba(255,255,255,0.07)';
  const cardBdr    = mounted ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.18)') : 'rgba(255,255,255,0.12)';
  const cardShadow = mounted
    ? (isDark
        ? '0 8px 64px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.1) inset'
        : '0 8px 64px rgba(124,58,237,0.15), 0 1px 0 rgba(255,255,255,0.95) inset')
    : '0 8px 64px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.1) inset';
  const textH      = mounted ? (isDark ? '#ffffff' : '#180a2e') : '#ffffff';
  const textSub    = mounted ? (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(24,10,46,0.45)') : 'rgba(255,255,255,0.45)';
  const inputBg    = mounted ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)') : 'rgba(255,255,255,0.07)';
  const inputBdr   = mounted ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.18)') : 'rgba(255,255,255,0.12)';
  const orbHigh    = mounted ? (isDark ? 'rgba(109,40,217,0.7)' : 'rgba(124,58,237,0.22)') : 'rgba(109,40,217,0.7)';
  const orbMid     = mounted ? (isDark ? 'rgba(124,58,237,0.6)' : 'rgba(99,45,220,0.14)') : 'rgba(124,58,237,0.6)';

  // Check for a valid session on mount (user must have arrived via reset/invite link).
  // Supabase may use the implicit flow and deliver the token in the URL hash fragment
  // (#access_token=...&type=recovery) instead of a PKCE code — handle both cases.
  useEffect(() => {
    async function verifySession() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Parse hash fragment for implicit-flow tokens
      const hash = window.location.hash.slice(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (accessToken && type === 'recovery') {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (sessionError) {
            router.replace('/login?error=session_expired');
            return;
          }
          // Clear the tokens from the URL without a page reload
          window.history.replaceState(null, '', window.location.pathname);
          setChecking(false);
          return;
        }
      }

      // PKCE flow — session already set by the server-side callback
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login?error=session_expired');
        return;
      }
      setChecking(false);
    }
    verifySession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to dashboard after a short delay
    setTimeout(() => router.push('/dashboard'), 2000);
  }

  // Show spinner while verifying session
  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse 140% 120% at 50% 0%, #2d1060 0%, #1a0845 35%, #120828 65%, #0e0620 100%)',
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
          <p className="text-sm text-white/45">Verifying your session...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes orb-a { 0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(50px,-70px) scale(1.07)}70%{transform:translate(-30px,35px) scale(0.95)} }
        @keyframes orb-b { 0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(-55px,45px) scale(1.05)}70%{transform:translate(38px,-22px) scale(0.97)} }
        @keyframes card-in { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes s-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .orb-a { animation: orb-a 20s ease-in-out infinite; }
        .orb-b { animation: orb-b 26s ease-in-out infinite; }
        .card-in { animation: card-in 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .s1 { animation: s-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .s2 { animation: s-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.27s both; }
        .s3 { animation: s-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
        .s4 { animation: s-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.43s both; }
        .login-input {
          width: 100%; border-radius: 12px; padding: 13px 16px; font-size: 14px;
          outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .login-input:focus {
          border-color: rgba(124,58,237,0.65) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
        }
      `}</style>

      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 140% 120% at 50% 0%, #2d1060 0%, #1a0845 35%, #120828 65%, #0e0620 100%)'
            : bg,
        }}
      >
        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.12)'} 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Orbs */}
        <div className="orb-a pointer-events-none absolute -top-32 -left-32 size-[750px] rounded-full"
          style={{ background: `radial-gradient(circle at 40% 40%, ${orbHigh} 0%, transparent 62%)`, filter: 'blur(28px)' }} />
        <div className="orb-b pointer-events-none absolute -bottom-32 -right-32 size-[700px] rounded-full"
          style={{ background: `radial-gradient(circle at 55% 55%, ${orbMid} 0%, transparent 62%)`, filter: 'blur(30px)' }} />

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="s1 group absolute top-5 right-5 z-20 flex size-9 items-center justify-center rounded-xl transition-[background-color,transform,box-shadow] duration-200 hover:bg-violet-500/10 hover:shadow-[0_0_16px_rgba(124,58,237,0.18)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          style={{ color: textSub, border: `1px solid ${cardBdr}`, backdropFilter: 'blur(8px)', background: cardBg }}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Card */}
        <div
          className="card-in relative z-10 w-full max-w-[400px] rounded-3xl p-8"
          style={{ background: cardBg, border: `1px solid ${cardBdr}`, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: cardShadow }}
        >
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.9)'}, transparent)` }} />

          {/* Heading */}
          <div className="s1 mb-7 flex flex-col items-center gap-4 text-center">
            <div
              className="flex size-12 items-center justify-center rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                boxShadow: '0 0 0 1px rgba(124,58,237,0.5), 0 8px 32px rgba(124,58,237,0.4)',
              }}
            >
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]"
                style={{ color: textH, fontFamily: 'var(--font-display)' }}>
                {success ? 'Password updated' : 'Set new password'}
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: textSub }}>
                {success ? 'Redirecting you to the dashboard…' : 'Choose a strong password for your account'}
              </p>
            </div>
          </div>

          {/* Success */}
          {success && (
            <div className="s1 flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px]"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
              <CheckCircle size={16} className="shrink-0" />
              Your password has been updated successfully.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="s1 mb-5 rounded-xl px-4 py-3 text-[13px]"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="s2">
                <label className="mb-1.5 block text-[12px] font-medium" style={{ color: textSub }}>New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="login-input"
                    style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textH, paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-150 hover:opacity-70 active:scale-90 focus-visible:outline-none"
                    style={{ color: textSub }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="s3">
                <label className="mb-1.5 block text-[12px] font-medium" style={{ color: textSub }}>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  className="login-input"
                  style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textH }}
                />
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="s3 flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="h-1 w-8 rounded-full"
                        style={{
                          background: password.length >= level * 3
                            ? password.length >= 12 ? '#34d399' : password.length >= 8 ? '#fbbf24' : '#f87171'
                            : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          transition: 'background 0.3s',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px]" style={{ color: textSub }}>
                    {password.length < 6 ? 'Too short' : password.length < 8 ? 'Weak' : password.length < 12 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}

              <div className="s4 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl py-3.5 text-[14px] font-semibold text-white transition-[transform,box-shadow] duration-200 disabled:opacity-60 hover:scale-[1.015] hover:shadow-[0_8px_40px_rgba(124,58,237,0.5)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                    boxShadow: '0 4px 24px rgba(124,58,237,0.4), 0 1px 0 rgba(255,255,255,0.1) inset',
                  }}
                >
                  <span
                    className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }}
                  />
                  {loading ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Updating…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="size-4" />
                      Update Password
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}

          {!success && (
            <p className="s4 mt-6 text-center text-[13px]" style={{ color: textSub }}>
              Remember your password?{' '}
              <Link
                href="/login"
                className="font-medium transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:underline"
                style={{ color: isDark ? 'rgba(167,139,250,0.9)' : '#7c3aed' }}
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}