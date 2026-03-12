'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { portalSignInAction, type PortalLoginState } from './actions';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { useState } from 'react';

const initialState: PortalLoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity duration-150 disabled:opacity-60"
      style={{
        background: 'linear-gradient(135deg, #00b8a0 0%, #0087a0 100%)',
        boxShadow:
          '0 0 0 1px rgba(0,184,160,0.3), 0 4px 24px rgba(0,184,160,0.22)',
      }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Verifying…
        </span>
      ) : (
        'Access Portal'
      )}
    </button>
  );
}

export default function PortalLoginPage() {
  const [state, action] = useFormState(portalSignInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{ background: '#06131a' }}
    >
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -right-64 -top-64 size-[700px] rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle at center, #00b8a0 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute -bottom-48 -left-48 size-[550px] rounded-full opacity-15"
          style={{
            background:
              'radial-gradient(circle at center, #0087a0 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px]">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center">
          <div
            className="mb-4 flex size-12 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #00b8a0 0%, #0087a0 100%)',
              boxShadow:
                '0 0 0 1px rgba(0,184,160,0.4), 0 8px 32px rgba(0,184,160,0.25)',
            }}
          >
            <Building2 size={22} className="text-white" />
          </div>

          {/* Badge */}
          <div
            className="mb-2 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{
              background: 'rgba(0,184,160,0.12)',
              border: '1px solid rgba(0,184,160,0.25)',
              color: '#00b8a0',
            }}
          >
            Client Portal
          </div>

          <h1
            className="text-4xl text-white"
            style={{
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.03em',
            }}
          >
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#6b8a8d' }}>
            Access your projects and invoices
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow:
              '0 2px 2px rgba(0,0,0,0.3), 0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          <h2
            className="mb-1 text-xl font-semibold text-white"
            style={{ letterSpacing: '-0.01em' }}
          >
            Sign in
          </h2>
          <p className="mb-6 text-sm" style={{ color: '#6b8a8d' }}>
            Enter your credentials to continue
          </p>

          <form action={action} className="space-y-4">
            {state.error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5',
                }}
              >
                {state.error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-widest"
                style={{ color: '#6b8a8d' }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 transition-colors duration-150"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(0,184,160,0.45)';
                  e.target.style.background = 'rgba(0,184,160,0.07)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                }}
              />
            </div>

            {/* Portal password */}
            <div className="space-y-1.5">
              <label
                htmlFor="portal_password"
                className="block text-xs font-medium uppercase tracking-widest"
                style={{ color: '#6b8a8d' }}
              >
                Portal Password
              </label>
              <div className="relative">
                <input
                  id="portal_password"
                  name="portal_password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white outline-none placeholder:text-white/20 transition-colors duration-150"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(0,184,160,0.45)';
                    e.target.style.background = 'rgba(0,184,160,0.07)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b8a0]"
                  style={{ color: '#6b8a8d' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <SubmitButton />
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: '#2d4a4d' }}>
          Need access?{' '}
          <span style={{ color: '#6b8a8d' }}>
            Contact your project manager for credentials.
          </span>
        </p>
      </div>
    </div>
  );
}
