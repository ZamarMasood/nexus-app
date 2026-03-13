import { supabase } from '../supabase';
import type { TeamMember } from '../types';

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch team members: ${error.message}`);
  return data;
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
