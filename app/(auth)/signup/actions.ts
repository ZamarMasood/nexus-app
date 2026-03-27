'use server';

import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, formatResetTime } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';
import { getWelcomeEmail } from '@/lib/email-templates';

// -- Helper: Send OTP via GoTrue /otp endpoint --------------------------------
// Uses service_role key to bypass API-level rate limits.
// Supabase sends the actual email (no custom email service needed).
//
// IMPORTANT: This endpoint uses different email templates depending on user state:
//   - NEW user (create_user:true)  → "Confirm signup" template
//   - EXISTING user (resend/retry) → "Magic Link" template
// Both templates MUST be configured in Supabase Dashboard → Auth → Email Templates
// with the {{ .Token }} variable so the 6-digit OTP code is included.

async function sendOtpEmail(email: string): Promise<{ error: string | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      email,
      create_user: true,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.msg || body?.error_description || body?.message || 'Failed to send verification code.' };
  }

  return { error: null };
}

// -- Step 1: Validate form + send OTP (NO DB writes) -------------------------

export interface SignupState {
  error: string | null;
  success?: boolean;
  email?: string;
  fieldErrors?: {
    companyName?: string;
    slug?: string;
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  };
}

function validateInputs(
  companyName: string,
  slug: string,
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
  terms: string | null
): SignupState['fieldErrors'] {
  const errors: SignupState['fieldErrors'] = {};

  if (!companyName || companyName.trim().length < 2) {
    errors.companyName = 'Company name must be at least 2 characters.';
  }

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = 'Slug must use only lowercase letters, numbers, and hyphens.';
  }

  if (!fullName || fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (terms !== 'on') {
    errors.terms = 'You must agree to the Terms of Service.';
  }

  return errors;
}

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const companyName     = (formData.get('companyName')     as string | null) ?? '';
  const slug            = (formData.get('slug')            as string | null) ?? '';
  const fullName        = (formData.get('fullName')        as string | null) ?? '';
  const email           = (formData.get('email')           as string | null) ?? '';
  const password        = (formData.get('password')        as string | null) ?? '';
  const confirmPassword = (formData.get('confirmPassword') as string | null) ?? '';
  const terms           = formData.get('terms') as string | null;

  // Rate limiting
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success, resetMs } = checkRateLimit('signup:' + ip);
  if (!success) {
    return { error: `Too many attempts. Please try again in ${formatResetTime(resetMs)}.` };
  }

  // STEP A: Server-side validation
  const fieldErrors = validateInputs(companyName, slug, fullName, email, password, confirmPassword, terms);
  if (Object.keys(fieldErrors ?? {}).length > 0) {
    return { error: null, fieldErrors };
  }

  // STEP B: Check slug not taken
  const { data: existingOrg } = await supabaseAdmin
    .from('organisations')
    .select('id')
    .eq('slug', slug.trim())
    .maybeSingle();

  if (existingOrg) {
    return { error: null, fieldErrors: { slug: 'This workspace name is already taken.' } };
  }

  // STEP C: Check email not already registered (only flag completed signups with org_id)
  // The OTP flow's create_user:true triggers handle_new_auth_user which inserts a
  // team_members row with org_id=null. We must ignore those incomplete rows.
  const { data: existingMember } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .not('org_id', 'is', null)
    .maybeSingle();

  if (existingMember) {
    return { error: null, fieldErrors: { email: 'An account with this email already exists.' } };
  }

  // STEP D: Send OTP — Supabase sends the actual email
  const { error: otpError } = await sendOtpEmail(email.trim().toLowerCase());

  if (otpError) {
    return { error: 'Failed to send verification code. Please try again.' };
  }

  return { error: null, success: true, email: email.trim().toLowerCase() };
}

// -- Step 2: Create org + user (called AFTER OTP verification) ----------------

export interface CreateOrgState {
  error: string | null;
  success: boolean;
}

export async function createOrgAction(
  companyName: string,
  slug: string,
  fullName: string,
  email: string,
  password: string
): Promise<CreateOrgState> {
  if (!companyName || !slug || !fullName || !email || !password) {
    return { error: 'All fields are required.', success: false };
  }

  // Re-check slug uniqueness (could have been taken between OTP send and verify)
  const { data: existingOrg } = await supabaseAdmin
    .from('organisations')
    .select('id')
    .eq('slug', slug.trim())
    .maybeSingle();

  if (existingOrg) {
    return { error: 'This workspace name was taken while you were verifying. Please go back and choose another.', success: false };
  }

  // Re-check email uniqueness (only flag completed signups with org_id)
  const { data: existingMember } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .not('org_id', 'is', null)
    .maybeSingle();

  if (existingMember) {
    return { error: 'An account with this email already exists. Please log in instead.', success: false };
  }

  // Create organisation
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organisations' as any)
    .insert({ name: companyName.trim(), slug: slug.trim(), plan: 'free' })
    .select('id')
    .single();

  if (orgError || !org) {
    return { error: `Failed to create organisation: ${orgError?.message ?? 'unknown error'}`, success: false };
  }
  const orgId = (org as unknown as { id: string }).id ?? '';

  // The OTP flow (create_user: true) may have already created an auth user.
  // The OTP flow (create_user: true) may have already created a passwordless
  // auth user. Try creating first; if it fails with "already registered",
  // look up that user and update them with password + metadata instead.
  const trimmedEmail = email.trim().toLowerCase();
  const metadata = { full_name: fullName.trim(), org_id: orgId, user_role: 'admin', is_owner: true };

  let authUserId: string | null = null;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: trimmedEmail,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (authError) {
    // User already exists (created by OTP flow) — find and update
    if (authError.message?.toLowerCase().includes('already been registered') ||
        authError.message?.toLowerCase().includes('already exists')) {
      const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = allUsers?.find((u) => u.email === trimmedEmail) ?? null;

      if (!existingUser) {
        await supabaseAdmin.from('organisations').delete().eq('id', orgId);
        return { error: 'Could not locate your account. Please try again.', success: false };
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password, email_confirm: true, user_metadata: metadata }
      );

      if (updateError) {
        await supabaseAdmin.from('organisations').delete().eq('id', orgId);
        return { error: `Failed to set up account: ${updateError.message}`, success: false };
      }

      authUserId = existingUser.id;
    } else {
      await supabaseAdmin.from('organisations').delete().eq('id', orgId);
      return { error: `Failed to create account: ${authError.message}`, success: false };
    }
  } else if (!authData?.user) {
    await supabaseAdmin.from('organisations').delete().eq('id', orgId);
    return { error: 'Failed to create account: unknown error', success: false };
  } else {
    authUserId = authData.user.id;
  }

  // Ensure team_members row exists. The handle_new_auth_user trigger fires on
  // auth.users INSERT, but when the OTP flow already created the user (before
  // the org existed), the trigger either didn't create a row or created one
  // without org_id. Upsert here to guarantee the row is correct.
  if (authUserId) {
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .upsert(
        {
          id: authUserId,
          org_id: orgId,
          name: fullName.trim(),
          email: trimmedEmail,
          user_role: 'admin',
          is_owner: true,
        },
        { onConflict: 'id' }
      );

    if (memberError) {
      // Non-fatal: log but don't fail signup — the trigger may have handled it
      console.error('Failed to upsert team_members row:', memberError.message);
    }
  }

  // Send welcome email — never block signup on email failure
  try {
    await sendEmail({
      to: trimmedEmail,
      subject: 'Welcome to Nexus — your workspace is ready',
      html: getWelcomeEmail({
        memberName: fullName.trim(),
        companyName: companyName.trim(),
      }),
    });
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
  }

  return { error: null, success: true };
}

// -- Resend OTP action --------------------------------------------------------

export interface ResendOtpState {
  error: string | null;
  success: boolean;
}

export async function resendSignupOtpAction(
  email: string
): Promise<ResendOtpState> {
  if (!email) {
    return { error: 'Email is required.', success: false };
  }

  // Rate limiting
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success, resetMs } = checkRateLimit('signup-otp:' + ip);
  if (!success) {
    return { error: `Too many attempts. Please try again in ${formatResetTime(resetMs)}.`, success: false };
  }

  const { error: otpError } = await sendOtpEmail(email.trim().toLowerCase());

  if (otpError) {
    return { error: otpError, success: false };
  }

  return { error: null, success: true };
}