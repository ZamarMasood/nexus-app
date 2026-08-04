// Machine-to-machine ingest for notes2board.
//
// There is no user session here — the bearer key IS the credential.
//
// org_id ALWAYS comes from the key row and is never read from the request, so a
// key can never reach another workspace. The project depends on the key type:
//
//   locked key    (project_id set)  → that project, request value ignored
//   workspace key (project_id null) → request must name a project, and it is
//                                     checked against the key's org before use
//
// Revoking the key cuts both off immediately.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { touchIntegrationKey } from '@/lib/db/integration-keys';
import { authenticateIntegrationRequest } from '@/lib/integration-auth';
import type { TaskPriority } from '@/lib/types';

const MAX_BATCH = 100;
const MAX_TITLE = 500;
const MAX_DESCRIPTION = 10_000;

const VALID_PRIORITIES: TaskPriority[] = ['urgent', 'high', 'normal', 'low'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface IncomingTask {
  title?: unknown;
  description?: unknown;
  priority?: unknown;
  due_date?: unknown;
}

interface ValidTask {
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status });
}

/** Validate one incoming task. Returns an error string instead of throwing so
 *  the caller can report which index in the batch was wrong. */
function validateTask(raw: IncomingTask, index: number): ValidTask | string {
  if (typeof raw?.title !== 'string' || !raw.title.trim()) {
    return `tasks[${index}]: title is required`;
  }
  const title = raw.title.trim();
  if (title.length > MAX_TITLE) {
    return `tasks[${index}]: title must be ${MAX_TITLE} characters or fewer`;
  }

  let description: string | null = null;
  if (raw.description !== undefined && raw.description !== null) {
    if (typeof raw.description !== 'string') {
      return `tasks[${index}]: description must be a string`;
    }
    if (raw.description.length > MAX_DESCRIPTION) {
      return `tasks[${index}]: description must be ${MAX_DESCRIPTION} characters or fewer`;
    }
    description = raw.description.trim() || null;
  }

  // Default to 'normal' rather than rejecting — an unknown priority is not worth
  // failing a whole meeting's worth of tasks over.
  let priority: TaskPriority = 'normal';
  if (raw.priority !== undefined && raw.priority !== null) {
    if (typeof raw.priority !== 'string' || !VALID_PRIORITIES.includes(raw.priority as TaskPriority)) {
      return `tasks[${index}]: priority must be one of ${VALID_PRIORITIES.join(', ')}`;
    }
    priority = raw.priority as TaskPriority;
  }

  let due_date: string | null = null;
  if (raw.due_date !== undefined && raw.due_date !== null && raw.due_date !== '') {
    if (typeof raw.due_date !== 'string' || !DATE_RE.test(raw.due_date)) {
      return `tasks[${index}]: due_date must be YYYY-MM-DD`;
    }
    // Reject 2026-02-31 and friends — Postgres would error on insert anyway.
    const parsed = new Date(`${raw.due_date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || !parsed.toISOString().startsWith(raw.due_date)) {
      return `tasks[${index}]: due_date is not a real date`;
    }
    due_date = raw.due_date;
  }

  return { title, description, priority, due_date };
}

export async function POST(req: NextRequest) {
  // ── Authenticate + rate limit ─────────────────────────────────────────────
  const auth = await authenticateIntegrationRequest(req);
  if (!auth.ok) return auth.response;
  const keyRow = auth.key;

  // ── Parse and validate ────────────────────────────────────────────────────
  let body: { tasks?: unknown; project_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!Array.isArray(body.tasks)) {
    return json({ error: 'Body must be { "tasks": [ … ] }' }, 400);
  }
  if (body.tasks.length === 0) {
    return json({ error: 'tasks must contain at least one task' }, 400);
  }
  if (body.tasks.length > MAX_BATCH) {
    return json({ error: `tasks must contain at most ${MAX_BATCH} items` }, 400);
  }

  const valid: ValidTask[] = [];
  for (let i = 0; i < body.tasks.length; i++) {
    const result = validateTask(body.tasks[i] as IncomingTask, i);
    if (typeof result === 'string') return json({ error: result }, 400);
    valid.push(result);
  }

  // ── Decide the target project ─────────────────────────────────────────────
  // A locked key wins outright: whatever the caller sent is ignored, so a stolen
  // key cannot be redirected. A workspace key must be told where to put things.
  let targetProjectId: string;

  if (keyRow.project_id) {
    targetProjectId = keyRow.project_id;
  } else {
    if (typeof body.project_id !== 'string' || !body.project_id) {
      return json(
        { error: 'This key is workspace-scoped — include "project_id" in the request.' },
        400
      );
    }
    targetProjectId = body.project_id;
  }

  // Always verify the project belongs to THIS key's org. For a workspace key
  // that is the security boundary — the id came from the caller. For a locked
  // key it also catches a project deleted out from under a stale row.
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', targetProjectId)
    .eq('org_id', keyRow.org_id)
    .maybeSingle();

  if (projectError) {
    return json({ error: 'Failed to verify target project' }, 500);
  }
  if (!project) {
    // Same message whether the project belongs to someone else or never existed —
    // otherwise this confirms which project ids are real in other workspaces.
    return json({ error: 'Unknown project for this key' }, 404);
  }

  // ── Insert ────────────────────────────────────────────────────────────────
  // org_id comes from the key row, never the request. assignee_id stays null
  // because notes2board only knows names from a transcript, not member ids.
  const rows = valid.map((t) => ({
    org_id: keyRow.org_id,
    project_id: targetProjectId,
    title: t.title,
    description: t.description,
    priority: t.priority,
    due_date: t.due_date,
    status: 'todo',
    assignee_id: null,
  }));

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('tasks')
    .insert(rows)
    .select('id');

  if (insertError) {
    return json({ error: `Failed to create tasks: ${insertError.message}` }, 500);
  }

  // Bookkeeping only — a failure here must not fail a successful push.
  try {
    await touchIntegrationKey(keyRow.id);
  } catch {
    // non-critical
  }

  return json(
    {
      created: inserted?.length ?? 0,
      taskIds: (inserted ?? []).map((t) => t.id),
      projectId: targetProjectId,
    },
    201
  );
}
