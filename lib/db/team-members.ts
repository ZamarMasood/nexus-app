'use server';
import { supabaseAdmin as supabase } from '../supabase-admin';
import { createSupabaseServerClient } from '../supabase-server';
import type { TeamMember, TeamMemberWithProjects } from '../types';

/**
 * Returns the org_id for the currently authenticated user.
 * Throws if not authenticated or member has no org.
 */
export async function getCallerOrgId(): Promise<string> {
  const serverClient = createSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated');
  const member = await getTeamMemberByEmail(user.email);
  if (!member?.org_id) throw new Error('No organisation found for this account. Please set up your workspace at /setup-org.');
  return member.org_id;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const orgId = await getCallerOrgId();
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch team members: ${error.message}`);
  return data;
}

export async function getTeamMembersWithProjects(): Promise<TeamMemberWithProjects[]> {
  const orgId = await getCallerOrgId();
  // project_members was added after DB type generation; cast to avoid type errors
  const adminAny = supabase as any; // noqa
  const { data, error } = await adminAny
    .from('team_members')
    .select(`
      id,
      name,
      email,
      role,
      avatar_url,
      user_role,
      is_owner,
      project_members!project_members_member_id_fkey (
        project_id,
        projects (
          id,
          name
        )
      )
    `)
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch team members with projects: ${error.message}`);
  return (data ?? []) as TeamMemberWithProjects[];
}

export interface PaginatedTeamMembers {
  data: TeamMemberWithProjects[];
  total: number;
}

/** Fetch a page of team members with projects (0-indexed). Pass orgId to skip re-auth. */
export async function getTeamMembersWithProjectsPaginated(page: number, pageSize: number, orgIdOverride?: string): Promise<PaginatedTeamMembers> {
  const orgId = orgIdOverride ?? await getCallerOrgId();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const adminAny = supabase as any;
  const { data, error, count } = await adminAny
    .from('team_members')
    .select(`
      id,
      name,
      email,
      role,
      avatar_url,
      user_role,
      is_owner,
      project_members!project_members_member_id_fkey (
        project_id,
        projects (
          id,
          name
        )
      )
    `, { count: 'exact' })
    .eq('org_id', orgId)
    .order('name', { ascending: true })
    .range(from, to);

  if (error) throw new Error(`Failed to fetch team members: ${error.message}`);
  return { data: (data ?? []) as TeamMemberWithProjects[], total: count ?? 0 };
}

export async function getTeamMemberByEmail(email: string): Promise<TeamMember | null> {
  const { data, error } = await (supabase as any)
    .from('team_members')
    .select('id, name, email, role, avatar_url, user_role, org_id, is_owner')
    .eq('email', email)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch team member: ${error.message}`);
  return data;
}

export async function getIsAdminByEmail(email: string): Promise<boolean> {
  const { data } = await supabase
    .from('team_members')
    .select('user_role')
    .eq('email', email)
    .maybeSingle();
  return data?.user_role === 'admin';
}

export async function getOrgSlugById(orgId: string): Promise<string | null> {
  const { data: org } = await supabase
    .from('organisations')
    .select('slug')
    .eq('id', orgId)
    .maybeSingle();
  return (org as any)?.slug ?? null;
}

export async function getIsOwnerById(id: string): Promise<boolean> {
  const { data } = await supabase
    .from('team_members')
    .select('is_owner')
    .eq('id', id)
    .maybeSingle();
  return data?.is_owner === true;
}

export async function updateTeamMember(
  id: string,
  updates: { name?: string; avatar_url?: string | null; role?: string | null }
): Promise<TeamMember> {
  const orgId = await getCallerOrgId();
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update team member: ${error.message}`);
  return data;
}

export async function insertTeamMember(member: {
  id: string;
  name: string;
  email: string;
  role: string;
  user_role: string;
  org_id?: string | null;
}): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .upsert(member, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert team member: ${error.message}`);
  return data;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const orgId = await getCallerOrgId();
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId);

  if (error) throw new Error(`Failed to delete team member: ${error.message}`);
}

export async function updateTeamMemberFull(
  id: string,
  updates: { name: string; user_role: string }
): Promise<TeamMember> {
  const orgId = await getCallerOrgId();
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update team member: ${error.message}`);
  return data;
}

export async function replaceProjectAssignments(
  memberId: string,
  projectIds: string[]
): Promise<void> {
  const orgId = await getCallerOrgId();
  // project_members was added after DB type generation; cast to avoid type errors
  const adminAny = supabase as any; // noqa

  const { error: deleteError } = await adminAny
    .from('project_members')
    .delete()
    .eq('member_id', memberId)
    .eq('org_id', orgId);

  if (deleteError) throw new Error(`Failed to clear project assignments: ${deleteError.message}`);

  const uniqueProjectIds = projectIds.filter((id, index) => projectIds.indexOf(id) === index);
  if (uniqueProjectIds.length > 0) {
    // Verify all projects belong to the caller's org
    const { data: validProjects, error: verifyError } = await supabase
      .from('projects')
      .select('id')
      .eq('org_id', orgId)
      .in('id', uniqueProjectIds);

    if (verifyError) throw new Error(`Failed to verify projects: ${verifyError.message}`);
    const validIds = new Set((validProjects ?? []).map((p) => p.id));
    const invalidIds = uniqueProjectIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      throw new Error('One or more projects do not belong to your organisation.');
    }

    const rows = uniqueProjectIds.map((project_id) => ({ project_id, member_id: memberId }));
    const { error: insertError } = await adminAny
      .from('project_members')
      .insert(rows);

    if (insertError) throw new Error(`Failed to assign projects: ${insertError.message}`);
  }
}
