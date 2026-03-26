'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { checkRateLimit, formatResetTime } from '@/lib/rate-limit';

export interface ForgotPasswordState {
  error: string | null;
  success: string | null;
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();

  if (!email) {
    return { error: 'Please enter your email address.', success: null };
  }

  // Rate limiting
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success, resetMs } = checkRateLimit('forgot-pw:' + ip);
  if (!success) {
    return { error: `Too many attempts. Please try again in ${formatResetTime(resetMs)}.`, success: null };
  }

  const supabase = createSupabaseServerClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message, success: null };
  }

  // Always show success even if email doesn't exist (prevents email enumeration)
  return {
    error: null,
    success: 'If an account with that email exists, we\'ve sent a password reset link. Check your inbox.',
  };
}
