'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signupAction, type SignupState } from './actions';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Mail } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2 rounded-md text-[13px] font-medium text-white
        bg-[#5e6ad2] hover:bg-[#6872e5] active:scale-[0.99]
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[rgba(94,106,210,0.35)]
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating account...' : 'Continue'}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[12px] text-[#e5484d]">{message}</p>;
}

function generateSlug(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const INPUT_CLASS = `w-full px-3 py-2 rounded-md
  bg-[#1a1a1a] border border-[rgba(255,255,255,0.10)]
  text-[#f0f0f0] text-[13px] placeholder:text-[#555]
  focus:outline-none focus:border-[rgba(255,255,255,0.16)]
  focus:ring-1 focus:ring-[rgba(94,106,210,0.35)]
  transition-colors duration-150`;

const initialState: SignupState = { error: null, fieldErrors: {} };

export default function SignupClient() {
  const [state, action] = useFormState<SignupState, FormData>(signupAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const slugRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');

  useEffect(() => {
    if (state.success && state.email && step === 'form') {
      setStep('success');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.email]);

  function handleCompanyNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugManuallyEdited) setSlug(generateSlug(e.target.value));
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugManuallyEdited(true);
    setSlug(e.target.value);
  }

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

          {step === 'form' && (
            <>
              <h1 className="text-[18px] font-medium text-[#f0f0f0] tracking-[-0.02em] mb-1">
                Create your workspace
              </h1>
              <p className="text-[13px] text-[#8a8a8a] mb-6">
                Set up Nexus for your team in seconds
              </p>

              {state.error && (
                <p className="mb-4 text-[13px] text-[#e5484d]">{state.error}</p>
              )}

              <form action={action} className="space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#8a8a8a]
                    uppercase tracking-[0.04em] mb-1.5">
                    Company Name
                  </label>
                  <input
                    name="companyName" type="text" required autoComplete="organization"
                    placeholder="Acme Ltd"
                    onChange={handleCompanyNameChange}
                    className={INPUT_CLASS}
                  />
                  <FieldError message={state.fieldErrors?.companyName} />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#8a8a8a]
                    uppercase tracking-[0.04em] mb-1.5">
                    Workspace URL
                  </label>
                  <input
                    ref={slugRef}
                    name="slug" type="text" required
                    placeholder="acme-ltd"
                    value={slug}
                    onChange={handleSlugChange}
                    className={INPUT_CLASS}
                  />
                  {slug && !state.fieldErrors?.slug && (
                    <p className="mt-1 text-[12px] text-[#555]">
                      app.nexus.com/<span className="text-[#5e6ad2]">{slug}</span>
                    </p>
                  )}
                  <FieldError message={state.fieldErrors?.slug} />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#8a8a8a]
                    uppercase tracking-[0.04em] mb-1.5">
                    Full Name
                  </label>
                  <input
                    name="fullName" type="text" required autoComplete="name"
                    placeholder="Alex Johnson"
                    className={INPUT_CLASS}
                  />
                  <FieldError message={state.fieldErrors?.fullName} />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#8a8a8a]
                    uppercase tracking-[0.04em] mb-1.5">
                    Email
                  </label>
                  <input
                    name="email" type="email" required autoComplete="email"
                    placeholder="alex@acme.com"
                    className={INPUT_CLASS}
                  />
                  <FieldError message={state.fieldErrors?.email} />
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
                      required autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      className={`${INPUT_CLASS} pr-10`}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]
                        hover:text-[#8a8a8a] transition-colors"
                      aria-label={showPassword ? 'Hide' : 'Show'}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <FieldError message={state.fieldErrors?.password} />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#8a8a8a]
                    uppercase tracking-[0.04em] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      required autoComplete="new-password"
                      placeholder="Repeat password"
                      className={`${INPUT_CLASS} pr-10`}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]
                        hover:text-[#8a8a8a] transition-colors"
                      aria-label={showConfirm ? 'Hide' : 'Show'}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <FieldError message={state.fieldErrors?.confirmPassword} />
                </div>

                <div className="pt-1">
                  <input type="hidden" name="terms" value={termsChecked ? 'on' : ''} />
                  <button type="button" onClick={() => setTermsChecked(v => !v)}
                    className="flex items-start gap-2.5 w-full text-left">
                    <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-colors duration-150
                      flex items-center justify-center
                      ${termsChecked
                        ? 'bg-[#5e6ad2] border-[#5e6ad2]'
                        : 'bg-[#1a1a1a] border-[rgba(255,255,255,0.10)]'}`}>
                      {termsChecked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13px] text-[#8a8a8a] leading-relaxed">
                      I agree to the{' '}
                      <span className="text-[#5e6ad2] hover:text-[#6872e5]">Terms of Service</span>
                      {' '}and{' '}
                      <span className="text-[#5e6ad2] hover:text-[#6872e5]">Privacy Policy</span>
                    </span>
                  </button>
                  <FieldError message={state.fieldErrors?.terms} />
                </div>

                <div className="pt-2">
                  <SubmitButton />
                </div>
              </form>

              <div className="mt-4 text-center">
                <span className="text-[13px] text-[#8a8a8a]">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#8a8a8a] hover:text-[#f0f0f0]
                    transition-colors duration-150">
                    Sign in
                  </Link>
                </span>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center">
              <div className="mx-auto mb-4 w-10 h-10 rounded-full bg-[rgba(38,201,127,0.15)]
                flex items-center justify-center">
                <Mail size={18} className="text-[#26c97f]" />
              </div>
              <h1 className="text-[18px] font-medium text-[#f0f0f0] tracking-[-0.02em] mb-2">
                Check your email
              </h1>
              <p className="text-[13px] text-[#8a8a8a] mb-4">
                We sent a confirmation link to{' '}
                <strong className="text-[#f0f0f0]">{state.email}</strong>.
                Click the link to activate your workspace.
              </p>
              <p className="text-[13px] text-[#555] mb-6">
                Didn&apos;t receive the email? Check your spam folder.
              </p>
              <Link href="/login"
                className="inline-flex w-full justify-center py-2 rounded-md text-[13px] font-medium
                  text-white bg-[#5e6ad2] hover:bg-[#6872e5]
                  transition-colors duration-150">
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
