'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Lock, Camera, CheckCircle, AlertCircle, Loader2, Sparkles, Trash2, AlertTriangle, X } from 'lucide-react';
import { updateProfileAction, updatePasswordAction, deleteWorkspaceAction, type SettingsState, type DeleteWorkspaceState } from './actions';
interface SettingsClientProps {
  initialName:      string;
  initialAvatarUrl: string;
  userRole:         string;
  email:            string;
  isOwner:          boolean;
  orgName:          string;
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

export default function SettingsClient({ initialName, initialAvatarUrl, userRole, email, isOwner, orgName }: SettingsClientProps) {
  const [name, setName]           = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const roleLabel = isOwner ? 'Owner (Admin)' : userRole === 'admin' ? 'Admin' : 'Member';
  const [profileState, setProfileState]   = useState<SettingsState>({ error: null, success: null });
  const [profileLoading, setProfileLoading] = useState(false);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [passwordState, setPasswordState]   = useState<SettingsState>({ error: null, success: null });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteState, setDeleteState] = useState<DeleteWorkspaceState>({ error: null, success: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showDeleteModal]);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileState({ error: null, success: null });
    const fd = new FormData(e.currentTarget);
    const result = await updateProfileAction({ error: null, success: null }, fd);
    setProfileState(result);
    setProfileLoading(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordState({ error: null, success: null });
    const fd = new FormData(e.currentTarget);
    const result = await updatePasswordAction({ error: null, success: null }, fd);
    setPasswordState(result);
    setPasswordLoading(false);
    if (!result.error) { setPassword(''); setConfirm(''); }
  }

  function openDeleteModal() {
    setDeleteConfirmName('');
    setDeleteState({ error: null, success: null });
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleteLoading) return;
    setShowDeleteModal(false);
    setDeleteConfirmName('');
    setDeleteState({ error: null, success: null });
  }

  async function handleDeleteWorkspace(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteState({ error: null, success: null });
    const fd = new FormData(e.currentTarget);
    const result = await deleteWorkspaceAction({ error: null, success: null }, fd);
    setDeleteState(result);
    setDeleteLoading(false);
    if (!result.error) {
      window.location.href = '/login';
    }
  }

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="p-4 sm:p-6 lg:p-10">

      {/* Page header */}
      <div className="mb-8 animate-in" style={{ animationDelay: '0ms' }}>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-bright leading-none">
          Account Settings
        </h1>
        <p className="mt-1.5 text-sm text-faint-app">Manage your profile and security preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-stretch">

      {/* ── Profile section ───────────────────────────────────────────────────── */}
      <section
        className="flex-1 rounded-2xl border border-surface bg-surface-card overflow-hidden animate-in"
        style={{ animationDelay: '80ms' }}
      >
        {/* Section header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-surface bg-overlay-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
            <User className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-bright">Profile</p>
            <p className="text-[11px] text-faint-app">Your display name, avatar, and role</p>
          </div>
          <Sparkles className="h-3.5 w-3.5 text-violet-400/40" />
        </div>

        <form onSubmit={handleProfileSubmit} className="px-6 py-5 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="shrink-0 relative group/avatar">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-violet-500/30"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-violet-700/30 ring-2 ring-violet-500/20">
                  <span className="text-lg font-bold text-violet-300">{initials || '?'}</span>
                </div>
              )}
              {/* Overlay hint */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-150">
                <Camera className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <label htmlFor="avatar_url" className="block text-[11px] font-semibold uppercase tracking-widest text-faint-app">
                Avatar URL
              </label>
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dim-app" />
                <input
                  id="avatar_url"
                  name="avatar_url"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className={`${fieldClass} pl-9`}
                />
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label htmlFor="name" className="block text-[11px] font-semibold uppercase tracking-widest text-faint-app">
              Display Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={fieldClass}
            />
          </div>

          {/* Role (read-only) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-faint-app">
              Role
            </label>
            <input
              type="text"
              value={roleLabel}
              readOnly
              className="w-full rounded-lg bg-surface-subtle border border-surface px-3 py-2.5 text-[13px] text-faint-app cursor-not-allowed select-none"
            />
            <p className="text-[11px] text-dim-app">{isOwner ? 'You are the workspace owner.' : 'Role can only be changed by the workspace owner.'}</p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-faint-app">
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-lg bg-surface-subtle border border-surface px-3 py-2.5 text-[13px] text-faint-app cursor-not-allowed select-none"
            />
            <p className="text-[11px] text-dim-app">Email cannot be changed here.</p>
          </div>

          <StatusBanner state={profileState} />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.45)] transition-[background-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {profileLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Profile
            </button>
          </div>
        </form>
      </section>

      {/* ── Security section ──────────────────────────────────────────────────── */}
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
            <p className="text-[11px] text-faint-app">Change your password</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="px-6 py-5 space-y-5">
          <div className="space-y-1">
            <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-widest text-faint-app">
              New Password <span className="text-rose-400">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirm" className="block text-[11px] font-semibold uppercase tracking-widest text-faint-app">
              Confirm Password <span className="text-rose-400">*</span>
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              className={fieldClass}
            />
          </div>

          {/* Password strength hint */}
          {password.length > 0 && (
            <div className="flex items-center gap-2 animate-in">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={[
                      'h-1 w-8 rounded-full transition-colors duration-300',
                      password.length >= level * 3
                        ? password.length >= 12
                          ? 'bg-emerald-400'
                          : password.length >= 8
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        : 'bg-surface-inset',
                    ].join(' ')}
                  />
                ))}
              </div>
              <span className="text-[11px] text-faint-app">
                {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong'}
              </span>
            </div>
          )}

          <StatusBanner state={passwordState} />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2 rounded-lg bg-rose-600/80 hover:bg-rose-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(239,68,68,0.2)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.3)] transition-[background-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {passwordLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </section>

      </div>

      {/* ── Danger Zone — Owner only ─────────────────────────────────────────── */}
      {isOwner && (
        <section
          className="mt-5 rounded-2xl border border-rose-500/20 bg-surface-card overflow-hidden animate-in"
          style={{ animationDelay: '240ms' }}
        >
          <div className="flex items-center gap-3 px-6 py-4 border-b border-rose-500/20 bg-rose-500/[0.03]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
              <Trash2 className="h-4 w-4 text-rose-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-bright">Danger Zone</p>
              <p className="text-[11px] text-faint-app">Irreversible actions for your workspace</p>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-bright">Delete Workspace</p>
                <p className="text-[11px] text-faint-app mt-0.5">
                  Permanently delete <span className="font-semibold text-dim-app">{orgName}</span> and all its data.
                  This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={openDeleteModal}
                className="shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-[13px] font-semibold text-rose-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Delete Workspace Modal ───────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeDeleteModal}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl border border-surface bg-surface-card shadow-[0_25px_60px_rgba(0,0,0,0.4)] animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-400" />
                </div>
                <h2 className="text-[15px] font-semibold text-bright">Delete Workspace</h2>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-faint-app hover:bg-surface-subtle hover:text-bright transition-colors duration-150 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-6 border-t border-surface" />

            {/* Body */}
            <form onSubmit={handleDeleteWorkspace} className="px-6 py-5 space-y-4">
              <div className="rounded-lg bg-rose-500/[0.06] border border-rose-500/15 px-4 py-3">
                <p className="text-[12px] font-semibold text-rose-400 mb-1.5">This will permanently delete:</p>
                <ul className="space-y-1 text-[12px] text-rose-300/80">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-rose-400/60 shrink-0" />
                    All projects, tasks, comments, and files
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-rose-400/60 shrink-0" />
                    All clients and invoices
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-rose-400/60 shrink-0" />
                    All team members and their accounts
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-rose-400/60 shrink-0" />
                    Your account — you can re-signup with the same email
                  </li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <p className="text-[12px] text-secondary-app">
                  To confirm, type <span className="font-bold text-bright">{orgName}</span> below:
                </p>
                <input
                  id="confirm_name"
                  name="confirm_name"
                  type="text"
                  required
                  autoComplete="off"
                  autoFocus
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={orgName}
                  className={`${fieldClass} focus:border-rose-500/50 focus:ring-rose-500/30`}
                />
              </div>

              {deleteState.error && (
                <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-medium bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {deleteState.error}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-surface" />

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                  className="rounded-lg border border-surface hover:bg-surface-inset px-4 py-2 text-[13px] font-medium text-dim-app transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirmName !== orgName}
                  className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.4)] transition-[background-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleteLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Delete this workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
