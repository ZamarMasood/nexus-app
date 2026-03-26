'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { forgotPasswordAction, type ForgotPasswordState } from './actions';
import { Layers, ArrowLeft, Mail, Sun, Moon, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
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
      {pending ? (
        <span className="flex items-center justify-center gap-2.5">
          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Sending…
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <Mail className="size-4" />
          Send Reset Link
        </span>
      )}
    </button>
  );
}

const initialState: ForgotPasswordState = { error: null, success: null };

export default function ForgotPasswordPage() {
  const [state, action] = useFormState(forgotPasswordAction, initialState);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

        {/* Back to login */}
        <Link
          href="/login"
          className="s1 group absolute top-5 left-5 z-20 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-[background-color,transform,box-shadow] duration-200 hover:bg-violet-500/10 hover:shadow-[0_0_16px_rgba(124,58,237,0.18)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          style={{ color: textSub, border: `1px solid ${cardBdr}`, backdropFilter: 'blur(8px)', background: cardBg }}
        >
          <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back to login
        </Link>

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
                Reset password
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: textSub }}>
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>
          </div>

          {/* Success message */}
          {state.success && (
            <div className="s1 mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px]"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
              <CheckCircle size={16} className="shrink-0" />
              {state.success}
            </div>
          )}

          {/* Error */}
          {state.error && (
            <div className="s1 mb-5 rounded-xl px-4 py-3 text-[13px]"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              {state.error}
            </div>
          )}

          {!state.success && (
            <form action={action} className="space-y-4">
              <div className="s2">
                <label className="mb-1.5 block text-[12px] font-medium" style={{ color: textSub }}>Email Address</label>
                <input
                  name="email" type="email" required autoComplete="email"
                  placeholder="alex@acme.com"
                  className="login-input"
                  style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textH }}
                />
              </div>

              <div className="s3 pt-1">
                <SubmitButton />
              </div>
            </form>
          )}

          {/* Back link */}
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
        </div>
      </div>
    </>
  );
}
