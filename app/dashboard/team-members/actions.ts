'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  getTeamMemberByEmail,
  getIsAdminByEmail,
  getIsOwnerById,
  getCallerOrgId,
  insertTeamMember,
  updateTeamMemberFull,
  deleteTeamMember,
  replaceProjectAssignments,
} from '@/lib/db/team-members';
// ── Validation helpers ───────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email);
}

// ── Guard helper ─────────────────────────────────────────────────────────────
async function requireAdmin(): Promise<{ id: string; email: string; name: string }> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated');
  const isAdmin = await getIsAdminByEmail(user.email);
  if (!isAdmin) throw new Error('Admin access required');
  const member = await getTeamMemberByEmail(user.email);
  return { id: user.id, email: user.email, name: member?.name ?? 'Your admin' };
}

// ── Invite member ────────────────────────────────────────────────────────────
export interface AddMemberState {
  error: string | null;
  success: string | null;
}

export async function addTeamMemberAction(
  _prevState: AddMemberState,
  formData: FormData
): Promise<AddMemberState> {
  try {
    const admin = await requireAdmin();

    const name       = (formData.get('name')      as string)?.trim();
    const email      = (formData.get('email')     as string)?.trim().toLowerCase();
    const user_role  = (formData.get('user_role') as string)?.trim();
    const projectIds = formData.getAll('project_ids') as string[];

    if (!name || !email || !user_role) {
      return { error: 'Name and email are required.', success: null };
    }
    if (!isValidEmail(email)) {
      return { error: 'Please enter a valid email address (e.g. name@company.com).', success: null };
    }

    // Step 1 — check if email is already taken in team_members
    const existing = await getTeamMemberByEmail(email);
    if (existing) {
      return { error: 'A team member with this email already exists.', success: null };
    }

    // Step 2 — invite via Supabase (creates auth user + sends invite email via Supabase SMTP)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: `${siteUrl}/auth/confirm` }
    );

    if (inviteError) {
      if (inviteError.message.toLowerCase().includes('already')) {
        return { error: 'A user with this email already exists.', success: null };
      }
      return { error: inviteError.message, success: null };
    }

    const userId = inviteData.user.id;

    // Step 3 — insert into team_members with the admin's org_id
    const org_id = await getCallerOrgId();
    await insertTeamMember({ id: userId, name, email, role: user_role, user_role, org_id });

    // Step 4 — assign projects
    if (projectIds.length > 0) {
      await replaceProjectAssignments(userId, projectIds);
    }

    return { error: null, success: `Invitation sent to ${email}` };
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
  _prevState: EditMemberState,
  formData: FormData
): Promise<EditMemberState> {
  try {
    const admin = await requireAdmin();

    const id         = formData.get('id')        as string;
    const name       = (formData.get('name')      as string)?.trim();
    const user_role  = (formData.get('user_role') as string)?.trim();
    const projectIds = formData.getAll('project_ids') as string[];

    if (!id || !name || !user_role) {
      return { error: 'All fields are required.', success: null };
    }

    // Check if target member is the owner — only the owner can edit themselves
    const targetIsOwner = await getIsOwnerById(id);
    const callerIsOwner = await getIsOwnerById(admin.id);
    if (targetIsOwner && !callerIsOwner) {
      return { error: 'The workspace owner\'s details cannot be changed by other admins.', success: null };
    }
    if (targetIsOwner && user_role !== 'admin') {
      return { error: 'The owner\'s role cannot be changed.', success: null };
    }

    // Only the owner can change roles
    const currentRole = (formData.get('original_user_role') as string)?.trim();
    if (user_role !== currentRole && !callerIsOwner) {
      return { error: 'Only the workspace owner can change roles.', success: null };
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
  _prevState: DeleteMemberState,
  formData: FormData
): Promise<DeleteMemberState> {
  try {
    const admin = await requireAdmin();

    const id = formData.get('id') as string;
    if (!id) return { error: 'Member ID is required.', success: null };

    // Guard: cannot delete yourself
    if (id === admin.id) {
      return { error: 'You cannot remove your own account.', success: null };
    }

    // Guard: cannot delete an owner
    const targetIsOwner = await getIsOwnerById(id);
    if (targetIsOwner) {
      return { error: 'The workspace owner cannot be removed.', success: null };
    }

    // Delete Auth user first (cascade not automatic for auth.users).
    // If the auth user doesn't exist (e.g. manually-inserted member), proceed anyway.
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authDeleteError && !authDeleteError.message.toLowerCase().includes('user not found')) {
      return { error: authDeleteError.message, success: null };
    }

    // Unassign from tasks (FK tasks.assignee_id → team_members.id, no cascade)
    await supabaseAdmin
      .from('tasks')
      .update({ assignee_id: null })
      .eq('assignee_id', id);

    // Delete from team_members (cascade handles project_members)
    await deleteTeamMember(id);

    return { error: null, success: 'Team member removed.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return { error: msg, success: null };
  }
}
