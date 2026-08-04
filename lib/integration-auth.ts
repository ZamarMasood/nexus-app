// Shared bearer-key auth for the /api/integrations/* routes.
//
// These endpoints have no user session — the key IS the credential. Keeping the
// check in one place means the "unknown and revoked look identical" rule can't
// drift apart between routes.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resolveIntegrationKey, type ResolvedIntegrationKey } from '@/lib/db/integration-keys';
import { checkRateLimit, getRateLimitConfig, formatResetTime } from '@/lib/rate-limit';

export type IntegrationAuthResult =
  | { ok: true; key: ResolvedIntegrationKey }
  | { ok: false; response: NextResponse };

/**
 * Rate limit one integration key across every serverless instance.
 *
 * checkRateLimit() counts in process memory, so on Vercel the configured 30 per
 * 5 minutes becomes 30 per instance — a limit the app cannot actually enforce.
 * The check_rate_limit() SQL function keeps one shared counter instead.
 *
 * Falls back to the in-memory counter if that function is not there yet, so the
 * endpoint keeps working whether or not the migration has been applied. A loose
 * limit is better than a 500.
 */
async function checkIntegrationRateLimit(
  keyId: string,
): Promise<{ success: boolean; resetMs: number }> {
  const config = getRateLimitConfig('integration');
  if (!config) return { success: true, resetMs: 0 };

  try {
    const { data, error } = await (supabaseAdmin as any).rpc('check_rate_limit', {
      p_bucket_key: `integration:${keyId}`,
      p_max_hits: config.maxAttempts,
      p_window_secs: Math.round(config.windowMs / 1000),
    });

    if (error) throw error;

    // The function returns a single row of (allowed, retry_after_seconds).
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.allowed !== 'boolean') throw new Error('unexpected shape');

    return { success: row.allowed, resetMs: (row.retry_after_seconds ?? 0) * 1000 };
  } catch {
    return checkRateLimit(`integration:${keyId}`);
  }
}

/**
 * Resolve and rate-limit the bearer key on a request.
 *
 * On failure returns the exact response to send. Unknown and revoked keys give
 * the same 401 on purpose — telling them apart turns this into an oracle that
 * confirms which guessed keys used to be real.
 */
export async function authenticateIntegrationRequest(
  req: NextRequest,
): Promise<IntegrationAuthResult> {
  const authHeader = req.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Missing Authorization: Bearer <key> header' },
        { status: 401 }
      ),
    };
  }

  const key = await resolveIntegrationKey(match[1]);
  if (!key) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid or revoked key' }, { status: 401 }),
    };
  }

  // Keyed by the key id, not the IP — two workspaces behind one egress IP must
  // not throttle each other.
  const { success, resetMs } = await checkIntegrationRateLimit(key.id);
  if (!success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Too many requests. Please try again in ${formatResetTime(resetMs)}.` },
        { status: 429 }
      ),
    };
  }

  return { ok: true, key };
}
