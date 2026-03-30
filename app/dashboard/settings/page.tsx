import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Settings' };
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getTeamMemberByEmail } from '@/lib/db/team-members';
import SettingsClient from './SettingsClient';

export default async function DashboardSettingsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect('/login');

  const member = await getTeamMemberByEmail(user.email).catch(() => null);

  let orgName = '';
  if (member?.org_id) {
    const { data: org } = await supabaseAdmin
      .from('organisations')
      .select('name')
      .eq('id', member.org_id)
      .maybeSingle();
    orgName = (org as { name: string } | null)?.name ?? '';
  }

  return (
    <SettingsClient
      initialName={member?.name ?? ''}
      initialAvatarUrl={member?.avatar_url ?? ''}
      userRole={member?.user_role ?? 'member'}
      email={user.email}
      isOwner={member?.is_owner ?? false}
      orgName={orgName}
    />
  );
}
