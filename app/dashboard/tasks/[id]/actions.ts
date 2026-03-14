'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { CommentWithAuthor } from '@/lib/db/tasks';

/**
 * Creates a comment on a task, storing the team member's name in author_name.
 */
export async function createCommentAction(
  taskId: string,
  content: string
): Promise<CommentWithAuthor> {
  const supabase = createSupabaseServerClient();

  const { data: { session } } = await supabase.auth.getSession();

  let authorName: string | null = null;
  let teamMemberId: string | null = null;
  if (session?.user?.email) {
    const { data: member } = await supabase
      .from('team_members')
      .select('id, name')
      .eq('email', session.user.email)
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
