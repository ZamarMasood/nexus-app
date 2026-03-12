import { supabase } from '../supabase';
import type { Project, ProjectInsert, ProjectUpdate } from '../types';

export async function getProjects(clientId?: string): Promise<Project[]> {
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return data;
}

export async function getProjectById(id: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch project ${id}: ${error.message}`);
  return data;
}

export async function createProject(project: ProjectInsert): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return data;
}

export async function updateProject(id: string, updates: ProjectUpdate): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update project ${id}: ${error.message}`);
  return data;
}
