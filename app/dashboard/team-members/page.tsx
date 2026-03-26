import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Team Members' };
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getIsAdminByEmail, getIsOwnerById } from '@/lib/db/team-members';
import { getTeamMembersWithProjects } from '@/lib/db/team-members';
import { getProjects } from '@/lib/db/projects';
import TeamMembersClient from './TeamMembersClient';

export const dynamic = 'force-dynamic';

export default async function TeamMembersPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) redirect('/login');

  const isAdmin = await getIsAdminByEmail(user.email);
  if (!isAdmin) redirect('/dashboard');

  const [members, projects, isOwner] = await Promise.all([
    getTeamMembersWithProjects(),
    getProjects(),
    getIsOwnerById(user.id),
  ]);

  return (
    <TeamMembersClient
      initialMembers={members}
      projects={projects}
      currentUserId={user.id}
      isOwner={isOwner}
    />
  );
}
