'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signInAction, type TeamLoginState } from './actions';
import { Eye, EyeOff, Layers } from 'lucide-react';
import { useState } from 'react';

const initialState: TeamLoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity duration-150 disabled:opacity-60"
      style={{
        background: 'linear-gradient(135deg, #7759ff 0%, #5e3de0 100%)',
        boxShadow:
          '0 0 0 1px rgba(119,89,255,0.3), 0 4px 24px rgba(119,89,255,0.25)',
      }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Signing in…
        </span>
      ) : (
        'Sign in'
      )}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{ background: '#07071a' }}
    >
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -left-64 -top-64 size-[700px] rounded-full opacity-30"
          style={{
            background:
              'radial-gradient(circle at center, #7759ff 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute -bottom-48 -right-48 size-[600px] rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle at center, #3d2abf 0%, transparent 65%)',
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
              background: 'linear-gradient(135deg, #7759ff 0%, #5e3de0 100%)',
              boxShadow:
                '0 0 0 1px rgba(119,89,255,0.4), 0 8px 32px rgba(119,89,255,0.3)',
            }}
          >
            <Layers size={22} className="text-white" />
          </div>
          <h1
            className="text-4xl text-white"
            style={{
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.03em',
            }}
          >
            Nexus
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7b78a8' }}>
            Team workspace
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
            Welcome back
          </h2>
          <p className="mb-6 text-sm" style={{ color: '#7b78a8' }}>
            Sign in to your team account
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
                style={{ color: '#7b78a8' }}
              >
                Work Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 transition-colors duration-150"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(119,89,255,0.5)';
                  e.target.style.background = 'rgba(119,89,255,0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-widest"
                style={{ color: '#7b78a8' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
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
                    e.target.style.border = '1px solid rgba(119,89,255,0.5)';
                    e.target.style.background = 'rgba(119,89,255,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7759ff]"
                  style={{ color: '#7b78a8' }}
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

        <p className="mt-6 text-center text-xs" style={{ color: '#3d3a5a' }}>
          Secure team access · Nexus Project Management
        </p>
      </div>
    </div>
  );
}
