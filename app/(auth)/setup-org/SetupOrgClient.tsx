'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { setupOrgAction, type SetupOrgState } from './actions';
import { useState } from 'react';

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
      {pending ? 'Creating workspace...' : 'Create workspace'}
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

  const INPUT_CLASS = `w-full px-3 py-2 rounded-md
    bg-[#1a1a1a] border border-[rgba(255,255,255,0.10)]
    text-[#f0f0f0] text-[13px] placeholder:text-[#555]
    focus:outline-none focus:border-[rgba(255,255,255,0.16)]
    focus:ring-1 focus:ring-[rgba(94,106,210,0.35)]
    transition-colors duration-150`;

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

          <h1 className="text-[18px] font-medium text-[#f0f0f0] tracking-[-0.02em] mb-1">
            Set up your workspace
          </h1>
          <p className="text-[13px] text-[#8a8a8a] mb-6">
            You need a workspace to continue.
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
                name="companyName" type="text" required
                placeholder="Company Name"
                onChange={e => { if (!slugManuallyEdited) setSlug(generateSlug(e.target.value)); }}
                className={INPUT_CLASS}
              />
              {state.fieldErrors?.companyName && (
                <p className="mt-1 text-[12px] text-[#e5484d]">{state.fieldErrors.companyName}</p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#8a8a8a]
                uppercase tracking-[0.04em] mb-1.5">
                Workspace URL
              </label>
              <input
                name="slug" type="text" required
                placeholder="workspace-slug"
                value={slug}
                onChange={e => { setSlugManuallyEdited(true); setSlug(e.target.value); }}
                className={INPUT_CLASS}
              />
              {slug && !state.fieldErrors?.slug && (
                <p className="mt-1 text-[12px] text-[#555]">
                  app.nexus.com/<span className="text-[#5e6ad2]">{slug}</span>
                </p>
              )}
              {state.fieldErrors?.slug && (
                <p className="mt-1 text-[12px] text-[#e5484d]">{state.fieldErrors.slug}</p>
              )}
            </div>

            <SubmitButton />
          </form>
        </div>
      </div>
    </div>
  );
}
