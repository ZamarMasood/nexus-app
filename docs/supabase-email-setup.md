# Supabase Email Template Setup

## Step 1 — Reduce OTP Expiry (Do this now)

1. Supabase Dashboard → Authentication → Email
2. Find "OTP Expiry"
3. Change `3600` → `900` (15 minutes)
4. Save

## Step 2 — Update Confirm Signup Template

1. Supabase Dashboard → Authentication → Email Templates
2. Click "Confirm signup"
3. Subject: `Verify your Nexus account`
4. Replace the HTML body with the output of `getSignupOtpEmail()` from `lib/email-templates.ts`
5. Leave `{{ .Token }}` exactly as-is — Supabase replaces it with the real OTP code
6. Save

## Step 3 — Update Magic Link Template (REQUIRED for OTP resends)

When a user retries signup or clicks "Resend code", Supabase uses the **Magic Link**
template (not "Confirm signup"). Both templates must show the OTP code.

1. Still in Email Templates
2. Click "Magic Link"
3. Subject: `Verify your Nexus account`
4. Replace the HTML body with the **same** output of `getSignupOtpEmail()` from `lib/email-templates.ts`
5. Leave `{{ .Token }}` exactly as-is
6. Save

## Step 4 — Update Reset Password Template

1. Still in Email Templates
2. Click "Reset Password"
3. Subject: `Reset your Nexus password`
4. Replace the HTML body with the output of `getPasswordResetEmail()` from `lib/email-templates.ts`
5. Leave `{{ .Token }}` exactly as-is
6. Save

## Step 5 — Test All Templates

1. Each template has a "Send test" option in the dashboard
2. Send test for Confirm signup — verify it arrives correctly
3. Send test for Magic Link — verify it shows the OTP code (not a link)
4. Send test for Reset Password — verify it arrives correctly

## How to get the HTML

Run the preview script to generate the HTML files:

```bash
npm run preview:emails
```

Then open `.email-previews/signup-otp.html` and `.email-previews/password-reset.html` — copy the full HTML source and paste it into the Supabase template editor.

## Future: Custom SMTP Setup

When ready to send from your own domain (e.g. `noreply@yourdomain.com`) instead of Supabase's default sender:

1. Sign up at https://resend.com
2. Add your domain in Resend → Domains
3. Get your API key
4. Go to Supabase → Authentication → SMTP Settings
5. Enable Custom SMTP with Resend credentials:
   - Host: `smtp.resend.com`
   - Port: `465`
   - User: `resend`
   - Pass: your Resend API key
6. See: https://resend.com/docs/send-with-supabase-smtp

## Future: Transactional Email Service

The `app/api/send-email/route.ts` currently stubs email sending (logs in dev, returns success in prod). When ready to send real welcome emails:

1. `npm install resend`
2. Add `RESEND_API_KEY` to `.env.local`
3. Update `app/api/send-email/route.ts` to use Resend
4. See: https://resend.com/docs/send-with-nextjs