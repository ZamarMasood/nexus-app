'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { forgotPasswordAction, type ForgotPasswordState } from './actions';
import { Mail } from 'lucide-react';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full py-2 rounded-md text-[13px] font-medium text-white
        bg-[#5e6ad2] hover:bg-[#6872e5] active:scale-[0.99]
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[rgba(94,106,210,0.35)]
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Sending...' : 'Send reset link'}
    </button>
  );
}

const INITIAL: ForgotPasswordState = { error: null, success: false };

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(forgotPasswordAction, INITIAL);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">

        <div className="flex justify-center mb-8">
          <span className="text-[18px] font-medium text-[#f0f0f0] tracking-[-0.02em]">
            Nexus
          </span>
        </div>

        <div className="bg-[#161616] border border-[rgba(255,255,255,0.10)]
          rounded-lg p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">

          {state.success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 w-10 h-10 rounded-full bg-[rgba(38,201,127,0.15)]
                flex items-center justify-center">
                <Mail size={18} className="text-[#26c97f]" />
              </div>
              <h1 className="text-[18px] font-medium text-[#f0f0f0] tracking-[-0.02em] mb-2">
                Check your email
              </h1>
              <p className="text-[13px] text-[#8a8a8a] mb-6">
                We sent a password reset link to your email. Click the link to set a new password.
              </p>
              <Link href="/login"
                className="inline-flex w-full justify-center py-2 rounded-md text-[13px] font-medium
                  text-white bg-[#5e6ad2] hover:bg-[#6872e5]
                  transition-colors duration-150">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-[18px] font-medium text-[#f0f0f0] tracking-[-0.02em] mb-1">
                Reset password
              </h1>
              <p className="text-[13px] text-[#8a8a8a] mb-6">
                Enter your email and we&apos;ll send you a reset link
              </p>

              {state.error && (
                <p className="mb-4 text-[13px] text-[#e5484d]">{state.error}</p>
              )}

              <form action={formAction}>
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
                <SubmitButton />
              </form>

              <p className="mt-4 text-center text-[13px] text-[#8a8a8a]">
                Remember your password?{' '}
                <Link href="/login" className="hover:text-[#f0f0f0] transition-colors duration-150">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
