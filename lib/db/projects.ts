'use server';
import { supabaseAdmin } from '../supabase-admin';
import { createSupabaseServerClient } from '../supabase-server';
import { getCallerOrgId } from './team-members';
import type { Project, ProjectInsert, ProjectUpdate } from '../types';

// Lightweight type for sidebar/list views
export type ProjectListItem = Pick<Project, 'id' | 'name' | 'client_id' | 'status' | 'total_value' | 'deadline'>;

export async function getProjects(clientId?: string): Promise<Project[]> {
  const orgId = await getCallerOrgId();
  let query = supabaseAdmin.from('projects').select('*').eq('org_id', orgId).order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return data;
}

/** Fetch only the columns needed for list/sidebar display. */
export async function getProjectsForList(clientId?: string): Promise<ProjectListItem[]> {
  const orgId = await getCallerOrgId();
  let query = supabaseAdmin
    .from('projects')
    .select('id, name, client_id, status, total_value, deadline')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return data;
}

export async function getProjectById(id: string): Promise<Project> {
  const orgId = await getCallerOrgId();
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (error) throw new Error(`Failed to fetch project ${id}: ${error.message}`);
  return data;
}

export async function createProject(project: ProjectInsert): Promise<Project> {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return data;
}

export async function updateProject(id: string, updates: ProjectUpdate): Promise<Project> {
  const orgId = await getCallerOrgId();
  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(updates)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update project ${id}: ${error.message}`);
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

/** Fetch only projects the member is assigned to. */
export async function getProjectsByMember(memberId: string): Promise<Project[]> {
  const ids = await getMemberProjectIds(memberId);
  if (ids.length === 0) return [];

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch projects for member: ${error.message}`);
  return data;
}

/** Lightweight project list for a member (sidebar/list views). */
export async function getProjectsForListByMember(memberId: string): Promise<ProjectListItem[]> {
  const ids = await getMemberProjectIds(memberId);
  if (ids.length === 0) return [];

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, client_id, status, total_value, deadline')
    .in('id', ids)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch project list for member: ${error.message}`);
  return data;
}
