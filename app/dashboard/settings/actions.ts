'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getTeamMemberByEmail, updateTeamMember } from '@/lib/db/team-members';

export interface SettingsState {
  error: string | null;
  success: string | null;
}

export async function updateProfileAction(
  _prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const name = (formData.get('name') as string)?.trim();
  const avatar_url = (formData.get('avatar_url') as string)?.trim() || null;

  if (!name) return { error: 'Name is required.', success: null };

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: 'Not authenticated.', success: null };

  const member = await getTeamMemberByEmail(user.email).catch(() => null);
  if (!member) return { error: 'Team member record not found.', success: null };

  await updateTeamMember(member.id, { name, avatar_url });

  // Revalidate the dashboard layout so the sidebar picks up the new name
  revalidatePath('/dashboard', 'layout');

  return { error: null, success: 'Profile updated successfully.' };
}

export async function updatePasswordAction(
  _prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const password = formData.get('password') as string;
  const confirm = formData.get('confirm') as string;

  if (!password || password.length < 6)
    return { error: 'Password must be at least 6 characters.', success: null };
  if (password !== confirm)
    return { error: 'Passwords do not match.', success: null };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message, success: null };

  return { error: null, success: 'Password changed successfully.' };
}
