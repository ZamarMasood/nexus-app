// Lets notes2board show a project picker, the way it shows a Trello board picker.
//
// Scope note: this returns project ids and names and nothing else. No tasks, no
// clients, no invoices, no team members. A key is a write credential with just
// enough read attached to answer "where can I put this?".

import { NextRequest, NextResponse } from 'next/server';
import { authenticateIntegrationRequest } from '@/lib/integration-auth';
import { getProjectsForIntegrationKey } from '@/lib/db/integration-keys';

export async function GET(req: NextRequest) {
  const auth = await authenticateIntegrationRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const projects = await getProjectsForIntegrationKey(auth.key.org_id);

    return NextResponse.json({
      // A locked key still answers, so the caller can show which single project
      // it is pinned to rather than an empty dropdown.
      lockedProjectId: auth.key.project_id,
      projects,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch projects';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
