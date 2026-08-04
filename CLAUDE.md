# CLAUDE.md — Nexus App

Workspace-level rules are in [../CLAUDE.md](../CLAUDE.md) (session memory, repo
layout, the notes2board integration).

**UI work:** the design system lives in
[.claude/rules/ui-design-system.md](.claude/rules/ui-design-system.md). It loads
automatically when working on `.tsx`, `.css` or `tailwind.config.ts`, so it does
not cost context on backend or database work.

---

## Project Overview

A full-stack project management + client portal app (Linear/GetOrchestra
alternative). Replaces ClickUp/Linear for internal task management and
GetOrchestra for client-facing portals.

## Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel (auto-deploy on push)
- **Architecture:** Multi-tenant SaaS — every workspace isolated by `org_id`

## Dev Commands
```bash
npm run dev          # local dev server (http://localhost:3000)
npm run build        # production build
npm run lint         # ESLint
npx tsc --noEmit     # type check — run before every commit
```

The user runs builds, servers and deploys. Give the command, don't run it.

---

## Full documentation

Written from a read of the code — prefer these over guessing:

| Doc | Covers |
|---|---|
| [docs/01-overview.md](docs/01-overview.md) | Product, features, current status, known gaps |
| [docs/02-architecture.md](docs/02-architecture.md) | Routing, middleware, auth flows, multi-tenancy |
| [docs/03-database.md](docs/03-database.md) | Every table and column — **the accurate schema** |
| [docs/04-api-reference.md](docs/04-api-reference.md) | API routes, server actions, `lib/db` helpers |
| [docs/05-setup-and-deploy.md](docs/05-setup-and-deploy.md) | Env vars, Supabase setup, deploy |
| [docs/06-notes2board-integration.md](docs/06-notes2board-integration.md) | The notes2board task ingest |

**Stale — do not trust:** `docs/schema.sql` (pre-multi-tenant),
`docs/design-tokens.md` (documents `--color-*` variables that no longer exist).

Migration history is real and complete in [supabase/migrations/](supabase/migrations/).

---

## Multi-tenancy — the rule everything hangs off

Every tenant table has `org_id`. **Every read filters on it. Every write sets it
from the server, never from client input.**

- Get it with `getCallerOrgId()` from `lib/db/team-members.ts`
- Never accept `org_id` from the browser
- Most queries run through `supabaseAdmin` (service role), which **bypasses RLS** —
  so the `.eq('org_id', orgId)` in the query *is* the security boundary, not a
  redundancy. RLS is the second net
- Verify foreign keys (`project_id`, `assignee_id`) belong to the caller's org
  before inserting — the browser can send any UUID

Helper SQL functions: `get_org_id()`, `is_admin()`, `is_owner()`.

## Roles
- `team_members.user_role` — `admin` | `member`. Admins invite, edit, remove.
- `team_members.is_owner` — exactly one. Only the owner deletes the workspace or
  changes roles.
- Non-admins see only projects they are on, via `project_members`. Every `lib/db`
  module has a matching `…ByMember(memberId)` query.

## Routing
- `/{slug}/*` → team only. Middleware rewrites to `/dashboard/*` internally
- `/dashboard/*` → redirected to `/{slug}/*`
- `/portal/*` → client only, cookie session (`portal_client_id` + `portal_csrf_token`)
- A client session must never reach workspace routes, and vice versa
- Build links with `useWorkspaceSlug()` — never hardcode `/dashboard/...`.
  `revalidatePath('/dashboard', 'layout')` still uses `/dashboard` (filesystem path)

Detail: [docs/02-architecture.md](docs/02-architecture.md).

---

## Architecture Rules
- Portal routes filter by `client_id` every time. Never expose assignees,
  internal comments or the full client list there
- Server Components by default; add `"use client"` only when interactivity needs it
- No inline Supabase client creation — go through `lib/supabase*.ts`
- Never import `SUPABASE_SERVICE_ROLE_KEY` into a `"use client"` file
- If a member has `org_id = null`, redirect to `/setup-org`
- Don't add npm packages without checking shadcn/ui or Supabase covers it first
- Don't use client-side filtering as a substitute for proper scoping

## Coding Preferences
- `async/await` over `.then()` chains
- Handle every Supabase error explicitly — never swallow one
- Named exports for components, default export at the bottom

## Enum values
- **Task status:** any `task_statuses.slug` — `todo` | `in_progress` | `done` are
  seeded defaults, but workspaces add their own. `TaskStatus` is `string`
- **Priority:** `urgent` | `high` | `normal` | `low`
- **Client status:** `active` | `inactive` | `paused`
- **Invoice status:** `pending` | `paid` | `overdue`

---

## Known issues (not yet fixed)

- **`comments` and `files` have an RLS policy of `USING (true) WITH CHECK (true)`
  for ALL on `authenticated`.** Any logged-in user of any workspace can read and
  write every comment and file in the database via PostgREST. App code is safe
  (it goes through `supabaseAdmin` with explicit filters), but the database is
  not enforcing isolation on those two tables
- Rate limiting (`lib/rate-limit.ts`) is in-memory, so on Vercel each serverless
  instance keeps its own counter — the real limit is looser than configured
- `@anthropic-ai/sdk` is in `package.json` but nothing imports it
- No test runner in this project
