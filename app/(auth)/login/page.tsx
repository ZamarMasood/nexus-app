'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signInAction, type LoginState } from './actions';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 w-full py-2 rounded-md text-[13px] font-medium text-white
        bg-[#5e6ad2] hover:bg-[#6872e5] active:scale-[0.99]
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[rgba(94,106,210,0.35)]
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Signing in...' : 'Continue'}
    </button>
  );
}

const initialState: LoginState = { error: null };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [state, action] = useFormState<LoginState, FormData>(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const verifyEmail = searchParams.get('verify') === 'email';
  const errorParam = searchParams.get('error');
  const [hashOtpExpired, setHashOtpExpired] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('error_code=otp_expired') || (hash.includes('error=access_denied') && hash.includes('expired'))) {
      setHashOtpExpired(true);
      return;
    }
    if (hash.includes('access_token=') && (hash.includes('type=signup') || hash.includes('type=recovery') || hash.includes('type=invite'))) {
      window.location.replace('/auth/confirm' + window.location.hash);
    }
  }, []);

  const isLinkExpired = errorParam === 'link_expired' || hashOtpExpired;
  const authError = errorParam === 'auth_callback_failed' && !isLinkExpired;

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <span className="text-[18px] font-medium text-[#f0f0f0] tracking-[-0.02em]">
            Nexus
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#161616] border border-[rgba(255,255,255,0.10)]
          rounded-lg p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">

          <h1 className="text-[18px] font-medium text-[#f0f0f0] tracking-[-0.02em] mb-1">
            Welcome back
          </h1>
          <p className="text-[13px] text-[#8a8a8a] mb-6">
            Sign in to your workspace
          </p>

          {/* Verify email banner */}
          {verifyEmail && (
            <div className="mb-4 rounded-md px-3 py-2.5 text-[13px] text-[#26c97f]
              bg-[rgba(38,201,127,0.1)] border border-[rgba(38,201,127,0.2)]">
              Account created! Check your email to verify, then sign in.
            </div>
          )}

          {authError && (
            <div className="mb-4 rounded-md px-3 py-2.5 text-[13px] text-[#e5484d]
              bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.2)]">
              Email verification failed. Please try again.
            </div>
          )}

          {isLinkExpired && (
            <div className="mb-4 rounded-md px-3 py-2.5 text-[13px] text-[#e5484d]
              bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.2)]">
              Your password reset link has expired.{' '}
              <Link href="/forgot-password" className="underline underline-offset-2 hover:opacity-80">
                Request a new one
              </Link>.
            </div>
          )}

          {state?.error && (
            <p className="mb-4 text-[13px] text-[#e5484d]">{state.error}</p>
          )}

          <form action={action} className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-[#8a8a8a]
                uppercase tracking-[0.04em] mb-1.5">
                Email
              </label>
              <input
                name="email" type="email" required autoComplete="email"
                placeholder="alex@acme.com"
                className="w-full px-3 py-2 rounded-md
                  bg-[#1a1a1a] border border-[rgba(255,255,255,0.10)]
                  text-[#f0f0f0] text-[13px] placeholder:text-[#555]
                  focus:outline-none focus:border-[rgba(255,255,255,0.16)]
                  focus:ring-1 focus:ring-[rgba(94,106,210,0.35)]
                  transition-colors duration-150"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#8a8a8a]
                uppercase tracking-[0.04em] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required autoComplete="current-password"
                  placeholder="Your password"
                  className="w-full px-3 py-2 rounded-md
                    bg-[#1a1a1a] border border-[rgba(255,255,255,0.10)]
                    text-[#f0f0f0] text-[13px] placeholder:text-[#555]
                    focus:outline-none focus:border-[rgba(255,255,255,0.16)]
                    focus:ring-1 focus:ring-[rgba(94,106,210,0.35)]
                    transition-colors duration-150 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]
                    hover:text-[#8a8a8a] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <SubmitButton />
          </form>

          <div className="mt-4 flex items-center justify-between">
            <Link href="/forgot-password"
              className="text-[13px] text-[#8a8a8a] hover:text-[#f0f0f0]
                transition-colors duration-150">
              Forgot password?
            </Link>
            <Link href="/signup"
              className="text-[13px] text-[#8a8a8a] hover:text-[#f0f0f0]
                transition-colors duration-150">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
