'use server';

import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, formatResetTime } from '@/lib/rate-limit';

// ── Step 1: Check user exists and send OTP via Supabase ──────────────────────

export interface SendOtpState {
  error: string | null;
  success: boolean;
  email?: string;
}

export async function sendOtpAction(
  _prevState: SendOtpState,
  formData: FormData
): Promise<SendOtpState> {
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

  // Check if user exists in team_members (but don't reveal to the user)
  const { data: member } = await supabaseAdmin
    .from('team_members')
    .select('id, email, user_role')
    .eq('email', email)
    .single();

  if (!member) {
    // Return success to prevent email enumeration — the client will attempt
    // to send an OTP via Supabase which will silently fail for unknown emails
    return { error: null, success: true, email };
  }

  return { error: null, success: true, email };
}