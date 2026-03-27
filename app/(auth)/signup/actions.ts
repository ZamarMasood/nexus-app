'use server';

import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, formatResetTime } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';
import { getWelcomeEmail } from '@/lib/email-templates';

// -- Step 1: Validate form + create org + send confirmation link ---------------

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

  const trimmedEmail = email.trim().toLowerCase();

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
  const { data: existingMember } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('email', trimmedEmail)
    .not('org_id', 'is', null)
    .maybeSingle();

  if (existingMember) {
    return { error: null, fieldErrors: { email: 'An account with this email already exists.' } };
  }

  // STEP D: Create organisation
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organisations' as any)
    .insert({ name: companyName.trim(), slug: slug.trim(), plan: 'free' })
    .select('id')
    .single();

  if (orgError || !org) {
    return { error: `Failed to create organisation: ${orgError?.message ?? 'unknown error'}` };
  }
  const orgId = (org as unknown as { id: string }).id ?? '';

  // STEP E: Create auth user with email confirmation DISABLED (Supabase sends confirmation link)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const metadata = { full_name: fullName.trim(), org_id: orgId, user_role: 'admin', is_owner: true };

  // Check if an auth user already exists (e.g. from a previous incomplete signup attempt)
  const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
  const existingAuthUser = allUsers?.find((u) => u.email === trimmedEmail) ?? null;

  let authUserId: string;

  if (existingAuthUser) {
    // Update existing auth user with new password and metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingAuthUser.id,
      { password, email_confirm: false, user_metadata: metadata }
    );
    if (updateError) {
      await supabaseAdmin.from('organisations').delete().eq('id', orgId);
      return { error: `Failed to set up account: ${updateError.message}` };
    }
    authUserId = existingAuthUser.id;

    // Re-send confirmation email via generateLink
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: trimmedEmail,
      password,
      options: { redirectTo: `${siteUrl}/auth/callback?next=/dashboard` },
    });
    // linkData is used implicitly — Supabase sends the email
    void linkData;
  } else {
    // Create new auth user — Supabase automatically sends confirmation email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: false, // User must click confirmation link
      user_metadata: metadata,
    });

    if (authError) {
      await supabaseAdmin.from('organisations').delete().eq('id', orgId);
      return { error: `Failed to create account: ${authError.message}` };
    }
    authUserId = authData.user.id;

    // Generate and "send" the confirmation link via Supabase
    await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: trimmedEmail,
      password,
      options: { redirectTo: `${siteUrl}/auth/callback?next=/dashboard` },
    });
  }

  // STEP F: Upsert team_members row
  await supabaseAdmin
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
  } catch {
    // Non-critical
  }

  return { error: null, success: true, email: trimmedEmail };
}
