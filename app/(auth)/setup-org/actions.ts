'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface SetupOrgState {
  error: string | null;
  fieldErrors?: {
    companyName?: string;
    slug?: string;
  };
}

export async function setupOrgAction(
  _prevState: SetupOrgState,
  formData: FormData
): Promise<SetupOrgState> {
  const companyName = ((formData.get('companyName') as string) ?? '').trim();
  const slug        = ((formData.get('slug')        as string) ?? '').trim();

  // Validate
  const fieldErrors: SetupOrgState['fieldErrors'] = {};
  if (!companyName || companyName.length < 2) {
    fieldErrors.companyName = 'Company name must be at least 2 characters.';
  }
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fieldErrors.slug = 'Slug must use only lowercase letters, numbers, and hyphens.';
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  // Get current user
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  // Check slug not taken
  const { data: existingOrg } = await supabaseAdmin
    .from('organisations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existingOrg) {
    return { error: null, fieldErrors: { slug: 'This workspace name is already taken.' } };
  }

  // Create organisation
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organisations')
    .insert({ name: companyName, slug, plan: 'free' })
    .select('id')
    .single();

  if (orgError || !org) {
    return { error: 'Failed to create organisation. Please try again.' };
  }

  const orgId = (org as unknown as { id: string }).id;

  // Link team_member to org
  const { error: updateError } = await supabaseAdmin
    .from('team_members')
    .update({ org_id: orgId } as any)
    .eq('id', user.id);

  if (updateError) {
    // Roll back org creation
    await supabaseAdmin.from('organisations').delete().eq('id', orgId);
    return { error: 'Failed to link your account to the organisation.' };
  }

  redirect('/dashboard');
}