import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getTeamMemberByEmail } from '@/lib/db/team-members';
import SettingsClient from './SettingsClient';

export default async function DashboardSettingsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect('/login');

  const member = await getTeamMemberByEmail(user.email).catch(() => null);

  return (
    <SettingsClient
      initialName={member?.name ?? ''}
      initialAvatarUrl={member?.avatar_url ?? ''}
      initialRole={member?.role ?? ''}
      email={user.email}
    />
  );
}
