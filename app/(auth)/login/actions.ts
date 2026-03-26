'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getTeamMemberByEmail } from '@/lib/db/team-members';
import { checkRateLimit, formatResetTime } from '@/lib/rate-limit';
import { generateCsrfToken, setCsrfCookie, deleteCsrfCookie } from '@/lib/csrf';
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

  // ── Rate limiting ────────────────────────────────────────────────────────────
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success, resetMs } = checkRateLimit('login:' + ip);
  if (!success) {
    return { error: `Too many attempts. Please try again in ${formatResetTime(resetMs)}.` };
  }

  const supabase = createSupabaseServerClient();

  // ── Run both auth methods in parallel ──────────────────────────────────────
  // Client lookup uses supabaseAdmin to bypass RLS (anon role blocks clients reads)
  const [authResult, clientResult] = await Promise.all([
    supabase.auth.signInWithPassword({ email, password }),
    supabaseAdmin.from('clients').select('id, portal_password').eq('email', email).maybeSingle(),
  ]);

  // 1. Team member auth succeeded → check org_id then redirect
  if (!authResult.error) {
    const member = await getTeamMemberByEmail(email);
    if (!member?.org_id) {
      // Old account with no org — redirect to migration page
      redirect('/setup-org');
    }
    redirect('/dashboard');
  }

  // 1b. Email not confirmed — give a clear message instead of "Invalid email or password"
  if (authResult.error?.message?.toLowerCase().includes('email not confirmed')) {
    return { error: 'Please verify your email before logging in. Check your inbox for a confirmation link.' };
  }

  // 2. Client portal auth — check bcrypt
  if (!clientResult.error && clientResult.data?.portal_password) {
    const match = await bcrypt.compare(password, clientResult.data.portal_password);
    if (match) {
      const cookieStore = cookies();
      cookieStore.set('portal_client_id', clientResult.data.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax',
      });
      // Set CSRF token for portal session
      const csrfToken = generateCsrfToken();
      setCsrfCookie(csrfToken);
      redirect('/portal/tasks');
    }
  }

  // 3. Both failed
  return { error: 'Invalid email or password.' };
}

export async function signOutAction(): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();

  const cookieStore = cookies();
  cookieStore.delete('portal_client_id');
  deleteCsrfCookie();

  redirect('/login');
}
