'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, formatResetTime } from '@/lib/rate-limit';

export interface SignupState {
  error: string | null;
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

// ── Validation helpers ─────────────────────────────────────────────────────────

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

// ── Main action ────────────────────────────────────────────────────────────────

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const companyName    = (formData.get('companyName')    as string | null) ?? '';
  const slug           = (formData.get('slug')           as string | null) ?? '';
  const fullName       = (formData.get('fullName')       as string | null) ?? '';
  const email          = (formData.get('email')          as string | null) ?? '';
  const password       = (formData.get('password')       as string | null) ?? '';
  const confirmPassword = (formData.get('confirmPassword') as string | null) ?? '';
  const terms          = formData.get('terms') as string | null;

  // ── Rate limiting ────────────────────────────────────────────────────────────
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success, resetMs } = checkRateLimit('signup:' + ip);
  if (!success) {
    return { error: `Too many attempts. Please try again in ${formatResetTime(resetMs)}.` };
  }

  // ── STEP A: Server-side validation ───────────────────────────────────────────
  const fieldErrors = validateInputs(companyName, slug, fullName, email, password, confirmPassword, terms);
  if (Object.keys(fieldErrors ?? {}).length > 0) {
    return { error: null, fieldErrors };
  }

  // ── STEP B: Check slug not taken ─────────────────────────────────────────────
  const { data: existingOrg } = await supabaseAdmin
    .from('organisations')
    .select('id')
    .eq('slug', slug.trim())
    .maybeSingle();

  if (existingOrg) {
    return { error: null, fieldErrors: { slug: 'This workspace name is already taken.' } };
  }

  // ── STEP C: Check email not already registered ────────────────────────────────
  const { data: existingMember } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (existingMember) {
    return { error: null, fieldErrors: { email: 'An account with this email already exists.' } };
  }

  let orgId = '';

  // ── STEP D: Create organisation ───────────────────────────────────────────────
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organisations' as any)
    .insert({ name: companyName.trim(), slug: slug.trim(), plan: 'free' })
    .select('id')
    .single();

  if (orgError || !org) {
    return { error: `Failed to create organisation: ${orgError?.message ?? 'unknown error'}` };
  }
  orgId = (org as unknown as { id: string }).id ?? '';

  // ── STEP E: Create Supabase Auth user (email NOT auto-confirmed) ─────────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: false,
    user_metadata: { full_name: fullName.trim(), org_id: orgId, user_role: 'admin', is_owner: true },
  });

  if (authError || !authData?.user) {
    // Roll back: delete organisation
    await supabaseAdmin.from('organisations').delete().eq('id', orgId);
    return { error: `Failed to create account: ${authError?.message ?? 'unknown error'}` };
  }

  // ── STEP F: (handled by trigger) ──────────────────────────────────────────────
  // handle_new_auth_user fires on auth.users INSERT and creates the team_members
  // row using org_id + user_role from the user_metadata we passed in Step E.
  // No separate insert/update needed here.

  // ── STEP G: Send confirmation email ───────────────────────────────────────────
  // Since email_confirm is false, Supabase won't auto-send a confirmation email
  // when using admin.createUser. We trigger it manually via the OTP/signup flow.
  const supabase = createSupabaseServerClient();
  await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard` },
  });

  // Redirect to login with a verify-email message instead of auto sign-in
  redirect('/login?verify=email');
}