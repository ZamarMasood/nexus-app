import { supabase } from '../supabase';
import type { Task, Invoice, Comment, ProjectFile, TeamMember } from '../types';

export type PortalTask = Task & {
  assignee?: Pick<TeamMember, 'name' | 'avatar_url'> | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getClientProjectIds(clientId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('client_id', clientId);
  if (error) throw new Error(`Failed to fetch client projects: ${error.message}`);
  return (data ?? []).map((p) => p.id);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getPortalTasks(clientId: string): Promise<PortalTask[]> {
  const projectIds = await getClientProjectIds(clientId);
  if (!projectIds.length) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:team_members(name, avatar_url)')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch portal tasks: ${error.message}`);
  return data as PortalTask[];
}

/**
 * Fetch a single task only if it belongs to a project owned by clientId.
 * Returns null if the task does not exist or does not belong to this client.
 */
export async function getPortalTaskById(
  taskId: string,
  clientId: string
): Promise<PortalTask | null> {
  const projectIds = await getClientProjectIds(clientId);
  if (!projectIds.length) return null;

  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:team_members(name, avatar_url)')
    .eq('id', taskId)
    .in('project_id', projectIds)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch portal task: ${error.message}`);
  return data as PortalTask | null;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getPortalComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch comments: ${error.message}`);
  return data;
}

/**
 * Create a comment on behalf of a portal client.
 * user_id is set to clientId so we can detect "Your" vs "Team" messages on display.
 */
export async function createPortalComment(
  taskId: string,
  content: string,
  clientId: string
): Promise<Comment> {
  // Fetch client name to store as author_name
  const { data: client } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('comments')
    .insert({
      task_id:     taskId,
      content,
      user_id:     clientId,
      author_name: client?.name ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create comment: ${error.message}`);
  return data;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function getPortalInvoices(clientId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch portal invoices: ${error.message}`);
  return data;
}

// ─── Files ────────────────────────────────────────────────────────────────────

export type PortalFileWithContext = ProjectFile & {
  taskTitle: string;
  taskId: string;
  projectId: string;
  projectName: string;
};

export async function getPortalFiles(clientId: string): Promise<PortalFileWithContext[]> {
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('client_id', clientId);

  if (projectsError) throw new Error(`Failed to fetch projects: ${projectsError.message}`);
  if (!projects?.length) return [];

  const projectIds = projects.map((p) => p.id);
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, project_id')
    .in('project_id', projectIds);

  if (tasksError) throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
  if (!tasks?.length) return [];

  const taskIds = tasks.map((t) => t.id);
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  const { data: files, error: filesError } = await supabase
    .from('files')
    .select('*')
    .in('task_id', taskIds)
    .order('created_at', { ascending: false });

  if (filesError) throw new Error(`Failed to fetch files: ${filesError.message}`);

  return (files ?? []).map((f) => {
    const task = taskMap.get(f.task_id ?? '');
    const projectId = task?.project_id ?? '';
    return {
      ...f,
      taskId: f.task_id ?? '',
      taskTitle: task?.title ?? 'Unknown Task',
      projectId,
      projectName: projectMap.get(projectId) ?? 'Unknown Project',
    };
  });
}
