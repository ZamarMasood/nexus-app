import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getIsAdminByEmail } from '@/lib/db/team-members';
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

  const [members, projects] = await Promise.all([
    getTeamMembersWithProjects(),
    getProjects(),
  ]);

  return (
    <TeamMembersClient
      initialMembers={members}
      projects={projects}
      currentUserId={user.id}
    />
  );
}
