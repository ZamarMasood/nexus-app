'use server';

import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, formatResetTime } from '@/lib/rate-limit';

export interface ForgotPasswordState {
  error: string | null;
  success: string | null;
  resetLink?: string | null;
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  // Generate the reset link server-side (no SMTP needed)
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    },
  });

  if (linkError) {
    // Don't reveal whether the email exists
    if (linkError.message.toLowerCase().includes('user not found')) {
      return {
        error: null,
        success: 'If an account with that email exists, a reset link has been generated.',
        resetLink: null,
      };
    }
    return { error: linkError.message, success: null };
  }

  const resetLink = linkData?.properties?.action_link ?? null;

  return {
    error: null,
    success: 'Use the link below to reset your password.',
    resetLink,
  };
}
