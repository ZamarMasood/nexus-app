'use client';

import { useState } from 'react';
import { Plug, Plus, Copy, Check, Loader2, AlertCircle, Trash2, Ban } from 'lucide-react';
import {
  createIntegrationKeyAction,
  revokeIntegrationKeyAction,
  deleteIntegrationKeyAction,
} from './actions';
import type { IntegrationKeyWithProject } from '@/lib/db/integration-keys';

interface IntegrationsSectionProps {
  initialKeys: IntegrationKeyWithProject[];
  projects: { id: string; name: string }[];
  isAdmin: boolean;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] text-[13px] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-border)] focus:ring-1 focus:ring-[var(--accent-ring)] transition-colors duration-150';

const labelClass =
  'block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.06em] mb-1.5';

function formatDate(value: string | null): string {
  if (!value) return 'Never';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function IntegrationsSection({
  initialKeys,
  projects,
  isAdmin,
}: IntegrationsSectionProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState('');
  // '' is the sentinel for "whole workspace" — stored as project_id NULL.
  const WORKSPACE_SCOPE = '';
  const [projectId, setProjectId] = useState<string>(WORKSPACE_SCOPE);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Held in memory only, and only until the user dismisses it. The server does
  // not store the raw key, so this is the single chance to copy it.
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function refresh() {
    const { fetchIntegrationKeysAction } = await import('./actions');
    const result = await fetchIntegrationKeysAction();
    if (!result.error) setKeys(result.keys);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const result = await createIntegrationKeyAction(
      name,
      projectId === WORKSPACE_SCOPE ? null : projectId
    );
    setCreating(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setFreshKey(result.rawKey ?? null);
    setCopied(false);
    setName('');
    await refresh();
  }

  async function handleRevoke(id: string) {
    setBusyId(id);
    setError(null);
    const result = await revokeIntegrationKeyAction(id);
    if (result.error) setError(result.error);
    else await refresh();
    setBusyId(null);
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    const result = await deleteIntegrationKeyAction(id);
    if (result.error) setError(result.error);
    else await refresh();
    setBusyId(null);
  }

  async function copyKey() {
    if (!freshKey) return;
    try {
      await navigator.clipboard.writeText(freshKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy automatically — select the key and copy it manually.');
    }
  }

  const endpoint =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/integrations/notes2board`
      : '/api/integrations/notes2board';

  return (
    <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sidebar)] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--tint-accent)]">
          <Plug className="h-4 w-4 text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="text-[13px] font-medium text-[var(--text-primary)]">Integrations</h3>
          <p className="text-[11px] text-[var(--text-faint)]">
            Let notes2board push tasks into one of your projects
          </p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* The key, shown once */}
        {freshKey && (
          <div
            className="rounded-lg p-4 space-y-3"
            style={{
              background: 'var(--tint-green)',
              border: '1px solid var(--tint-green-border)',
            }}
          >
            <p className="text-[13px] font-medium text-[var(--status-done)]">
              Copy this key now — it will not be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-md bg-[var(--bg-input)] px-3 py-2 text-[12px] text-[var(--text-primary)]">
                {freshKey}
              </code>
              <button
                type="button"
                onClick={copyKey}
                className="flex shrink-0 items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-2 text-[12px] font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98]"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              In notes2board, open Settings and paste it under &quot;nexus-app&quot;. Endpoint:{' '}
              <code className="text-[var(--text-secondary)]">{endpoint}</code>
            </p>
            <button
              type="button"
              onClick={() => setFreshKey(null)}
              className="text-[12px] font-medium text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)]"
            >
              I&apos;ve saved it — hide
            </button>
          </div>
        )}

        {error && (
          <div
            className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-[13px] font-medium"
            style={{
              background: 'var(--tint-red)',
              border: '1px solid var(--tint-red-border)',
              color: 'var(--priority-urgent)',
            }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Existing keys */}
        {keys.length === 0 ? (
          <p className="text-[13px] text-[var(--text-faint)]">No integration keys yet.</p>
        ) : (
          <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
            {keys.map((k, i) => {
              const revoked = !!k.revoked_at;
              return (
                <div
                  key={k.id}
                  className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                    i > 0 ? 'border-t border-[var(--border-subtle)]' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[13px] font-medium ${
                          revoked
                            ? 'text-[var(--text-faint)] line-through'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {k.name}
                      </span>
                      {revoked && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--priority-urgent)] bg-[var(--tint-red)]">
                          Revoked
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                      <code>{k.key_prefix}…</code>
                      {' · '}
                      {k.project_id ? (k.project_name ?? 'Unknown project') : 'Any project'}
                      {' · last used '}
                      {formatDate(k.last_used_at)}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex shrink-0 items-center gap-2">
                      {busyId === k.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--text-faint)]" />
                      ) : revoked ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(k.id)}
                          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--hover-default)] hover:text-[var(--priority-urgent)]"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevoke(k.id)}
                          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--hover-default)] hover:text-[var(--priority-urgent)]"
                        >
                          <Ban size={13} />
                          Revoke
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create */}
        {isAdmin && (
          <form onSubmit={handleCreate} className="space-y-4 border-t border-[var(--border-subtle)] pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="key-name" className={labelClass}>
                  Key name
                </label>
                <input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={60}
                  placeholder="e.g. Weekly standup"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="key-project" className={labelClass}>
                  Where tasks land
                </label>
                <select
                  id="key-project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={inputClass}
                >
                  <option value={WORKSPACE_SCOPE}>
                    Any project — chosen when sending
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      Always: {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-faint)]">
              {projectId === WORKSPACE_SCOPE
                ? 'notes2board will show your project list and ask where each batch should go. The key can add tasks to any project in this workspace, but cannot read tasks, clients or invoices.'
                : 'Tasks sent with this key always land in that one project. Nothing the sender does can change it — the safer option if you only ever use one project.'}
            </p>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-1.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus size={14} />}
                Create key
              </button>
            </div>
          </form>
        )}

        {!isAdmin && (
          <p className="border-t border-[var(--border-subtle)] pt-5 text-[12px] text-[var(--text-faint)]">
            Only admins can create or revoke integration keys.
          </p>
        )}
      </div>
    </div>
  );
}
