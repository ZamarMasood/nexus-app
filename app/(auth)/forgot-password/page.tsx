'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { sendOtpAction, type SendOtpState } from './actions';
import { ArrowLeft, Mail, Sun, Moon, CheckCircle, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { createBrowserClient } from '@supabase/ssr';

// ── Supabase browser client ──────────────────────────────────────────────────

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Submit button ────────────────────────────────────────────────────────────

function SubmitButton({ label, pendingLabel, disabled }: { label: string; pendingLabel: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;
  return (
    <button
      type="submit"
      disabled={isDisabled}
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
          {pendingLabel}
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">{label}</span>
      )}
    </button>
  );
}

// ── Loading button (for client-side actions) ─────────────────────────────────

function LoadingButton({ label, pendingLabel, loading, onClick }: {
  label: string; pendingLabel: string; loading: boolean; onClick?: () => void;
}) {
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      disabled={loading}
      onClick={onClick}
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
          {pendingLabel}
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">{label}</span>
      )}
    </button>
  );
}

// ── OTP Input (6 individual boxes) ───────────────────────────────────────────

function OtpInput({ value, onChange, inputBg, inputBdr, textH }: {
  value: string;
  onChange: (val: string) => void;
  inputBg: string;
  inputBdr: string;
  textH: string;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, char: string) {
    if (!/^\d*$/.test(char)) return;
    const arr = value.split('');
    arr[index] = char;
    const next = arr.join('').slice(0, 6);
    onChange(next);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  }

  return (
    <div className="flex justify-center gap-2.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="size-12 rounded-xl text-center text-xl font-bold outline-none transition-[border-color,box-shadow] duration-200 focus:border-violet-500/65 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textH }}
        />
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const SEND_INITIAL: SendOtpState = { error: null, success: false };

export default function ForgotPasswordPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Step state
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  // Server action for user check
  const [sendState, sendAction] = useFormState(sendOtpAction, SEND_INITIAL);

  // After server confirms user exists → send OTP via Supabase client
  useEffect(() => {
    if (sendState.success && sendState.email) {
      setEmail(sendState.email);
      sendSupabaseOtp(sendState.email);
    }
  }, [sendState.success, sendState.email]);

  async function sendSupabaseOtp(emailAddr: string) {
    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: emailAddr });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep('otp');
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    setStep('password');
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = (formData.get('password') as string)?.trim();
    const confirmPassword = (formData.get('confirm_password') as string)?.trim();

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // Sign out so they can log in fresh with the new password
    await supabase.auth.signOut();
    setResetDone(true);
  }

  async function handleResendOtp() {
    setOtp('');
    setError(null);
    await sendSupabaseOtp(email);
  }

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

  const headings: Record<string, { title: string; sub: string }> = {
    email: { title: 'Reset password', sub: 'Enter your email to receive a verification code' },
    otp: { title: 'Enter code', sub: `We sent a 6-digit code to ${email}` },
    password: { title: 'New password', sub: 'Choose a strong password for your account' },
  };

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
          className="card-in relative z-10 w-full max-w-[420px] rounded-3xl p-8"
          style={{ background: cardBg, border: `1px solid ${cardBdr}`, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: cardShadow }}
        >
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.9)'}, transparent)` }} />

          {/* Step indicators */}
          {!resetDone && (
            <div className="s1 mb-6 flex items-center justify-center gap-2">
              {(['email', 'otp', 'password'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-300"
                    style={{
                      background: step === s ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      color: step === s ? '#fff' : textSub,
                      boxShadow: step === s ? '0 2px 12px rgba(124,58,237,0.4)' : 'none',
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < 2 && (
                    <div className="h-px w-8" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Heading */}
          {!resetDone && (
            <div className="s1 mb-7 flex flex-col items-center gap-4 text-center">
              <div
                className="flex size-12 items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                  boxShadow: '0 0 0 1px rgba(124,58,237,0.5), 0 8px 32px rgba(124,58,237,0.4)',
                }}
              >
                {step === 'email' && <Mail size={20} className="text-white" />}
                {step === 'otp' && <KeyRound size={20} className="text-white" />}
                {step === 'password' && <Lock size={20} className="text-white" />}
              </div>
              <div>
                <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]"
                  style={{ color: textH, fontFamily: 'var(--font-display)' }}>
                  {headings[step].title}
                </h1>
                <p className="mt-1 text-[13px]" style={{ color: textSub }}>
                  {headings[step].sub}
                </p>
              </div>
            </div>
          )}

          {/* ── Success (after password reset) ──────────────────────────── */}
          {resetDone && (
            <div className="s1">
              <div className="mb-7 flex flex-col items-center gap-4 text-center">
                <div
                  className="flex size-12 items-center justify-center rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 32px rgba(16,185,129,0.4)' }}
                >
                  <CheckCircle size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]"
                    style={{ color: textH, fontFamily: 'var(--font-display)' }}>
                    Password updated
                  </h1>
                  <p className="mt-1 text-[13px]" style={{ color: textSub }}>
                    Your password has been reset successfully
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-[14px] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:scale-[1.015] active:scale-[0.985]"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                  boxShadow: '0 4px 24px rgba(124,58,237,0.4), 0 1px 0 rgba(255,255,255,0.1) inset',
                }}
              >
                Go to Login
              </Link>
            </div>
          )}

          {/* Error */}
          {(error || sendState.error) && !resetDone && (
            <div className="s1 mb-5 rounded-xl px-4 py-3 text-[13px]"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              {error || sendState.error}
            </div>
          )}

          {/* ── Step 1: Email ──────────────────────────────────────────── */}
          {step === 'email' && !resetDone && (
            <form action={sendAction} className="space-y-4">
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
                <SubmitButton label="Send Verification Code" pendingLabel="Checking…" disabled={loading} />
              </div>
            </form>
          )}

          {/* Loading overlay for OTP send */}
          {step === 'email' && loading && !resetDone && (
            <div className="mt-4 flex items-center justify-center gap-2 text-[13px]" style={{ color: textSub }}>
              <span className="size-4 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
              Sending verification code…
            </div>
          )}

          {/* ── Step 2: OTP ────────────────────────────────────────────── */}
          {step === 'otp' && !resetDone && (
            <>
              <div className="s2 space-y-5">
                <OtpInput value={otp} onChange={setOtp} inputBg={inputBg} inputBdr={inputBdr} textH={textH} />
                <div className="pt-1">
                  <LoadingButton label="Verify Code" pendingLabel="Verifying…" loading={loading} onClick={handleVerifyOtp} />
                </div>
              </div>
              <button
                onClick={handleResendOtp}
                disabled={loading}
                className="s4 mt-4 w-full text-center text-[13px] font-medium transition-opacity duration-150 hover:opacity-70 disabled:opacity-40"
                style={{ color: isDark ? 'rgba(167,139,250,0.9)' : '#7c3aed' }}
              >
                Didn&apos;t receive a code? Send again
              </button>
            </>
          )}

          {/* ── Step 3: New Password ───────────────────────────────────── */}
          {step === 'password' && !resetDone && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="s2">
                <label className="mb-1.5 block text-[12px] font-medium" style={{ color: textSub }}>New Password</label>
                <div className="relative">
                  <input
                    name="password" type={showPassword ? 'text' : 'password'} required minLength={6}
                    placeholder="Min. 6 characters"
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
              <div className="s3">
                <label className="mb-1.5 block text-[12px] font-medium" style={{ color: textSub }}>Confirm Password</label>
                <input
                  name="confirm_password" type={showPassword ? 'text' : 'password'} required minLength={6}
                  placeholder="Repeat new password"
                  className="login-input"
                  style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textH }}
                />
              </div>
              <div className="s4 pt-1">
                <LoadingButton label="Reset Password" pendingLabel="Resetting…" loading={loading} />
              </div>
            </form>
          )}

          {/* Back link */}
          {!resetDone && (
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