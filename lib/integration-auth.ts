// Shared bearer-key auth for the /api/integrations/* routes.
//
// These endpoints have no user session — the key IS the credential. Keeping the
// check in one place means the "unknown and revoked look identical" rule can't
// drift apart between routes.

import { NextRequest, NextResponse } from 'next/server';
import { resolveIntegrationKey, type ResolvedIntegrationKey } from '@/lib/db/integration-keys';
import { checkRateLimit, formatResetTime } from '@/lib/rate-limit';

export type IntegrationAuthResult =
  | { ok: true; key: ResolvedIntegrationKey }
  | { ok: false; response: NextResponse };

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
  const { success, resetMs } = checkRateLimit(`integration:${key.id}`);
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
