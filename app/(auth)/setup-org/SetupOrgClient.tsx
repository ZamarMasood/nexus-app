'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { setupOrgAction, type SetupOrgState } from './actions';
import { Layers, ArrowRight, Sun, Moon } from 'lucide-react';
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
          Creating workspace…
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          Create workspace
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      )}
    </button>
  );
}

function generateSlug(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const initialState: SetupOrgState = { error: null, fieldErrors: {} };

export default function SetupOrgClient() {
  const [state, action] = useFormState<SetupOrgState, FormData>(setupOrgAction, initialState);
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const cardBg     = mounted ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.72)') : 'rgba(255,255,255,0.07)';
  const cardBdr    = mounted ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.18)')  : 'rgba(255,255,255,0.12)';
  const cardShadow = isDark ? '0 8px 64px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.1) inset' : '0 8px 64px rgba(124,58,237,0.15), 0 1px 0 rgba(255,255,255,0.95) inset';
  const textH   = mounted ? (isDark ? '#ffffff' : '#180a2e') : '#ffffff';
  const textSub = mounted ? (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(24,10,46,0.45)') : 'rgba(255,255,255,0.45)';
  const inputBg  = mounted ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)') : 'rgba(255,255,255,0.07)';
  const inputBdr = mounted ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.18)') : 'rgba(255,255,255,0.12)';

  return (
    <>
      <style>{`
        @keyframes card-in { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes orb-a { 0%,100%{transform:translate(0,0)}40%{transform:translate(50px,-70px)}70%{transform:translate(-30px,35px)} }
        @keyframes orb-b { 0%,100%{transform:translate(0,0)}35%{transform:translate(-55px,45px)}70%{transform:translate(38px,-22px)} }
        .card-in { animation: card-in 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .orb-a { animation: orb-a 20s ease-in-out infinite; }
        .orb-b { animation: orb-b 26s ease-in-out infinite; }
        .setup-input { width:100%; border-radius:12px; padding:13px 16px; font-size:14px; outline:none; transition:border-color 0.2s,box-shadow 0.2s; }
        .setup-input:focus { border-color:rgba(124,58,237,0.65)!important; box-shadow:0 0 0 3px rgba(124,58,237,0.15); }
      `}</style>

      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
        style={{ background: isDark ? 'radial-gradient(ellipse 140% 120% at 50% 0%, #2d1060 0%, #1a0845 35%, #120828 65%, #0e0620 100%)' : '#f5f3ff' }}
      >
        <div className="orb-a pointer-events-none absolute -top-32 -left-32 size-[750px] rounded-full"
          style={{ background: `radial-gradient(circle at 40% 40%, ${isDark ? 'rgba(109,40,217,0.7)' : 'rgba(124,58,237,0.22)'} 0%, transparent 62%)`, filter: 'blur(28px)' }} />
        <div className="orb-b pointer-events-none absolute -bottom-32 -right-32 size-[700px] rounded-full"
          style={{ background: `radial-gradient(circle at 55% 55%, ${isDark ? 'rgba(124,58,237,0.6)' : 'rgba(99,45,220,0.14)'} 0%, transparent 62%)`, filter: 'blur(30px)' }} />

        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="group absolute top-5 right-5 z-20 flex size-9 items-center justify-center rounded-xl transition-[background-color,transform] duration-200 hover:bg-violet-500/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          style={{ color: textSub, border: `1px solid ${cardBdr}`, backdropFilter: 'blur(8px)', background: cardBg }}
          aria-label="Toggle theme"
        >
          {isDark
            ? <Sun size={15} className="transition-transform duration-300 group-hover:rotate-12" />
            : <Moon size={15} className="transition-transform duration-300 group-hover:-rotate-12" />
          }
        </button>

        <div
          className="card-in relative z-10 w-full max-w-[400px] rounded-3xl p-8"
          style={{ background: cardBg, border: `1px solid ${cardBdr}`, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: cardShadow }}
        >
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.9)'}, transparent)` }} />

          <div className="mb-7 flex flex-col items-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', boxShadow: '0 0 0 1px rgba(124,58,237,0.5), 0 8px 32px rgba(124,58,237,0.4)' }}>
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.03em]" style={{ color: textH }}>
                Set up your workspace
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: textSub }}>
                You need a workspace to continue.
              </p>
            </div>
          </div>

          {state.error && (
            <div className="mb-5 rounded-xl px-4 py-3 text-[13px]"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-3">
            <div>
              <input
                name="companyName"
                type="text"
                required
                placeholder="Company Name"
                onChange={e => { if (!slugManuallyEdited) setSlug(generateSlug(e.target.value)); }}
                className="setup-input"
                style={{ background: inputBg, border: `1px solid ${state.fieldErrors?.companyName ? 'rgba(239,68,68,0.5)' : inputBdr}`, color: textH }}
              />
              {state.fieldErrors?.companyName && (
                <p className="mt-1.5 text-[12px]" style={{ color: '#fca5a5' }}>{state.fieldErrors.companyName}</p>
              )}
            </div>

            <div>
              <input
                name="slug"
                type="text"
                required
                placeholder="workspace-slug"
                value={slug}
                onChange={e => { setSlugManuallyEdited(true); setSlug(e.target.value); }}
                className="setup-input"
                style={{ background: inputBg, border: `1px solid ${state.fieldErrors?.slug ? 'rgba(239,68,68,0.5)' : inputBdr}`, color: textH }}
              />
              {slug && !state.fieldErrors?.slug && (
                <p className="mt-1.5 text-[12px]" style={{ color: textSub }}>
                  Workspace: <span style={{ color: isDark ? 'rgba(167,139,250,0.9)' : '#7c3aed' }}>app.nexus.com/{slug}</span>
                </p>
              )}
              {state.fieldErrors?.slug && (
                <p className="mt-1.5 text-[12px]" style={{ color: '#fca5a5' }}>{state.fieldErrors.slug}</p>
              )}
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </>
  );
}