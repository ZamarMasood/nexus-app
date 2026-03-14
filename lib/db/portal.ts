import { supabase } from '../supabase';
import type { Task, Invoice, Comment, ProjectFile, TeamMember } from '../types';

export type PortalTask = Task & {
  assignee?: Pick<TeamMember, 'name' | 'avatar_url'> | null;
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

/**
 * Fetch all tasks for a client using an inner join on projects,
 * reducing 2 sequential queries to 1.
 */
export async function getPortalTasks(clientId: string): Promise<PortalTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:team_members(name, avatar_url), project:projects!inner(id)')
    .eq('project.client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch portal tasks: ${error.message}`);

  // Strip the joined project field from results
  return (data ?? []).map(({ project, ...rest }) => rest) as PortalTask[];
}

/**
 * Fetch a single task only if it belongs to a project owned by clientId.
 * Uses inner join — single query instead of 2.
 */
export async function getPortalTaskById(
  taskId: string,
  clientId: string
): Promise<PortalTask | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:team_members(name, avatar_url), project:projects!inner(id)')
    .eq('id', taskId)
    .eq('project.client_id', clientId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch portal task: ${error.message}`);
  if (!data) return null;

  const { project, ...rest } = data;
  return rest as PortalTask;
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

/**
 * Fetch all files for a client using nested joins:
 * files → tasks (inner) → projects (inner, filtered by client_id).
 * Reduces 3 sequential queries to 1.
 */
export async function getPortalFiles(clientId: string): Promise<PortalFileWithContext[]> {
  const { data, error } = await supabase
    .from('files')
    .select(
      '*, task:tasks!inner(id, title, project_id, project:projects!inner(id, name))'
    )
    .eq('task.project.client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch portal files: ${error.message}`);

  return (data ?? []).map((f: any) => ({
    id: f.id,
    task_id: f.task_id,
    filename: f.filename,
    file_url: f.file_url,
    created_at: f.created_at,
    taskId: f.task?.id ?? f.task_id ?? '',
    taskTitle: f.task?.title ?? 'Unknown Task',
    projectId: f.task?.project?.id ?? '',
    projectName: f.task?.project?.name ?? 'Unknown Project',
  }));
}
