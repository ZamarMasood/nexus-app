'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

export interface LoginState {
  error: string | null;
}

// Keep backward-compat alias used by existing page.tsx
export type TeamLoginState = LoginState;

export async function signInAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = createSupabaseServerClient();

  // ── 1. Try Supabase Auth (team members) ──────────────────────────────────
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!authError) {
    redirect('/dashboard');
  }

  // ── 2. Try client portal login (bcrypt comparison) ───────────────────────
  const { data: clientRow, error: clientFetchError } = await supabase
    .from('clients')
    .select('id, portal_password')
    .eq('email', email)
    .maybeSingle();

  if (!clientFetchError && clientRow?.portal_password) {
    const match = await bcrypt.compare(password, clientRow.portal_password);
    if (match) {
      const cookieStore = cookies();
      cookieStore.set('portal_client_id', clientRow.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax',
      });
      redirect('/portal/tasks');
    }
  }

  // ── 3. Both failed — generic message (never reveal which one failed) ──────
  return { error: 'Invalid email or password.' };
}

export async function signOutAction(): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();

  const cookieStore = cookies();
  cookieStore.delete('portal_client_id');

  redirect('/login');
}
