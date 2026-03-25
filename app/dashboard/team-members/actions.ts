'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  getTeamMemberByEmail,
  getIsAdminByEmail,
  insertTeamMember,
  updateTeamMemberFull,
  deleteTeamMember,
  replaceProjectAssignments,
} from '@/lib/db/team-members';

// ── Guard helper ─────────────────────────────────────────────────────────────
async function requireAdmin(): Promise<string> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated');
  const isAdmin = await getIsAdminByEmail(user.email);
  if (!isAdmin) throw new Error('Admin access required');
  return user.id;
}

// ── Add member ───────────────────────────────────────────────────────────────
export interface AddMemberState {
  error: string | null;
  success: string | null;
}

export async function addTeamMemberAction(
  prevState: AddMemberState,
  formData: FormData
): Promise<AddMemberState> {
  try {
    await requireAdmin();

    const name       = (formData.get('name')      as string)?.trim();
    const email      = (formData.get('email')     as string)?.trim().toLowerCase();
    const password   = formData.get('password')   as string;
    const user_role  = (formData.get('user_role') as string)?.trim();
    const projectIds = formData.getAll('project_ids') as string[];

    if (!name || !email || !password || !user_role) {
      return { error: 'All fields are required.', success: null };
    }
    if (password.length < 8) {
      return { error: 'Password must be at least 8 characters.', success: null };
    }

    // Step 1 — check if email is already taken in team_members
    const existing = await getTeamMemberByEmail(email);
    if (existing) {
      return { error: 'A team member with this email already exists.', success: null };
    }

    // Step 2 — create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already')) {
        return { error: 'A user with this email already exists.', success: null };
      }
      return { error: authError.message, success: null };
    }

    const userId = authData.user.id;

    // Step 3 — insert into team_members
    await insertTeamMember({ id: userId, name, email, role: user_role, user_role });

    // Step 4 — assign projects
    if (projectIds.length > 0) {
      await replaceProjectAssignments(userId, projectIds);
    }

    return { error: null, success: 'Team member added successfully.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return { error: msg, success: null };
  }
}

// ── Edit member ──────────────────────────────────────────────────────────────
export interface EditMemberState {
  error: string | null;
  success: string | null;
}

export async function editTeamMemberAction(
  prevState: EditMemberState,
  formData: FormData
): Promise<EditMemberState> {
  try {
    const currentUserId = await requireAdmin();

    const id         = formData.get('id')        as string;
    const name       = (formData.get('name')      as string)?.trim();
    const user_role  = (formData.get('user_role') as string)?.trim();
    const projectIds = formData.getAll('project_ids') as string[];

    if (!id || !name || !user_role) {
      return { error: 'All fields are required.', success: null };
    }

    // Guard: cannot demote yourself
    if (id === currentUserId && user_role !== 'admin') {
      return { error: 'You cannot change your own role.', success: null };
    }

    await updateTeamMemberFull(id, { name, user_role });
    await replaceProjectAssignments(id, projectIds);

    return { error: null, success: 'Team member updated successfully.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return { error: msg, success: null };
  }
}

// ── Delete member ─────────────────────────────────────────────────────────────
export interface DeleteMemberState {
  error: string | null;
  success: string | null;
}

export async function deleteTeamMemberAction(
  prevState: DeleteMemberState,
  formData: FormData
): Promise<DeleteMemberState> {
  try {
    const currentUserId = await requireAdmin();

    const id = formData.get('id') as string;
    if (!id) return { error: 'Member ID is required.', success: null };

    // Guard: cannot delete yourself
    if (id === currentUserId) {
      return { error: 'You cannot remove your own account.', success: null };
    }

    // Delete Auth user first (cascade not automatic for auth.users)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authDeleteError) {
      return { error: authDeleteError.message, success: null };
    }

    // Delete from team_members (cascade handles project_members)
    await deleteTeamMember(id);

    return { error: null, success: 'Team member removed.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return { error: msg, success: null };
  }
}
