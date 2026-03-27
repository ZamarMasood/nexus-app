// Transactional email endpoint — currently logs in dev, stubs in production.
// Supabase handles all critical emails (OTP, password reset, invites) directly.
// To enable app-triggered emails (welcome, etc.) in production, integrate an
// email service here (Resend, SendGrid, etc.) when you have a custom domain.

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { checkRateLimit, formatResetTime } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Authenticate: only logged-in team members can trigger emails
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit by user ID
  const { success: allowed, resetMs } = checkRateLimit('send-email:' + user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many email requests. Please try again in ${formatResetTime(resetMs)}.` },
      { status: 429 }
    );
  }

  let body: { to?: string; subject?: string; html?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { to, subject, html } = body;

  if (!to || !subject || !html) {
    return NextResponse.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
  }

  if (typeof to !== 'string' || !to.includes('@')) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  if (typeof html !== 'string' || html.length > 512_000) {
    return NextResponse.json({ error: 'Email body too large' }, { status: 400 });
  }

  // Development: log summary (no PII)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Email] dev mode — subject: "${subject}", HTML length: ${html.length} chars`);
    return NextResponse.json({ success: true, mode: 'development' });
  }

  // Production: stub — welcome emails are non-critical.
  // All critical emails (invites, OTP, password reset) go through Supabase directly.
  return NextResponse.json({ success: true, mode: 'stub' });
}