# CLAUDE.md — Project Management Tool

---

## Always Do First
- Before writing any frontend code, use the Read tool to open and read 
  the file at `.claude/skills/frontend-design.md`.
- Do not use Skill() — use the Read tool on that file path directly.
- If the file is not found at that path, STOP immediately and tell the 
  user: "frontend-design.md skill file is missing. Please create it at 
  .claude/skills/frontend-design.md before continuing." Do not proceed 
  with any frontend work until the file is confirmed readable.

---

## Project Overview
A full-stack project management + client portal app (Linear/GetOrchestra alternative).
Replaces ClickUp/Linear for internal task management and GetOrchestra for client-facing portals.

---

## Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel (auto-deploy on push)
- **Architecture:** Multi-tenant SaaS — every workspace is isolated by `org_id`

---

## Dev Commands
```bash
npm run dev          # Start local dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npx tsc --noEmit     # TypeScript type check (run before every commit)
```

---

## SaaS Architecture

This is a **multi-tenant SaaS** app. Each company that signs up gets an isolated workspace.

**organisations table** is the root of all tenant data:
- Every table (`clients`, `projects`, `tasks`, `invoices`, `team_members`, `project_members`) has an `org_id UUID` foreign key referencing `organisations.id`
- RLS policies on all tables enforce `org_id = get_org_id()` isolation at the database level
- `get_org_id()` is a SQL function: `SELECT org_id FROM team_members WHERE id = auth.uid()`
- `is_admin()` is a SQL function: `SELECT EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND user_role = 'admin')`

**Signup flow** (`/signup`):
1. Validate inputs server-side
2. Check slug uniqueness in `organisations`
3. Check email uniqueness in `team_members`
4. Create `organisations` row → get `orgId`
5. Create Supabase Auth user with `email_confirm: true`
6. Create `team_members` row with `id = auth_user.id`, `org_id = orgId`, `user_role = 'admin'`
7. Auto sign in → redirect to `/dashboard`
8. On any failure: roll back all created rows in reverse order

**Existing users without org** (`/setup-org`):
- If a team member logs in and `org_id IS NULL`, redirect to `/setup-org`
- `/setup-org` creates an org and links it to the existing member row

**Key rules for all future code:**
- Every INSERT must include `org_id` — get it via `getCallerOrgId()` from `lib/db/team-members.ts`
- Never allow cross-org data access — RLS enforces this at DB level, but also filter by `org_id` in queries
- `getCallerOrgId()` gets the current user's org via their `team_members` row
- Never accept `org_id` as user input — always derive it server-side from the authenticated user

---

## Authentication Flow

There is ONE login page at `app/(auth)/login/` shared by both team members and clients.

**Logic:**
1. User submits email + password
2. First, try Supabase Auth login (team members)
   - If success → redirect to `/dashboard`
3. If Supabase Auth fails, query the `clients` table:
   `WHERE email = ? AND portal_password = ?`
   - If match found → create a client session, redirect to `/portal/tasks`
4. If both fail → show "Invalid email or password" error

**Middleware rules (`middleware.ts`):**
- Protect `/dashboard/*` → redirect to `/login` if no team session
- Protect `/portal/*` → redirect to `/login` if no client session
- A client session must NEVER access `/dashboard/*` routes
- A team session must NEVER access `/portal/*` routes

**Security note:**
- `portal_password` in the `clients` table must be hashed with `bcrypt` — never store plain text passwords

---

## Local Server & Screenshot Workflow

- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

**Screenshots:**
- Puppeteer is installed at `C:/Users/zamar/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/zamar/.cache/puppeteer/`.
- Always screenshot from localhost: `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool.

**Comparison rounds:**
- Screenshot → compare → fix → re-screenshot. Do at least 2 rounds.
- Stop only when no visible differences remain or user says so.
- Be specific when comparing: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

---

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see Anti-Generic Guardrails below).

---

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

---

## Project Structure
```
app/
├── (auth)/login/              # Single login page for both team + clients
├── dashboard/                 # Internal — team only (auth-protected)
│   ├── projects/
│   ├── tasks/
│   ├── clients/
│   └── invoices/
├── portal/                    # External — clients only (separate auth)
│   ├── tasks/
│   ├── invoices/
│   └── files/
└── api/                       # API route handlers

components/
├── ui/                        # shadcn/ui primitives (do not modify)
├── tasks/
│   ├── TaskCard.tsx           # ← reference pattern for new components
│   ├── TaskBoard.tsx          # Kanban board
│   └── TaskForm.tsx
├── projects/
├── clients/
└── invoices/

lib/
├── supabase.ts                # All DB calls go through here
└── utils.ts

.claude/
└── skills/
    └── frontend-design.md     # ← read this before any UI work
```

---

## Architecture Rules
- `/dashboard/*` routes = **team only** — always check Supabase auth session server-side
- `/portal/*` routes = **client only** — clients see ONLY their own data (filter by `client_id` every time)
- Never expose internal team data (assignees, internal comments, full client list) in portal routes
- All Supabase queries must go through `lib/supabase.ts` — no inline client instantiation
- Use **Server Components** by default; only add `"use client"` when interactivity requires it
- **Every INSERT must include `org_id`** — call `getCallerOrgId()` from `lib/db/team-members.ts` in the server action, never accept it from client input
- **Never allow cross-org queries** — RLS enforces this, but always be explicit in code too
- If a logged-in member has `org_id = null`, redirect to `/setup-org` before allowing dashboard access

---

## Database Tables (Supabase / PostgreSQL)
| Table | Key Fields |
|---|---|
| `organisations` | id, name, slug, plan (free/pro/enterprise), created_at |
| `clients` | id, **org_id**, name, email, status, monthly_rate, portal_password (bcrypt hashed) |
| `projects` | id, **org_id**, client_id, name, status, total_value, deadline |
| `tasks` | id, **org_id**, project_id, title, status, priority, assignee_id, due_date |
| `team_members` | id, **org_id**, name, email, role, user_role, avatar_url |
| `invoices` | id, **org_id**, client_id, invoice_number, amount, status, due_date, pdf_url |
| `project_members` | id, **org_id**, project_id, member_id, assigned_at |
| `comments` | id, task_id, user_id, content |
| `files` | id, task_id, filename, file_url |

Full schema is in `/docs/schema.sql` — always check before adding or modifying tables.

---

## Component Conventions
- Use `components/tasks/TaskCard.tsx` as the reference pattern for all new components
- Every component must have a TypeScript props interface at the top
- Use shadcn/ui primitives from `components/ui/` — check existing ones before installing new libraries
- Tailwind only for styling — no inline styles, no CSS modules
- All forms use controlled inputs with `useState` or `react-hook-form`

---

## Task Status & Priority Values
- **Status:** `todo` | `in_progress` | `done`
- **Priority:** `urgent` | `high` | `normal` | `low`
- **Client status:** `active` | `inactive` | `paused`
- **Invoice status:** `pending` | `paid` | `overdue`

---

## Build Phases
- **Phase 1** — Internal task management (dashboard + kanban + task detail)
- **Phase 2** — Client portal (filtered views, file uploads, invoice viewing)
- **Phase 3** — CRM + invoice generator (PDF, payment tracking, revenue dashboard)

Always complete and test one phase before starting the next.

---

## Coding Preferences
- Prefer `async/await` over `.then()` chains
- Handle all Supabase errors explicitly — never silently swallow errors
- Use TypeScript generics for Supabase query return types
- Prefer named exports for components, default export at bottom
- Keep components under ~150 lines — extract sub-components if growing larger

---

## Frontend Design — Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

---

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
- Don't modify files in `components/ui/` (shadcn managed)
- Don't add new npm packages without checking if shadcn/ui or Supabase already covers it
- Don't query Supabase directly inside React components — use `lib/supabase.ts` helpers
- Don't implement client-side filtering as a substitute for proper RLS (Row Level Security) in Supabase

---

## Supabase RLS

Row Level Security is **enabled on all tables** (`organisations`, `clients`, `comments`, `files`, `invoices`, `projects`, `tasks`, `team_members`, `project_members`).

Policy matrix per table:

| Role | Access |
|---|---|
| `service_role` | Full (SELECT / INSERT / UPDATE / DELETE) — bypasses RLS |
| `authenticated` | Scoped to own org — all policies enforce `org_id = get_org_id()` |
| `anon` | Blocked entirely — no reads or writes |

**Environment variables** (Next.js):
- `NEXT_PUBLIC_SUPABASE_URL` — project URL (safe to expose)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key, read-only by RLS (safe to expose in frontend)
- `SUPABASE_SERVICE_ROLE_KEY` — service role key, **bypasses RLS — never expose in frontend code**

**Rules:**
- Always use `SUPABASE_SERVICE_ROLE_KEY` in server-side code (Server Components, API routes, Server Actions) that needs write access
- Never import `SUPABASE_SERVICE_ROLE_KEY` into any `"use client"` component
- Client portal data isolation is enforced at the query level (filter by `client_id`) — RLS policies are intentionally permissive for `authenticated` role because all authenticated requests go through the server
- Multi-tenant isolation is enforced by `org_id = get_org_id()` in every `authenticated` RLS policy — one org can never read or write another org's data