'use server';
import { supabaseAdmin } from '../supabase-admin';
import { getCallerOrgId } from './team-members';

export interface TaskStatusRow {
  id: string;
  org_id: string;
  slug: string;
  label: string;
  color: string;
  position: number;
  is_default: boolean;
  created_at: string;
}

const DEFAULT_STATUSES: Omit<TaskStatusRow, 'id' | 'org_id' | 'created_at'>[] = [
  { slug: 'todo', label: 'To Do', color: '#666666', position: 0, is_default: true },
  { slug: 'in_progress', label: 'In Progress', color: '#5e6ad2', position: 1, is_default: true },
  { slug: 'done', label: 'Done', color: '#26c97f', position: 2, is_default: true },
];

/** Fetch all task statuses for the caller's org, ordered by position. */
export async function getTaskStatuses(orgIdOverride?: string): Promise<TaskStatusRow[]> {
  const orgId = orgIdOverride ?? await getCallerOrgId();
  const { data, error } = await (supabaseAdmin as any)
    .from('task_statuses')
    .select('*')
    .eq('org_id', orgId)
    .order('position', { ascending: true });

  if (error) throw new Error(`Failed to fetch task statuses: ${error.message}`);
  return data ?? [];
}

/** Ensure default statuses exist for an org (called during signup). */
export async function seedDefaultStatuses(orgId: string): Promise<void> {
  const rows = DEFAULT_STATUSES.map((s) => ({ ...s, org_id: orgId }));
  await (supabaseAdmin as any)
    .from('task_statuses')
    .upsert(rows, { onConflict: 'org_id,slug', ignoreDuplicates: true });
}

/** Create a custom task status. Returns the new row. */
export async function createTaskStatus(
  orgId: string,
  slug: string,
  label: string,
  color: string
): Promise<TaskStatusRow> {
  // Get the max position to append at the end (but before "done")
  const existing = await getTaskStatuses(orgId);
  const doneStatus = existing.find((s) => s.slug === 'done');
  const donePosition = doneStatus?.position ?? existing.length;

  // Shift "done" and anything after it up by 1
  const toShift = existing.filter((s) => s.position >= donePosition);
  for (const s of toShift) {
    await (supabaseAdmin as any)
      .from('task_statuses')
      .update({ position: s.position + 1 })
      .eq('id', s.id);
  }

  const { data, error } = await (supabaseAdmin as any)
    .from('task_statuses')
    .insert({ org_id: orgId, slug, label, color, position: donePosition, is_default: false })
    .select()
    .single();

  if (error) throw new Error(`Failed to create task status: ${error.message}`);
  return data;
}

/** Delete a custom task status. Moves tasks with that status to "todo". */
export async function deleteTaskStatus(statusId: string, orgId: string): Promise<void> {
  // Get the status being deleted
  const { data: status, error: fetchError } = await (supabaseAdmin as any)
    .from('task_statuses')
    .select('*')
    .eq('id', statusId)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !status) throw new Error('Status not found');
  if (status.is_default) throw new Error('Cannot delete default statuses');

  // Move all tasks with this status to "todo"
  await supabaseAdmin
    .from('tasks')
    .update({ status: 'todo' })
    .eq('status', status.slug)
    .eq('org_id', orgId);

  // Delete the status
  const { error } = await (supabaseAdmin as any)
    .from('task_statuses')
    .delete()
    .eq('id', statusId)
    .eq('org_id', orgId);

  if (error) throw new Error(`Failed to delete task status: ${error.message}`);

  // Re-order remaining statuses to close gaps
  const remaining = await getTaskStatuses(orgId);
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].position !== i) {
      await (supabaseAdmin as any)
        .from('task_statuses')
        .update({ position: i })
        .eq('id', remaining[i].id);
    }
  }
}
