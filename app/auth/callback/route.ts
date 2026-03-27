import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { getWelcomeEmail } from '@/lib/email-templates';

/**
 * Supabase redirects here after a user clicks an email link
 * (signup confirmation, password reset, etc.).
 *
 * The URL contains a `code` param that we exchange for a session.
 * For signup confirmations, we also create the organisation and team_member rows.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const type = searchParams.get('type');

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Invited users need to set their password first
      if (type === 'invite') {
        return NextResponse.redirect(new URL('/reset-password', origin));
      }

      // For signup confirmations: create org + team_member now that email is verified
      if (type === 'signup') {
        const provisionError = await provisionWorkspace(supabase);
        if (provisionError) {
          return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(provisionError)}`, origin)
          );
        }
      }

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin));
}

/**
 * After email verification, create the organisation and team_member rows
 * using data stored in the user's metadata during signup.
 */
async function provisionWorkspace(
  supabase: ReturnType<typeof createServerClient>
): Promise<string | null> {
  // Get the now-verified user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'Could not retrieve verified user.';

  const meta = user.user_metadata;

  // If signup_pending is not set, workspace was already provisioned (e.g. page refresh)
  if (!meta?.signup_pending) return null;

  const companyName = meta.company_name as string;
  const slug = meta.slug as string;
  const fullName = meta.full_name as string;

  if (!companyName || !slug || !fullName) {
    return 'Missing signup details. Please sign up again.';
  }

  // Re-check slug uniqueness (could have been taken between signup and verification)
  const { data: existingOrg } = await supabaseAdmin
    .from('organisations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existingOrg) {
    return 'Your workspace name was taken while awaiting verification. Please sign up again with a different workspace name.';
  }

  // Create organisation
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organisations' as any)
    .insert({ name: companyName, slug, plan: 'free' })
    .select('id')
    .single();

  if (orgError || !org) {
    return `Failed to create workspace: ${orgError?.message ?? 'unknown error'}`;
  }

  const orgId = (org as unknown as { id: string }).id;

  // Create team_members row
  const { error: memberError } = await supabaseAdmin
    .from('team_members')
    .upsert(
      {
        id: user.id,
        org_id: orgId,
        name: fullName,
        email: user.email!,
        user_role: 'admin',
        is_owner: true,
      },
      { onConflict: 'id' }
    );

  if (memberError) {
    // Rollback org creation
    await supabaseAdmin.from('organisations').delete().eq('id', orgId);
    return `Failed to create team member: ${memberError.message}`;
  }

  // Update auth user metadata: set org_id and clear signup_pending flag
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, org_id: orgId, signup_pending: false },
  });

  // Send welcome email — never block on failure
  try {
    await sendEmail({
      to: user.email!,
      subject: 'Welcome to Nexus — your workspace is ready',
      html: getWelcomeEmail({
        memberName: fullName,
        companyName,
      }),
    });
  } catch {
    // Non-critical
  }

  return null;
}