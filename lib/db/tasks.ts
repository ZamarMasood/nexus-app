'use server';
import { supabaseAdmin } from '../supabase-admin';
import { createSupabaseServerClient } from '../supabase-server';
import type { Task, TaskInsert, TaskUpdate, TeamMember, Comment, ProjectFile } from '../types';
// TeamMember used by TaskWithAssignee

export type CommentWithAuthor = Comment & {
  author_name: string | null;
};

export type TaskWithAssignee = Task & {
  assignee: Pick<TeamMember, 'id' | 'name' | 'avatar_url' | 'role'> | null;
};

export async function getTasks(projectId?: string): Promise<Task[]> {
  const supabase = createSupabaseServerClient();
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
  return data;
}

export async function getTasksWithAssignees(projectId?: string): Promise<TaskWithAssignee[]> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from('tasks')
    .select('*, assignee:team_members!tasks_assignee_id_fkey(id, name, avatar_url, role)')
    .order('created_at', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch tasks with assignees: ${error.message}`);
  return data as TaskWithAssignee[];
}

/** Fetch only recent N tasks with assignee info (for dashboard list). */
export async function getRecentTasksWithAssignees(limit: number = 10): Promise<TaskWithAssignee[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:team_members!tasks_assignee_id_fkey(id, name, avatar_url, role)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch recent tasks: ${error.message}`);
  return data as TaskWithAssignee[];
}

/** Lightweight stats for dashboard — only fetches id, status, due_date. */
export async function getTaskStats(): Promise<{
  total: number;
  done: number;
  overdue: number;
  dueSoon: number;
}> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, status, due_date');

  if (error) throw new Error(`Failed to fetch task stats: ${error.message}`);

  const tasks = data ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  return {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter(
      (t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < today
    ).length,
    dueSoon: tasks.filter((t) => {
      if (!t.due_date || t.status === 'done') return false;
      const d = new Date(t.due_date);
      return d >= today && d <= in7Days;
    }).length,
  };
}

/** Fetch task counts grouped by project_id — avoids loading all task rows for project list. */
export async function getTaskCountsByProject(): Promise<
  Record<string, { total: number; done: number }>
> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('project_id, status');

  if (error) throw new Error(`Failed to fetch task counts: ${error.message}`);

  const counts: Record<string, { total: number; done: number }> = {};
  for (const t of data ?? []) {
    if (!t.project_id) continue;
    if (!counts[t.project_id]) counts[t.project_id] = { total: 0, done: 0 };
    counts[t.project_id].total++;
    if (t.status === 'done') counts[t.project_id].done++;
  }
  return counts;
}

/** Sidebar list item — lightweight task for sidebar display. */
export type TaskSidebarItem = Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'due_date'>;

/** Fetch all tasks for a given assignee — lightweight for sidebar. */
export async function getTasksByAssignee(assigneeId: string): Promise<TaskSidebarItem[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date')
    .eq('assignee_id', assigneeId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch tasks for assignee: ${error.message}`);
  return data;
}

export async function getTaskById(id: string): Promise<Task> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch task ${id}: ${error.message}`);
  return data;
}

export async function getTaskByIdWithAssignee(id: string): Promise<TaskWithAssignee> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:team_members!tasks_assignee_id_fkey(id, name, avatar_url, role)')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch task ${id}: ${error.message}`);
  return data as TaskWithAssignee;
}

export async function createTask(task: TaskInsert): Promise<Task> {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return data;
}

export async function updateTask(id: string, updates: TaskUpdate): Promise<Task> {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update task ${id}: ${error.message}`);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);

  if (error) throw new Error(`Failed to delete task ${id}: ${error.message}`);
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getCommentsByTaskId(taskId: string): Promise<CommentWithAuthor[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch comments for task ${taskId}: ${error.message}`);
  return data as CommentWithAuthor[];
}

export async function createComment(
  taskId: string,
  content: string,
  userId?: string
): Promise<Comment> {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({ task_id: taskId, content, user_id: userId ?? null })
    .select()
    .single();

  if (error) throw new Error(`Failed to create comment: ${error.message}`);
  return data;
}

// ── Files ─────────────────────────────────────────────────────────────────────

export async function getFilesByTaskId(taskId: string): Promise<ProjectFile[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch files for task ${taskId}: ${error.message}`);
  return data;
}

// ── Member-scoped queries ──────────────────────────────────────────────────────

/** Returns project IDs assigned to a team member via the project_members table. */
async function getMemberProjectIds(memberId: string): Promise<string[]> {
  const { data } = await (supabaseAdmin as any)
    .from('project_members')
    .select('project_id')
    .eq('member_id', memberId);
  return (data ?? []).map((r: { project_id: string }) => r.project_id);
}

/** Fetch all tasks (with assignees) in the member's assigned projects. */
export async function getTasksWithAssigneesByMember(memberId: string): Promise<TaskWithAssignee[]> {
  const ids = await getMemberProjectIds(memberId);
  if (ids.length === 0) return [];

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:team_members!tasks_assignee_id_fkey(id, name, avatar_url, role)')
    .in('project_id', ids)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch tasks for member: ${error.message}`);
  return data as TaskWithAssignee[];
}

/** Fetch recent N tasks (with assignees) in the member's assigned projects. */
export async function getRecentTasksWithAssigneesByMember(
  memberId: string,
  limit: number = 10
): Promise<TaskWithAssignee[]> {
  const ids = await getMemberProjectIds(memberId);
  if (ids.length === 0) return [];

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:team_members!tasks_assignee_id_fkey(id, name, avatar_url, role)')
    .in('project_id', ids)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch recent tasks for member: ${error.message}`);
  return data as TaskWithAssignee[];
}

/** Task stats (total / done / overdue / dueSoon) scoped to the member's projects. */
export async function getTaskStatsByMember(memberId: string): Promise<{
  total: number;
  done: number;
  overdue: number;
  dueSoon: number;
}> {
  const ids = await getMemberProjectIds(memberId);
  if (ids.length === 0) return { total: 0, done: 0, overdue: 0, dueSoon: 0 };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, status, due_date')
    .in('project_id', ids);

  if (error) throw new Error(`Failed to fetch task stats for member: ${error.message}`);

  const tasks = data ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  return {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter(
      (t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < today
    ).length,
    dueSoon: tasks.filter((t) => {
      if (!t.due_date || t.status === 'done') return false;
      const d = new Date(t.due_date);
      return d >= today && d <= in7Days;
    }).length,
  };
}

/** Task counts per project, filtered to a specific set of project IDs. */
export async function getTaskCountsByProjectFiltered(
  projectIds: string[]
): Promise<Record<string, { total: number; done: number }>> {
  if (projectIds.length === 0) return {};

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('project_id, status')
    .in('project_id', projectIds);

  if (error) throw new Error(`Failed to fetch task counts: ${error.message}`);

  const counts: Record<string, { total: number; done: number }> = {};
  for (const t of data ?? []) {
    if (!t.project_id) continue;
    if (!counts[t.project_id]) counts[t.project_id] = { total: 0, done: 0 };
    counts[t.project_id].total++;
    if (t.status === 'done') counts[t.project_id].done++;
  }
  return counts;
}

export async function uploadFileToTask(taskId: string, file: File): Promise<ProjectFile> {
  const ext = file.name.split('.').pop();
  const path = `tasks/${taskId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('project-files')
    .upload(path, file, { upsert: false });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('project-files')
    .getPublicUrl(path);

  const { data, error } = await supabaseAdmin
    .from('files')
    .insert({ task_id: taskId, filename: file.name, file_url: publicUrl })
    .select()
    .single();

  if (error) throw new Error(`Failed to save file record: ${error.message}`);
  return data;
}
