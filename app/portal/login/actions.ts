'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export interface PortalLoginState {
  error: string | null;
}

export async function portalSignInAction(
  prevState: PortalLoginState,
  formData: FormData
): Promise<PortalLoginState> {
  const email = formData.get('email') as string;
  const portalPassword = formData.get('portal_password') as string;

  if (!email || !portalPassword) {
    return { error: 'Email and portal password are required.' };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('email', email)
    .eq('portal_password', portalPassword)
    .single();

  if (error || !data) {
    return { error: 'Invalid credentials. Contact your project manager if you need access.' };
  }

  const cookieStore = cookies();
  cookieStore.set('portal_client_id', data.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
  });

  redirect('/portal/tasks');
}
