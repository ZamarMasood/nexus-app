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
