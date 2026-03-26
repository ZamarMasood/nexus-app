'use client';

import { useState } from 'react';
import { User, Lock, CheckCircle, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import {
  updateClientProfileAction,
  updateClientPasswordAction,
  type SettingsState,
} from './actions';

interface PortalSettingsClientProps {
  initialName: string;
  email:       string;
  csrfToken:   string;
}

function StatusBanner({ state }: { state: SettingsState }) {
  if (!state.error && !state.success) return null;
  return (
    <div
      className={[
        'flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium animate-in',
        state.success
          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400',
      ].join(' ')}
    >
      {state.success ? (
        <CheckCircle className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {state.success ?? state.error}
    </div>
  );
}

const fieldClass =
  'w-full rounded-lg bg-surface-inset border border-surface px-3 py-2.5 text-[13px] text-primary-app placeholder:text-dim-app outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-[border-color,box-shadow] duration-150';

export default function PortalSettingsClient({ initialName, email, csrfToken }: PortalSettingsClientProps) {
  const [name, setName]                   = useState(initialName);
  const [profileState, setProfileState]   = useState<SettingsState>({ error: null, success: null });
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword]               = useState('');
  const [confirm, setConfirm]                 = useState('');
  const [passwordState, setPasswordState]     = useState<SettingsState>({ error: null, success: null });
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileState({ error: null, success: null });
    const fd = new FormData(e.currentTarget);
    const result = await updateClientProfileAction({ error: null, success: null }, fd);
    setProfileState(result);
    setProfileLoading(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordState({ error: null, success: null });
    const fd = new FormData(e.currentTarget);
    const result = await updateClientPasswordAction({ error: null, success: null }, fd);
    setPasswordState(result);
    setPasswordLoading(false);
    if (!result.error) { setCurrentPassword(''); setPassword(''); setConfirm(''); }
  }

  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="p-4 sm:px-6 sm:py-8">

      {/* Page header */}
      <div className="mb-8 animate-in" style={{ animationDelay: '0ms' }}>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-bright leading-none">
          Account Settings
        </h1>
        <p className="mt-1.5 text-sm text-faint-app">Update your name and portal password.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-stretch">

      {/* ── Profile section ────────────────────────────────────────────────── */}
      <section
        className="flex-1 rounded-2xl border border-surface bg-surface-card overflow-hidden animate-in"
        style={{ animationDelay: '80ms' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-surface bg-overlay-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
            <User className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-bright">Profile</p>
            <p className="text-[11px] text-faint-app">Your display name</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="px-6 py-5 space-y-5">
          <input type="hidden" name="csrf_token" value={csrfToken} />
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-violet-700/30 ring-2 ring-violet-500/20">
              <span className="text-base font-bold text-violet-300">{initials || '?'}</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-bright">{name || 'Your Name'}</p>
              <p className="text-[12px] text-faint-app">{email}</p>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="name" className="block text-[11px] font-semibold uppercase tracking-widest text-faint-app">
              Display Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="name" name="name" type="text" required
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your name" className={fieldClass}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-faint-app">
              Email
            </label>
            <input type="email" value={email} readOnly
              className="w-full rounded-lg bg-surface-subtle border border-surface px-3 py-2.5 text-[13px] text-faint-app cursor-not-allowed select-none"
            />
            <p className="text-[11px] text-dim-app">Contact your account manager to change your email.</p>
          </div>

          <StatusBanner state={profileState} />

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={profileLoading}
              className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.45)] transition-[background-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {profileLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Profile
            </button>
          </div>
        </form>
      </section>

      {/* ── Security section ───────────────────────────────────────────────── */}
      <section
        className="flex-1 rounded-2xl border border-surface bg-surface-card overflow-hidden animate-in"
        style={{ animationDelay: '160ms' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-surface bg-overlay-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
            <Lock className="h-4 w-4 text-rose-400" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-bright">Security</p>
            <p className="text-[11px] text-faint-app">Change your portal password</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="px-6 py-5 space-y-5">
          <input type="hidden" name="csrf_token" value={csrfToken} />
          <div className="space-y-1">
            <label htmlFor="current_password" className="block text-[11px] font-semibold uppercase tracking-widest text-faint-app">
              Current Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dim-app" />
              <input
                id="current_password" name="current_password" type="password" required
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Your current password"
                className={`${fieldClass} pl-9`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-widest text-faint-app">
              New Password <span className="text-rose-400">*</span>
            </label>
            <input
              id="password" name="password" type="password" required minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters" className={fieldClass}
            />
          </div>

          {/* Password strength */}
          {password.length > 0 && (
            <div className="flex items-center gap-2 animate-in">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={[
                      'h-1 w-8 rounded-full transition-colors duration-300',
                      password.length >= level * 3
                        ? password.length >= 12 ? 'bg-emerald-400'
                          : password.length >= 8  ? 'bg-amber-400'
                          : 'bg-rose-400'
                        : 'bg-surface-inset',
                    ].join(' ')}
                  />
                ))}
              </div>
              <span className="text-[11px] text-faint-app">
                {password.length < 6 ? 'Too short' : password.length < 8 ? 'Weak' : password.length < 12 ? 'Good' : 'Strong'}
              </span>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="confirm" className="block text-[11px] font-semibold uppercase tracking-widest text-faint-app">
              Confirm Password <span className="text-rose-400">*</span>
            </label>
            <input
              id="confirm" name="confirm" type="password" required
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password" className={fieldClass}
            />
          </div>

          <StatusBanner state={passwordState} />

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={passwordLoading}
              className="flex items-center gap-2 rounded-lg bg-rose-600/80 hover:bg-rose-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(239,68,68,0.2)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.3)] transition-[background-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {passwordLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </section>

      </div>
    </div>
  );
}
