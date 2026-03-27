'use server';

import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, formatResetTime } from '@/lib/rate-limit';

export interface ForgotPasswordState {
  error: string | null;
  success: boolean;
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();

  if (!email) {
    return { error: 'Please enter your email address.', success: false };
  }

  // Rate limiting
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success, resetMs } = checkRateLimit('forgot-pw:' + ip);
  if (!success) {
    return { error: `Too many attempts. Please try again in ${formatResetTime(resetMs)}.`, success: false };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Use admin (service_role) client — the server-side anon client has no user
  // session in this context and may silently fail to send.
  await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  // Always return success to prevent email enumeration
  return { error: null, success: true };
}
