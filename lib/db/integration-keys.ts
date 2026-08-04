'use server';
import { randomBytes, createHash } from 'crypto';
import { supabaseAdmin } from '../supabase-admin';
import { getCallerOrgId } from './team-members';

export interface IntegrationKeyRow {
  id: string;
  org_id: string;
  /** null = workspace-scoped: the caller picks a project on each request.
   *  Set   = locked to this project; any project in the request is ignored. */
  project_id: string | null;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  created_by: string | null;
}

/** A key row joined with its target project's name, for the settings list. */
export type IntegrationKeyWithProject = IntegrationKeyRow & {
  project_name: string | null;
};

/** Columns safe to send to the client. Deliberately excludes key_hash. */
const PUBLIC_COLUMNS =
  'id, org_id, project_id, name, key_prefix, last_used_at, revoked_at, created_at, created_by';

const KEY_PREFIX = 'ntb_';
/** Shown in the UI so a user can tell two keys apart, e.g. "ntb_a1b2c3d4…". */
const DISPLAY_PREFIX_LENGTH = KEY_PREFIX.length + 8;

/**
 * SHA-256, not bcrypt. Every inbound request looks the key up by exact hash, so
 * the hash has to be indexable — bcrypt would force a scan of every row. The key
 * is 32 random bytes, so it has far more entropy than a password and gains
 * nothing from a work factor.
 */
function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

// ─── Workspace-facing (require a logged-in team member) ──────────────────────

/** Every key in the caller's org, newest first. Never returns key_hash. */
export async function getIntegrationKeys(): Promise<IntegrationKeyWithProject[]> {
  const orgId = await getCallerOrgId();
  const { data, error } = await (supabaseAdmin as any)
    .from('integration_keys')
    .select(`${PUBLIC_COLUMNS}, projects(name)`)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch integration keys: ${error.message}`);

  return ((data ?? []) as any[]).map(({ projects, ...rest }) => ({
    ...rest,
    project_name: projects?.name ?? null,
  })) as IntegrationKeyWithProject[];
}

/**
 * Create a key.
 *
 * `projectId = null` makes a workspace-scoped key: the external tool lists the
 * org's projects and picks one per push. Pass a project id instead to lock the
 * key to that project, so nothing the caller sends can move it.
 *
 * Returns the raw key ONCE — it is not stored and cannot be shown again.
 * The caller is responsible for displaying it and then forgetting it.
 */
export async function createIntegrationKey(
  name: string,
  projectId: string | null,
  createdBy?: string,
): Promise<{ rawKey: string; row: IntegrationKeyRow }> {
  const orgId = await getCallerOrgId();

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Give the key a name so you can recognise it later.');
  if (trimmedName.length > 60) throw new Error('Name must be 60 characters or fewer.');

  // A locked key's project must belong to the caller's org. supabaseAdmin
  // bypasses RLS and the id comes from the browser, so this check is the real
  // guard. Workspace keys skip it — they have no project to verify yet.
  if (projectId !== null) {
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (projectError) throw new Error(`Failed to verify project: ${projectError.message}`);
    if (!project) throw new Error('Invalid project');
  }

  const rawKey = KEY_PREFIX + randomBytes(32).toString('hex');

  const { data, error } = await (supabaseAdmin as any)
    .from('integration_keys')
    .insert({
      org_id: orgId,
      project_id: projectId,
      name: trimmedName,
      key_hash: hashKey(rawKey),
      key_prefix: rawKey.slice(0, DISPLAY_PREFIX_LENGTH),
      created_by: createdBy ?? null,
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) throw new Error(`Failed to create integration key: ${error.message}`);
  return { rawKey, row: data as IntegrationKeyRow };
}

/** Revoke a key. Kept as a row so the audit trail survives; the endpoint rejects it. */
export async function revokeIntegrationKey(id: string): Promise<void> {
  const orgId = await getCallerOrgId();
  const { error } = await (supabaseAdmin as any)
    .from('integration_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', orgId)
    .is('revoked_at', null);

  if (error) throw new Error(`Failed to revoke integration key: ${error.message}`);
}

/** Delete a revoked key for good. */
export async function deleteIntegrationKey(id: string): Promise<void> {
  const orgId = await getCallerOrgId();
  const { error } = await (supabaseAdmin as any)
    .from('integration_keys')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId);

  if (error) throw new Error(`Failed to delete integration key: ${error.message}`);
}

// ─── Machine-facing (no session — the key IS the credential) ─────────────────

export interface ResolvedIntegrationKey {
  id: string;
  org_id: string;
  /** null = the caller must name a project on each request. */
  project_id: string | null;
}

/** Projects the key's workspace owns. Used by the list-projects endpoint so an
 *  external tool can show a picker. Names only — no tasks, clients or invoices. */
export async function getProjectsForIntegrationKey(
  orgId: string,
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('id, name')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return data ?? [];
}

/**
 * Look up a raw bearer key. Returns null for unknown or revoked keys — the
 * caller must not tell the two apart, or the endpoint becomes a key oracle.
 *
 * There is no org scoping here on purpose: the key is what establishes which
 * org this request belongs to.
 */
export async function resolveIntegrationKey(
  rawKey: string,
): Promise<ResolvedIntegrationKey | null> {
  if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) return null;

  const { data, error } = await (supabaseAdmin as any)
    .from('integration_keys')
    .select('id, org_id, project_id, revoked_at')
    .eq('key_hash', hashKey(rawKey))
    .maybeSingle();

  if (error || !data) return null;
  if (data.revoked_at) return null;

  return { id: data.id, org_id: data.org_id, project_id: data.project_id };
}

/** Stamp last_used_at. Never allowed to fail the request that triggered it. */
export async function touchIntegrationKey(id: string): Promise<void> {
  await (supabaseAdmin as any)
    .from('integration_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', id);
}
