import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Settings' };
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getTeamMemberByEmail } from '@/lib/db/team-members';
import { getProjectsForList } from '@/lib/db/projects';
import { getIntegrationKeys, type IntegrationKeyWithProject } from '@/lib/db/integration-keys';
import { getRequestSession } from "@/lib/db/session";
import SettingsClient from './SettingsClient';

export default async function DashboardSettingsPage() {
  const { user, member } = await getRequestSession();
  if (!user?.email) redirect('/login');

  let orgName = '';
  if (member?.org_id) {
    const { data: org } = await supabaseAdmin
      .from('organisations')
      .select('name')
      .eq('id', member.org_id)
      .maybeSingle();
    orgName = (org as { name: string } | null)?.name ?? '';
  }

  // Integrations are non-critical to the rest of the page — if the table is not
  // migrated yet, render Settings without them rather than 500-ing.
  const [projects, integrationKeys] = await Promise.all([
    getProjectsForList().catch(() => []),
    getIntegrationKeys().catch(() => [] as IntegrationKeyWithProject[]),
  ]);

  return (
    <SettingsClient
      initialName={member?.name ?? ''}
      initialAvatarUrl={member?.avatar_url ?? ''}
      userRole={member?.user_role ?? 'member'}
      email={user.email}
      isOwner={member?.is_owner ?? false}
      orgName={orgName}
      isAdmin={member?.user_role === 'admin'}
      projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      integrationKeys={integrationKeys}
    />
  );
}
