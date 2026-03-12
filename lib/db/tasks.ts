import { supabase } from '../supabase';
import type { Task, TaskInsert, TaskUpdate, TeamMember, Comment, ProjectFile } from '../types';

export type TaskWithAssignee = Task & {
  assignee: Pick<TeamMember, 'id' | 'name' | 'avatar_url' | 'role'> | null;
};

export async function getTasks(projectId?: string): Promise<Task[]> {
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
  return data;
}

export async function getTasksWithAssignees(projectId?: string): Promise<TaskWithAssignee[]> {
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

export async function getTaskById(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch task ${id}: ${error.message}`);
  return data;
}

export async function getTaskByIdWithAssignee(id: string): Promise<TaskWithAssignee> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:team_members!tasks_assignee_id_fkey(id, name, avatar_url, role)')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch task ${id}: ${error.message}`);
  return data as TaskWithAssignee;
}

export async function createTask(task: TaskInsert): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return data;
}

export async function updateTask(id: string, updates: TaskUpdate): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update task ${id}: ${error.message}`);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) throw new Error(`Failed to delete task ${id}: ${error.message}`);
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getCommentsByTaskId(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch comments for task ${taskId}: ${error.message}`);
  return data;
}

export async function createComment(
  taskId: string,
  content: string,
  userId?: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, content, user_id: userId ?? null })
    .select()
    .single();

  if (error) throw new Error(`Failed to create comment: ${error.message}`);
  return data;
}

// ── Files ─────────────────────────────────────────────────────────────────────

export async function getFilesByTaskId(taskId: string): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch files for task ${taskId}: ${error.message}`);
  return data;
}
