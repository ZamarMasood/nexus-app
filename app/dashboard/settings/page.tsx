import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getTeamMemberByEmail } from '@/lib/db/team-members';
import SettingsClient from './SettingsClient';

export default async function DashboardSettingsPage() {
  const supabase = createSupabaseServerClient();
  // Use getSession() (reads JWT locally) — middleware already validated auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email) redirect('/login');

  const member = await getTeamMemberByEmail(session.user.email).catch(() => null);

  return (
    <SettingsClient
      initialName={member?.name ?? ''}
      initialAvatarUrl={member?.avatar_url ?? ''}
      initialRole={member?.role ?? ''}
      email={session.user.email}
    />
  );
}
