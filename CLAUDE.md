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

## UI Design System — Linear-Style Dark Theme

This project uses a **Linear-inspired dark UI**. All frontend work MUST follow
these exact design tokens. Do NOT deviate from them or use any default Tailwind
color names as primary values.

---

### Color Tokens

#### Backgrounds
| Token | Hex | Usage |
|---|---|---|
| `--bg-page` | `#0d0d0d` | Main page background |
| `--bg-card` | `#161616` | Task cards, modals, panels |
| `--bg-input` | `#1a1a1a` | Dropdowns, inputs, elevated surfaces |
| `--bg-sidebar` | `#111111` | Sidebar surface |

```css
--bg-page:    #0d0d0d;
--bg-card:    #161616;
--bg-input:   #1a1a1a;
--bg-sidebar: #111111;
```

#### Borders
| Token | Value | Usage |
|---|---|---|
| `--border-subtle` | `rgba(255,255,255,0.06)` | Column dividers, card borders at rest |
| `--border-default` | `rgba(255,255,255,0.07)` | Card border |
| `--border-hover` | `rgba(255,255,255,0.13)` | Card border on hover |

```css
--border-subtle:  rgba(255,255,255,0.06);
--border-default: rgba(255,255,255,0.07);
--border-hover:   rgba(255,255,255,0.13);
```

#### Text
| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#e8e8e8` | Active tab text |
| `--text-card-title` | `#d4d4d4` | Task title on cards |
| `--text-muted` | `#999999` | Column labels |
| `--text-tertiary` | `#666666` | Inactive tabs, status icons |
| `--text-dim` | `#444444` | Add buttons, empty state descriptions |
| `--text-disabled` | `#333333` | Comment count, copy icons |

```css
--text-primary:    #e8e8e8;
--text-card-title: #d4d4d4;
--text-muted:      #999999;
--text-tertiary:   #666666;
--text-dim:        #444444;
--text-disabled:   #333333;
```

#### Status / Priority
| Token | Hex | Usage |
|---|---|---|
| `--priority-urgent` | `#e5484d` | Red priority dot |
| `--priority-high` | `#e79d13` | Orange/yellow priority dot |
| `--priority-normal` | `#5e6ad2` | Accent priority dot |
| `--priority-low` | `#666666` | Dim priority dot |
| `--status-todo` | `#666666` | Todo status icon |
| `--status-in-progress` | `#5e6ad2` | In-progress status icon |
| `--status-done` | `#26c97f` | Done status icon |

```css
--priority-urgent:    #e5484d;
--priority-high:      #e79d13;
--priority-normal:    #5e6ad2;
--priority-low:       #666666;
--status-todo:        #666666;
--status-in-progress: #5e6ad2;
--status-done:        #26c97f;
```

#### Count Badge
| Token | Value | Usage |
|---|---|---|
| `--badge-bg` | `rgba(229,72,77,0.15)` | Red count pill background |
| `--badge-text` | `#e5484d` | Count pill text |

```css
--badge-bg:   rgba(229,72,77,0.15);
--badge-text: #e5484d;
```

#### Accent
| Token | Hex | Usage |
|---|---|---|
| `--accent` | `#5e6ad2` | Buttons, links, active states |
| `--accent-hover` | `#6872e5` | Button hover |
| `--accent-muted` | `rgba(94,106,210,0.15)` | Badge/pill backgrounds |
| `--accent-ring` | `rgba(94,106,210,0.35)` | Focus rings |

```css
--accent:       #5e6ad2;
--accent-hover: #6872e5;
--accent-muted: rgba(94,106,210,0.15);
--accent-ring:  rgba(94,106,210,0.35);
```

#### Scrollbar
| Token | Value | Usage |
|---|---|---|
| `--scrollbar-thumb` | `rgba(255,255,255,0.10)` | Scrollbar thumb |
| `--scrollbar-thumb-hover` | `rgba(255,255,255,0.18)` | Scrollbar thumb on hover |

```css
--scrollbar-thumb:       rgba(255,255,255,0.10);
--scrollbar-thumb-hover: rgba(255,255,255,0.18);
```

---

### Full `globals.css` Token Block

Paste this into `:root` in `globals.css` — replacing any existing color variables:

```css
:root {
  /* Backgrounds */
  --bg-page:    #0d0d0d;
  --bg-card:    #161616;
  --bg-input:   #1a1a1a;
  --bg-sidebar: #111111;

  /* Borders */
  --border-subtle:  rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.07);
  --border-hover:   rgba(255,255,255,0.13);

  /* Text */
  --text-primary:    #e8e8e8;
  --text-card-title: #d4d4d4;
  --text-muted:      #999999;
  --text-tertiary:   #666666;
  --text-dim:        #444444;
  --text-disabled:   #333333;

  /* Status & Priority */
  --priority-urgent:    #e5484d;
  --priority-high:      #e79d13;
  --priority-normal:    #5e6ad2;
  --priority-low:       #666666;
  --status-todo:        #666666;
  --status-in-progress: #5e6ad2;
  --status-done:        #26c97f;

  /* Count badge */
  --badge-bg:   rgba(229,72,77,0.15);
  --badge-text: #e5484d;

  /* Accent */
  --accent:       #5e6ad2;
  --accent-hover: #6872e5;
  --accent-muted: rgba(94,106,210,0.15);
  --accent-ring:  rgba(94,106,210,0.35);

  /* Scrollbar */
  --scrollbar-thumb:       rgba(255,255,255,0.10);
  --scrollbar-thumb-hover: rgba(255,255,255,0.18);

  /* Shadows */
  --shadow-sm:    0 1px 2px rgba(0,0,0,0.4);
  --shadow-md:    0 4px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3);
  --shadow-lg:    0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4);
  --shadow-modal: 0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5);
}

body {
  background-color: var(--bg-page);
  color: var(--text-primary);
  font-family: 'Geist', 'Inter', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
```

---

### Tailwind Config Extension

Add to `tailwind.config.ts` so tokens are available as Tailwind classes:

```ts
theme: {
  extend: {
    colors: {
      'bg-page':    '#0d0d0d',
      'bg-card':    '#161616',
      'bg-input':   '#1a1a1a',
      'bg-sidebar': '#111111',
      'accent':     '#5e6ad2',
      'accent-h':   '#6872e5',
      'p-urgent':   '#e5484d',
      'p-high':     '#e79d13',
      's-done':     '#26c97f',
    },
    fontFamily: {
      sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
    },
  },
},
```

---

### Typography Rules
- **Font:** `'Geist', 'Inter', system-ui, sans-serif` — install via `next/font/google`
- **Headings:** `font-weight: 500`, `letter-spacing: -0.02em`, color `var(--text-primary)`
- **Body:** `font-weight: 400`, `line-height: 1.6`, color `var(--text-muted)`
- **Card titles:** color `var(--text-card-title)`, `font-weight: 500`
- **Labels/column headers:** `font-size: 12px`, `font-weight: 500`, color `var(--text-muted)`
- **NEVER** use `font-weight: 600` or `700` — maximum is `500`

### Spacing System
Use only: `4 8 12 16 20 24 32 40 48px`. No arbitrary values like `px-[13px]`.

### Border Radius
- `4px` — badges, status pills, priority dots
- `6px` — buttons, inputs, small cards
- `8px` — modals, panels, dropdowns, task cards
- `12px` — large cards only

### Shadows (use ONLY these)
```
--shadow-sm:    0 1px 2px rgba(0,0,0,0.4)
--shadow-md:    0 4px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)
--shadow-lg:    0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)
--shadow-modal: 0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)
```

### Animation Rules
- **ONLY** animate `transform` and `opacity` — NEVER `transition-all`
- Hover states: `150ms ease`
- Modals / dropdowns open: `200ms cubic-bezier(0.16, 1, 0.3, 1)`
- Page transitions: `300ms ease-out`
- Card hover border: `transition: border-color 150ms ease`
- Sidebar items: stagger `opacity 0→1` + `translateX(-6px→0)`, 30ms delay per item
- Modals: `scale(0.97)→scale(1)` + `opacity 0→1`
- Toasts: `translateY(8px→0)` + `opacity 0→1`

---

### Component Patterns

**Sidebar nav item:**
```tsx
<button className="group flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md
  text-[13px] font-medium text-[#666]
  hover:bg-white/5 hover:text-[#e8e8e8]
  data-[active=true]:bg-white/[0.08] data-[active=true]:text-[#e8e8e8]
  transition-colors duration-150">
  <Icon size={15} className="text-[#444] group-hover:text-[#666]
    group-data-[active=true]:text-[#999]" />
  {label}
</button>
```

**Primary button:**
```tsx
<button className="inline-flex items-center gap-1.5 px-3 py-1.5
  bg-[#5e6ad2] hover:bg-[#6872e5] active:scale-[0.98]
  text-white text-[13px] font-medium rounded-md
  transition-colors duration-150
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-[rgba(94,106,210,0.35)]">
```

**Input / dropdown field:**
```tsx
<input className="w-full px-3 py-2 rounded-md
  bg-[#1a1a1a] border border-[rgba(255,255,255,0.07)]
  text-[#e8e8e8] text-[13px] placeholder:text-[#444]
  focus:outline-none focus:border-[rgba(255,255,255,0.13)]
  focus:ring-1 focus:ring-[rgba(94,106,210,0.35)]
  transition-colors duration-150" />
```

**Task card:**
```tsx
<div className="group bg-[#161616] border border-[rgba(255,255,255,0.07)]
  hover:border-[rgba(255,255,255,0.13)] rounded-lg p-3
  cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.4)]
  transition-[border-color] duration-150">
  <p className="text-[13px] font-medium text-[#d4d4d4] leading-[1.5]">{title}</p>
  <div className="flex items-center gap-2 mt-2">
    <PriorityDot priority={priority} />
    <StatusIcon status={status} />
    <span className="ml-auto text-[11px] text-[#333] flex items-center gap-1">
      <MessageSquare size={11} />
      {commentCount}
    </span>
  </div>
</div>
```

**Count badge (urgent tasks pill):**
```tsx
<span className="inline-flex items-center px-1.5 py-0.5 rounded-sm
  text-[11px] font-medium
  bg-[rgba(229,72,77,0.15)] text-[#e5484d]">
  {count}
</span>
```

**Status/priority badge:**
```tsx
const priorityColors = {
  urgent: '#e5484d',
  high:   '#e79d13',
  normal: '#5e6ad2',
  low:    '#666666',
}
// Render as a small filled circle dot, 8px diameter
<span className="w-2 h-2 rounded-full flex-shrink-0"
  style={{ background: priorityColors[priority] }} />
```

**Modal:**
```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]
  flex items-center justify-center z-50">
  <div className="bg-[#161616] border border-[rgba(255,255,255,0.07)] rounded-lg
    w-full max-w-[560px] shadow-[0_24px_64px_rgba(0,0,0,0.7)]
    animate-in fade-in zoom-in-[0.97] duration-200">
```

**Dropdown menu content (shadcn override):**
```tsx
<DropdownMenuContent className="
  bg-[#1a1a1a] border border-[rgba(255,255,255,0.07)] rounded-lg
  shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-1 min-w-[180px]">
```

**Table row:**
```tsx
<div className="group flex items-center gap-3 px-4 py-2.5
  border-b border-[rgba(255,255,255,0.06)]
  hover:bg-[#1a1a1a] cursor-pointer
  transition-colors duration-[120ms]">
  <span className="flex-1 text-[13px] text-[#d4d4d4]">{name}</span>
  <span className="text-[12px] text-[#666]">{meta}</span>
</div>
```

**Column header (kanban):**
```tsx
<div className="flex items-center gap-2 px-1 pb-2">
  <span className="text-[12px] font-medium text-[#999] uppercase tracking-[0.05em]">
    {columnName}
  </span>
  <CountBadge count={count} />  {/* only if count > 0 and urgent/overdue */}
</div>
```

**Toast notification:**
```tsx
<div className="fixed bottom-6 right-6 z-[100]
  flex items-center gap-3 px-4 py-3
  bg-[#1a1a1a] border border-[rgba(255,255,255,0.07)] rounded-lg
  shadow-[0_8px_32px_rgba(0,0,0,0.6)]
  animate-in slide-in-from-bottom-2 fade-in duration-300">
  <div className="w-5 h-5 rounded-full bg-[rgba(38,201,127,0.15)]
    flex items-center justify-center">
    <Check size={12} className="text-[#26c97f]" />
  </div>
  <p className="text-[13px] font-medium text-[#e8e8e8]">{message}</p>
</div>
```

### Auth Page Pattern (Login / Signup / Forgot Password / Setup Org)
```tsx
<div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
  <div className="w-full max-w-[400px]">
    {/* Logo/wordmark */}
    <div className="flex justify-center mb-8">
      <span className="text-[18px] font-medium text-[#e8e8e8] tracking-[-0.02em]">
        {/* Use brand_assets/ logo if available */}
        Consolices
      </span>
    </div>
    {/* Card */}
    <div className="bg-[#161616] border border-[rgba(255,255,255,0.07)]
      rounded-lg p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      <h1 className="text-[18px] font-medium text-[#e8e8e8]
        tracking-[-0.02em] mb-1">{heading}</h1>
      <p className="text-[13px] text-[#666] mb-6">{subheading}</p>
      {/* Inputs */}
      <div className="space-y-3">
        <label className="block text-[11px] font-medium text-[#666]
          uppercase tracking-[0.06em] mb-1.5">Email</label>
        <input className="w-full px-3 py-2 rounded-md
          bg-[#1a1a1a] border border-[rgba(255,255,255,0.07)]
          text-[#e8e8e8] text-[13px] placeholder:text-[#444]
          focus:outline-none focus:border-[rgba(255,255,255,0.13)]
          focus:ring-1 focus:ring-[rgba(94,106,210,0.35)]
          transition-colors duration-150" />
      </div>
      {/* Error */}
      {error && <p className="mt-3 text-[13px] text-[#e5484d]">{error}</p>}
      {/* Primary button */}
      <button className="mt-6 w-full py-2 rounded-md
        text-[13px] font-medium text-white
        bg-[#5e6ad2] hover:bg-[#6872e5] active:scale-[0.99]
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[rgba(94,106,210,0.35)]
        disabled:opacity-50 disabled:cursor-not-allowed">
        Continue
      </button>
      {/* Links */}
      <div className="mt-4 text-center">
        <Link href="/login" className="text-[13px] text-[#666]
          hover:text-[#e8e8e8] transition-colors duration-150">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  </div>
</div>
```

### Page Layout Structure
```
┌────────────────────────────────────────────────────────┐
│  sidebar 240px fixed      │  main content              │
│  bg: #111111              │  bg: #0d0d0d               │
│  border-r: rgba(255,      │                            │
│    255,255,0.06)          │  [page header 56px tall]   │
│                           │  [tab bar 40px — if any]   │
│  [workspace name]         │  [content area]            │
│  [search]                 │                            │
│  [nav groups]             │                            │
│  [spacer flex-1]          │                            │
│  [bottom links]           │                            │
└────────────────────────────────────────────────────────┘
```

### Icon Library
- **Lucide React only** (`lucide-react`) — no emoji as icons
- Nav/inline: `15px`; button icons: `16px`; section header: `18px`
- Color always inherits from parent text color class — never hardcode icon colors

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
- `is_owner()` is a SQL function: `SELECT EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_owner = true)`

**Signup flow** (`/signup`):
1. Validate inputs server-side
2. Check slug uniqueness in `organisations`
3. Check email uniqueness in `team_members`
4. Create `organisations` row → get `orgId`
5. Create Supabase Auth user with `email_confirm: true`
6. Create `team_members` row with `id = auth_user.id`, `org_id = orgId`, `user_role = 'admin'`
7. Auto sign in → redirect to `/{slug}` (workspace slug URL)
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
   - If success → look up org slug → redirect to `/{slug}`
3. If Supabase Auth fails, query the `clients` table:
   `WHERE email = ? AND portal_password = ?`
   - If match found → create a client session, redirect to `/portal/tasks`
4. If both fail → show "Invalid email or password" error

**Middleware rules (`middleware.ts`):**
- `/{slug}/*` routes → authenticate team session, rewrite internally to `/dashboard/*`
- `/dashboard/*` routes → authenticate team session, redirect to `/{slug}/*` (backwards compat)
- `/portal/*` routes → require portal session, redirect to `/login` if missing
- A client session must NEVER access workspace routes
- A team session must NEVER access `/portal/*` routes
- Known static routes (`/login`, `/signup`, `/setup-org`, `/api`, `/auth`) pass through without auth

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

## URL Routing — Workspace Slugs

URLs use the workspace slug instead of `/dashboard`:
- `/{slug}` → overview (e.g. `/lums`, `/my-company`)
- `/{slug}/projects` → projects list
- `/{slug}/projects/[id]` → project detail
- `/{slug}/tasks`, `/{slug}/clients`, `/{slug}/invoices`, `/{slug}/settings`, etc.

**How it works (middleware rewrite):**
- Files live in `app/dashboard/` — no file moves needed
- Middleware rewrites `/{slug}/*` → `/dashboard/*` internally (browser URL stays `/{slug}/*`)
- Middleware redirects `/dashboard/*` → `/{slug}/*` for backwards compat
- `WorkspaceSlugProvider` context in `app/dashboard/workspace-context.tsx` provides the slug to all client components
- Use `useWorkspaceSlug()` hook in any client component that needs to build workspace URLs
- `getOrgSlugById(orgId)` in `lib/db/team-members.ts` resolves slug server-side

**Key rules:**
- All internal navigation links must use `/${slug}/...` — never hardcode `/dashboard/...`
- `revalidatePath('/dashboard', 'layout')` still uses `/dashboard` (it's the file-system path)
- `@/app/dashboard/...` import paths are unchanged (file-system paths, not URLs)

---

## Project Structure
```
app/
├── (auth)/login/              # Single login page for both team + clients
├── dashboard/                 # Internal — team only (auth-protected)
│   ├── layout.tsx             # Fetches slug, provides WorkspaceSlugProvider
│   ├── DashboardShell.tsx     # Sidebar + nav (uses slug for links)
│   ├── workspace-context.tsx  # WorkspaceSlugProvider + useWorkspaceSlug()
│   ├── projects/
│   ├── tasks/
│   ├── clients/
│   ├── invoices/
│   ├── team-members/
│   └── settings/              # Profile, security, and delete workspace
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
├── db/team-members.ts         # getCallerOrgId(), getOrgSlugById(), etc.
└── utils.ts

.claude/
└── skills/
    └── frontend-design.md     # ← read this before any UI work
```

---

## Architecture Rules
- `/{slug}/*` routes = **team only** — middleware authenticates and rewrites to `/dashboard/*`
- `/portal/*` routes = **client only** — clients see ONLY their own data (filter by `client_id` every time)
- Never expose internal team data (assignees, internal comments, full client list) in portal routes
- All Supabase queries must go through `lib/supabase.ts` — no inline client instantiation
- Use **Server Components** by default; only add `"use client"` when interactivity requires it
- **Every INSERT must include `org_id`** — call `getCallerOrgId()` from `lib/db/team-members.ts` in the server action, never accept it from client input
- **Never allow cross-org queries** — RLS enforces this, but always be explicit in code too
- If a logged-in member has `org_id = null`, redirect to `/setup-org` before allowing dashboard access
- All client-side navigation links must use `useWorkspaceSlug()` to build `/${slug}/...` URLs

---

## Database Tables (Supabase / PostgreSQL)
| Table | Key Fields |
|---|---|
| `organisations` | id, name, slug, plan (free/pro/enterprise), created_at |
| `clients` | id, **org_id**, name, email, status, monthly_rate, portal_password (bcrypt hashed) |
| `projects` | id, **org_id**, client_id, name, status, total_value, deadline |
| `tasks` | id, **org_id**, project_id, title, status, priority, assignee_id, due_date |
| `team_members` | id, **org_id**, name, email, role, user_role, avatar_url, is_owner |
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
- **Colors:** Use ONLY the tokens defined in the UI Design System above. NEVER use Tailwind color names (indigo-500, blue-600, gray-800, etc.) as primary values.
- **Shadows:** Use only the shadow tokens defined above. Never Tailwind's default `shadow-md` etc.
- **Typography:** Use Geist font. Max font-weight is 500. Tight tracking on headings, generous line-height on body.
- **Gradients:** None on backgrounds — this is a flat dark UI. No mesh gradients.
- **Animations:** Only animate `transform` and `opacity`. NEVER `transition-all`.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Depth:** Backgrounds layer strictly as `#0d0d0d` → `#111111` → `#161616` → `#1a1a1a`. Never break this order.
- **Borders:** Always `rgba(255,255,255,N)` values — never solid gray borders.

---

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- NEVER use `transition-all`
- NEVER use default Tailwind color names as primary — use the token system above
- Don't modify files in `components/ui/` (shadcn managed)
- Don't add new npm packages without checking if shadcn/ui or Supabase already covers it
- Don't query Supabase directly inside React components — use `lib/supabase.ts` helpers
- Don't implement client-side filtering as a substitute for proper RLS in Supabase
- **UI-ONLY TASKS: touch ONLY `.tsx` / `.css` files. NEVER touch `lib/`, `app/api/`, or `middleware.ts`**
- **NEVER change backend logic, Supabase queries, auth flow, or middleware when doing UI work**

---

## Supabase RLS

Row Level Security is **enabled on all tables** (`organisations`, `clients`, `comments`, `files`, `invoices`, `projects`, `tasks`, `team_members`, `project_members`).

| Role | Access |
|---|---|
| `service_role` | Full (SELECT / INSERT / UPDATE / DELETE) — bypasses RLS |
| `authenticated` | Scoped to own org — all policies enforce `org_id = get_org_id()` |
| `anon` | Blocked entirely — no reads or writes |

**Environment variables** (Next.js):
- `NEXT_PUBLIC_SUPABASE_URL` — project URL (safe to expose)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key, read-only by RLS (safe to expose in frontend)
- `SUPABASE_SERVICE_ROLE_KEY` — service role key, **bypasses RLS — NEVER expose in frontend code**

**Rules:**
- Always use `SUPABASE_SERVICE_ROLE_KEY` in server-side code (Server Components, API routes, Server Actions) that needs write access
- Never import `SUPABASE_SERVICE_ROLE_KEY` into any `"use client"` component
- Client portal data isolation is enforced at the query level (filter by `client_id`)
- Multi-tenant isolation enforced by `org_id = get_org_id()` in every `authenticated` RLS policy

---

## Delete Workspace

Only the workspace **owner** (`is_owner = true`) can delete the workspace from Settings → Danger Zone.

**Flow:**
1. Owner clicks "Delete Workspace" → modal appears (like GitHub repo delete)
2. Owner types workspace name to confirm
3. Server action (`deleteWorkspaceAction`) validates owner + name match
4. Deletes all data in FK-safe order: comments → files → nullify assignees → project_members → tasks → invoices → projects → clients → team_members → organisation
5. Deletes all Supabase Auth users (so they can re-signup with same email)
6. Redirects to `/login`

**RLS policies:**
- `owner_delete_own_org` — only owner can DELETE on `organisations`
- `owner_update_own_org` — only owner can UPDATE on `organisations`
- Both enforce `is_owner() AND id = get_org_id()`

**Key rules:**
- Server action uses `supabaseAdmin` (service role) for the cascade deletion
- Owner's auth user is deleted last — allows re-signup with same email
- Non-owner admins/members cannot see or trigger the delete button

---

## Email System

### Current Status
Email templates are built and ready.
Supabase auth emails (confirmation, password reset, invites) go through Brevo SMTP configured in Supabase Dashboard.
Welcome email is sent after signup via `app/api/send-email` route using Brevo HTTP API.
In development: emails are logged to console, not sent.
In production: emails are sent via Brevo (requires `BREVO_API_KEY` env var).

### Templates
All templates in `lib/email-templates.ts` (plain HTML, no JSX):
- `getSignupConfirmEmail()` — for Supabase dashboard Confirm Signup + Magic Link templates
- `getPasswordResetEmail()` — for Supabase dashboard Reset Password template
- `getWelcomeEmail({ memberName, companyName })` — sent after signup
- `getTeamInviteEmail({ memberName, companyName, inviterName, inviteLink })` — sent with invites

### Sending Emails
- `lib/email.ts`: `sendEmail()` utility (calls `/api/send-email`)
- `app/api/send-email/route.ts`: sends via Brevo HTTP API in production, logs in dev

### Preview Templates
```bash
npm run preview:emails
```
Opens HTML files in `.email-previews/` folder

### Manual Setup Required
See `docs/supabase-email-setup.md` for:
- Brevo SMTP configuration in Supabase Dashboard
- How to paste link-based templates into Supabase Dashboard
- Sender verification in Brevo
- Environment variable setup in Vercel

### Key Rules
- Email failures NEVER block user actions (always try/catch)
- Never log tokens or passwords
- `{{ .ConfirmationURL }}` in Supabase templates is replaced by Supabase automatically
- `NEXT_PUBLIC_SITE_URL` must be set for CTA button links