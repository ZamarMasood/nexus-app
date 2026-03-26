'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { CommentWithAuthor } from '@/lib/db/tasks';
import type { ProjectFile } from '@/lib/types';

/**
 * Creates a comment on a task, storing the team member's name in author_name.
 */
export async function createCommentAction(
  taskId: string,
  content: string
): Promise<CommentWithAuthor> {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  let authorName: string | null = null;
  let teamMemberId: string | null = null;
  if (user?.email) {
    const { data: member } = await supabase
      .from('team_members')
      .select('id, name')
      .eq('email', user.email)
      .maybeSingle();
    teamMemberId = member?.id ?? null;
    authorName   = member?.name ?? null;
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, content, user_id: teamMemberId, author_name: authorName })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create comment: ${error.message}`);
  return data as CommentWithAuthor;
}

/**
 * Uploads a file attachment to a task via FormData (File objects can't be
 * passed directly to Server Actions — they must be wrapped in FormData).
 */
export async function uploadFileAction(formData: FormData): Promise<ProjectFile> {
  const taskId = formData.get('taskId') as string;
  const file = formData.get('file') as File;

  if (!taskId || !file) throw new Error('Task ID and file are required.');

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
  return data as ProjectFile;
}
