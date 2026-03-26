'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signupAction, type SignupState } from './actions';
import { Eye, EyeOff, Layers, ArrowRight, Sun, Moon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

/* ─── Submit button ───────────────────────────────────────────────────────── */
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
          Setting up your workspace…
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          Create your workspace
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      )}
    </button>
  );
}

/* ─── Field error ─────────────────────────────────────────────────────────── */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-[12px]" style={{ color: '#fca5a5' }}>
      {message}
    </p>
  );
}

/* ─── Section label ───────────────────────────────────────────────────────── */
function SectionLabel({
  icon: Icon,
  label,
  textSub,
}: {
  icon: React.ElementType;
  label: string;
  textSub: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={13} style={{ color: textSub }} />
      <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: textSub }}>
        {label}
      </span>
    </div>
  );
}

/* ─── Slug generator ──────────────────────────────────────────────────────── */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
const initialState: SignupState = { error: null, fieldErrors: {} };

export default function SignupClient() {
  const [state, action] = useFormState<SignupState, FormData>(signupAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const slugRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const bg         = mounted ? (isDark ? '#120828'                      : '#f5f3ff')     : '#120828';
  const cardBg     = mounted ? (isDark ? 'rgba(255,255,255,0.07)'       : 'rgba(255,255,255,0.72)') : 'rgba(255,255,255,0.07)';
  const cardBdr    = mounted ? (isDark ? 'rgba(255,255,255,0.12)'       : 'rgba(124,58,237,0.18)')  : 'rgba(255,255,255,0.12)';
  const cardShadow = mounted
    ? (isDark
        ? '0 8px 64px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.1) inset'
        : '0 8px 64px rgba(124,58,237,0.15), 0 1px 0 rgba(255,255,255,0.95) inset')
    : '0 8px 64px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.1) inset';
  const textH      = mounted ? (isDark ? '#ffffff'                      : '#180a2e')     : '#ffffff';
  const textSub    = mounted ? (isDark ? 'rgba(255,255,255,0.45)'       : 'rgba(24,10,46,0.45)') : 'rgba(255,255,255,0.45)';
  const inputBg    = mounted ? (isDark ? 'rgba(255,255,255,0.07)'       : 'rgba(255,255,255,0.7)') : 'rgba(255,255,255,0.07)';
  const inputBdr   = mounted ? (isDark ? 'rgba(255,255,255,0.12)'       : 'rgba(124,58,237,0.18)') : 'rgba(255,255,255,0.12)';
  const orbHigh    = mounted ? (isDark ? 'rgba(109,40,217,0.7)'         : 'rgba(124,58,237,0.22)') : 'rgba(109,40,217,0.7)';
  const orbMid     = mounted ? (isDark ? 'rgba(124,58,237,0.6)'         : 'rgba(99,45,220,0.14)') : 'rgba(124,58,237,0.6)';

  function handleCompanyNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugManuallyEdited) {
      setSlug(generateSlug(e.target.value));
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugManuallyEdited(true);
    setSlug(e.target.value);
  }

  return (
    <>
      {/* suppressHydrationWarning: content:'' in CSS is HTML-entity-encoded on server but literal on client */}
      <style suppressHydrationWarning>{`
        @keyframes orb-a { 0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(50px,-70px) scale(1.07)}70%{transform:translate(-30px,35px) scale(0.95)} }
        @keyframes orb-b { 0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(-55px,45px) scale(1.05)}70%{transform:translate(38px,-22px) scale(0.97)} }
        @keyframes orb-c { 0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(28px,50px) scale(1.06)} }
        @keyframes orb-d { 0%,100%{transform:translate(0,0) scale(1)}45%{transform:translate(-42px,-32px) scale(1.04)} }
        @keyframes card-in { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes s-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        .orb-a { animation: orb-a 20s ease-in-out infinite; }
        .orb-b { animation: orb-b 26s ease-in-out infinite; }
        .orb-c { animation: orb-c 16s ease-in-out infinite; }
        .orb-d { animation: orb-d 30s ease-in-out infinite; }

        .card-in { animation: card-in 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .s1 { animation: s-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .s2 { animation: s-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.27s both; }
        .s3 { animation: s-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
        .s4 { animation: s-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.43s both; }
        .s5 { animation: s-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.51s both; }
        .s6 { animation: s-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.58s both; }
        .s7 { animation: s-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.65s both; }

        .signup-input {
          width: 100%;
          border-radius: 12px;
          padding: 13px 16px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .signup-input:focus {
          border-color: rgba(124,58,237,0.65) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
        }
        .signup-input.has-error {
          border-color: rgba(239,68,68,0.5) !important;
        }

        .terms-checkbox {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          min-width: 16px;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
          position: relative;
        }
        .terms-checkbox:checked {
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          border-color: transparent !important;
          box-shadow: 0 0 0 2px rgba(124,58,237,0.3);
        }
        .terms-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 2px;
          width: 5px;
          height: 8px;
          border: 2px solid white;
          border-top: none;
          border-left: none;
          transform: rotate(45deg);
        }
        .terms-checkbox:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.25);
        }

        .divider-line {
          flex: 1;
          height: 1px;
        }
      `}</style>

      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6"
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

        {/* Animated orbs */}
        <div className="orb-a pointer-events-none absolute -top-32 -left-32 size-[750px] rounded-full"
          style={{ background: `radial-gradient(circle at 40% 40%, ${orbHigh} 0%, transparent 62%)`, filter: 'blur(28px)' }} />
        <div className="orb-b pointer-events-none absolute -bottom-32 -right-32 size-[700px] rounded-full"
          style={{ background: `radial-gradient(circle at 55% 55%, ${orbMid} 0%, transparent 62%)`, filter: 'blur(30px)' }} />
        <div className="orb-c pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 size-[600px] rounded-full"
          style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(139,92,246,0.45)' : 'rgba(139,92,246,0.1)'} 0%, transparent 58%)`, filter: 'blur(45px)' }} />
        <div className="orb-d pointer-events-none absolute bottom-0 left-[15%] size-[500px] rounded-full"
          style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(91,33,182,0.55)' : 'rgba(124,58,237,0.1)'} 0%, transparent 60%)`, filter: 'blur(40px)' }} />

        {/* Back button */}
        <Link
          href="/"
          className="s1 group absolute top-5 left-5 z-20 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-[background-color,transform,box-shadow] duration-200 hover:bg-violet-500/10 hover:shadow-[0_0_16px_rgba(124,58,237,0.18)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          style={{ color: textSub, border: `1px solid ${cardBdr}`, backdropFilter: 'blur(8px)', background: cardBg }}
        >
          <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back
        </Link>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="s1 group absolute top-5 right-5 z-20 flex size-9 items-center justify-center rounded-xl transition-[background-color,transform,box-shadow] duration-200 hover:bg-violet-500/10 hover:shadow-[0_0_16px_rgba(124,58,237,0.18)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          style={{ color: textSub, border: `1px solid ${cardBdr}`, backdropFilter: 'blur(8px)', background: cardBg }}
          aria-label="Toggle theme"
        >
          {isDark
            ? <Sun size={15} className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            : <Moon size={15} className="transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
          }
        </button>

        {/* Glass card */}
        <div
          className="card-in relative z-10 w-full max-w-[820px] rounded-3xl p-8"
          style={{
            background: cardBg,
            border: `1px solid ${cardBdr}`,
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: cardShadow,
          }}
        >
          {/* Top highlight */}
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.9)'}, transparent)` }} />

          {/* Logo + heading */}
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
                Create your workspace
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: textSub }}>
                Set up Nexus for your team in seconds
              </p>
            </div>
          </div>

          {/* Global error */}
          {state.error && (
            <div className="s1 mb-5 rounded-xl px-4 py-3 text-[13px]"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              {state.error}
            </div>
          )}

          <form action={action}>
            {/* ── Field label helper ───────────────────────────────────────── */}
            {/* Row 1: Company Name | Full Name */}
            <div className="s2 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium" style={{ color: textSub }}>Company Name</label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  autoComplete="organization"
                  placeholder="Acme Ltd"
                  onChange={handleCompanyNameChange}
                  className={`signup-input${state.fieldErrors?.companyName ? ' has-error' : ''}`}
                  style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textH }}
                />
                <FieldError message={state.fieldErrors?.companyName} />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium" style={{ color: textSub }}>Workspace URL</label>
                <input
                  ref={slugRef}
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  placeholder="acme-ltd"
                  value={slug}
                  onChange={handleSlugChange}
                  className={`signup-input${state.fieldErrors?.slug ? ' has-error' : ''}`}
                  style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textH }}
                />
                {slug && (
                  <p className="mt-1.5 text-[12px]" style={{ color: textSub }}>
                    app.nexus.com/<span style={{ color: isDark ? 'rgba(167,139,250,0.9)' : '#7c3aed' }}>{slug}</span>
                  </p>
                )}
                <FieldError message={state.fieldErrors?.slug} />
              </div>

              {/* Row 2: Full Name | Email */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium" style={{ color: textSub }}>Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Alex Johnson"
                  className={`signup-input${state.fieldErrors?.fullName ? ' has-error' : ''}`}
                  style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textH }}
                />
                <FieldError message={state.fieldErrors?.fullName} />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium" style={{ color: textSub }}>Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="alex@acme.com"
                  className={`signup-input${state.fieldErrors?.email ? ' has-error' : ''}`}
                  style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textH }}
                />
                <FieldError message={state.fieldErrors?.email} />
              </div>

              {/* Row 3: Password | Confirm Password */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium" style={{ color: textSub }}>Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className={`signup-input${state.fieldErrors?.password ? ' has-error' : ''}`}
                    style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textH, paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-150 hover:opacity-70 active:scale-90 focus-visible:outline-none"
                    style={{ color: textSub }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <FieldError message={state.fieldErrors?.password} />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium" style={{ color: textSub }}>Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    className={`signup-input${state.fieldErrors?.confirmPassword ? ' has-error' : ''}`}
                    style={{ background: inputBg, border: `1px solid ${inputBdr}`, color: textH, paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-150 hover:opacity-70 active:scale-90 focus-visible:outline-none"
                    style={{ color: textSub }}
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <FieldError message={state.fieldErrors?.confirmPassword} />
              </div>
            </div>

            {/* ── Terms + Submit (full width) ──────────────────────────────── */}
            <div className="mt-5 space-y-4">
              <div className="s5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="terms"
                    checked={termsChecked}
                    onChange={e => setTermsChecked(e.target.checked)}
                    className="terms-checkbox mt-0.5"
                    style={{ border: `1.5px solid ${inputBdr}`, background: inputBg }}
                  />
                  <span className="text-[13px] leading-relaxed" style={{ color: textSub }}>
                    I agree to the{' '}
                    <span className="transition-opacity duration-150 hover:opacity-70" style={{ color: isDark ? 'rgba(167,139,250,0.9)' : '#7c3aed' }}>
                      Terms of Service
                    </span>
                    {' '}and{' '}
                    <span className="transition-opacity duration-150 hover:opacity-70" style={{ color: isDark ? 'rgba(167,139,250,0.9)' : '#7c3aed' }}>
                      Privacy Policy
                    </span>
                  </span>
                </label>
                <FieldError message={state.fieldErrors?.terms} />
              </div>

              <div className="s6">
                <SubmitButton />
              </div>
            </div>
          </form>

          {/* Sign in link */}
          <div className="s7 mt-6 flex items-center gap-3">
            <div className="divider-line" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(124,58,237,0.1)' }} />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: textSub }}>Nexus</span>
            <div className="divider-line" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(124,58,237,0.1)' }} />
          </div>

          <p className="s7 mt-4 text-center text-[13px]" style={{ color: textSub }}>
            Already have an account?{' '}
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