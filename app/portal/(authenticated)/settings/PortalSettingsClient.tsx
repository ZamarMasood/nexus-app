'use client';

import { useState } from 'react';
import {
  User,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Key,
  Save,
  Settings as SettingsIcon,
  Mail,
} from 'lucide-react';
import {
  updateClientProfileAction,
  updateClientPasswordAction,
  type SettingsState,
} from './actions';

interface PortalSettingsClientProps {
  initialName: string;
  email: string;
  csrfToken: string;
}

function StatusBanner({ state }: { state: SettingsState }) {
  if (!state.error && !state.success) return null;

  const isSuccess = !!state.success;
  const colors = isSuccess
    ? { bg: 'rgba(38,201,127,0.12)', border: 'rgba(38,201,127,0.2)', text: '#26c97f', icon: CheckCircle }
    : { bg: 'rgba(229,72,77,0.12)', border: 'rgba(229,72,77,0.2)', text: '#e5484d', icon: AlertCircle };

  return (
    <div
      className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-[13px] font-medium"
      style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
    >
      <colors.icon className="h-4 w-4 shrink-0" />
      {state.success ?? state.error}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] text-[#f0f0f0] text-[13px] placeholder:text-[#555] focus:outline-none focus:border-[rgba(94,106,210,0.5)] focus:ring-1 focus:ring-[rgba(94,106,210,0.3)] transition-colors duration-150';

const labelClass =
  'block text-[11px] font-medium text-[#8a8a8a] uppercase tracking-[0.06em] mb-1.5';

export default function PortalSettingsClient({
  initialName,
  email,
  csrfToken,
}: PortalSettingsClientProps) {
  const [name, setName] = useState(initialName);
  const [profileState, setProfileState] = useState<SettingsState>({ error: null, success: null });
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordState, setPasswordState] = useState<SettingsState>({ error: null, success: null });
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
    if (!result.error) {
      setCurrentPassword('');
      setPassword('');
      setConfirm('');
    }
  }

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Password strength
  const getPasswordStrength = () => {
    if (password.length === 0) return { score: 0, label: '', color: '' };
    if (password.length < 8) return { score: 1, label: 'Too short', color: '#e5484d' };
    if (password.length < 12) return { score: 2, label: 'Good', color: '#e79d13' };
    return { score: 3, label: 'Strong', color: '#26c97f' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">

      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-3">
          <SettingsIcon size={16} className="text-[#555]" />
          <h1 className="text-[15px] font-medium text-[#e8e8e8]">Settings</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Profile Section */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(94,106,210,0.12)]">
                  <User className="h-4 w-4 text-[#5e6ad2]" />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium text-[#e8e8e8]">Profile</h3>
                  <p className="text-[11px] text-[#555]">Your display name</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="px-6 py-5 space-y-5">
                <input type="hidden" name="csrf_token" value={csrfToken} />

                {/* Avatar preview */}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[rgba(94,106,210,0.12)] border-2 border-[rgba(94,106,210,0.2)]">
                    <span className="text-base font-medium text-[#5e6ad2]">
                      {initials || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#f0f0f0]">
                      {name || 'Your Name'}
                    </p>
                    <p className="text-[12px] text-[#555]">{email}</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className={labelClass}>
                    Display Name <span className="text-[#e5484d]">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                    <Mail size={14} className="text-[#555]" />
                    <span className="text-[13px] text-[#f0f0f0]">{email}</span>
                  </div>
                  <p className="text-[11px] text-[#555] mt-1.5">
                    Contact your account manager to change your email.
                  </p>
                </div>

                <StatusBanner state={profileState} />

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium
                      bg-[#5e6ad2] hover:bg-[#6872e5] text-white
                      active:scale-[0.98] transition-colors duration-150
                      disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {profileLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Save size={14} />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Security Section */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(229,72,77,0.12)]">
                  <Lock className="h-4 w-4 text-[#e5484d]" />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium text-[#e8e8e8]">Security</h3>
                  <p className="text-[11px] text-[#555]">Change your portal password</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="px-6 py-5 space-y-5">
                <input type="hidden" name="csrf_token" value={csrfToken} />

                <div>
                  <label htmlFor="current_password" className={labelClass}>
                    Current Password <span className="text-[#e5484d]">*</span>
                  </label>
                  <div className="relative">
                    <Key className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]" />
                    <input
                      id="current_password"
                      name="current_password"
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Your current password"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className={labelClass}>
                    New Password <span className="text-[#e5484d]">*</span>
                  </label>
                  <div className="relative">
                    <Key className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                {/* Password strength */}
                {password.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className="h-1 flex-1 rounded-full transition-colors duration-150"
                          style={{
                            background:
                              strength.score >= level ? strength.color : 'rgba(255,255,255,0.06)',
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#555]">Password strength:</span>
                      <span style={{ color: strength.color }} className="font-medium">
                        {strength.label}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="confirm" className={labelClass}>
                    Confirm Password <span className="text-[#e5484d]">*</span>
                  </label>
                  <div className="relative">
                    <Key className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]" />
                    <input
                      id="confirm"
                      name="confirm"
                      type="password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat new password"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                <StatusBanner state={passwordState} />

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={passwordLoading || !password || password !== confirm}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium
                      bg-[#e5484d] hover:bg-[#e5484d]/90 text-white
                      active:scale-[0.98] transition-colors duration-150
                      disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {passwordLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Key size={14} />
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
