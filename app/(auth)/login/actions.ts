'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export interface TeamLoginState {
  error: string | null;
}

export async function signInAction(
  prevState: TeamLoginState,
  formData: FormData
): Promise<TeamLoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Invalid email or password. Please try again.' };
  }

  redirect('/dashboard');
}
