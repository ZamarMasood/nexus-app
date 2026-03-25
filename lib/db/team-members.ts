'use server';
import { supabaseAdmin as supabase } from '../supabase-admin';
import type { TeamMember, TeamMemberWithProjects } from '../types';

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch team members: ${error.message}`);
  return data;
}

export async function getTeamMembersWithProjects(): Promise<TeamMemberWithProjects[]> {
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
      project_members!project_members_member_id_fkey (
        project_id,
        projects (
          id,
          name
        )
      )
    `)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch team members with projects: ${error.message}`);
  return (data ?? []) as TeamMemberWithProjects[];
}

export async function getTeamMemberByEmail(email: string): Promise<TeamMember | null> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
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

export async function updateTeamMember(
  id: string,
  updates: { name?: string; avatar_url?: string | null; role?: string | null }
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)
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
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete team member: ${error.message}`);
}

export async function updateTeamMemberFull(
  id: string,
  updates: { name: string; user_role: string }
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update team member: ${error.message}`);
  return data;
}

export async function replaceProjectAssignments(
  memberId: string,
  projectIds: string[]
): Promise<void> {
  // project_members was added after DB type generation; cast to avoid type errors
  const adminAny = supabase as any; // noqa

  const { error: deleteError } = await adminAny
    .from('project_members')
    .delete()
    .eq('member_id', memberId);

  if (deleteError) throw new Error(`Failed to clear project assignments: ${deleteError.message}`);

  const uniqueProjectIds = projectIds.filter((id, index) => projectIds.indexOf(id) === index);
  if (uniqueProjectIds.length > 0) {
    const rows = uniqueProjectIds.map((project_id) => ({ project_id, member_id: memberId }));
    const { error: insertError } = await adminAny
      .from('project_members')
      .insert(rows);

    if (insertError) throw new Error(`Failed to assign projects: ${insertError.message}`);
  }
}
