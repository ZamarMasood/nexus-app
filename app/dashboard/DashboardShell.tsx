"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Receipt,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  UserCog,
} from "lucide-react";
import { TaskFormProvider } from "./task-form-context";
import { signOutAction } from "@/app/(auth)/login/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Nav item paths are relative to the workspace root (no /dashboard prefix) */
const BASE_NAV = [
  { path: "",          label: "Overview",      icon: LayoutDashboard, exact: true  },
  { path: "/projects", label: "Projects",      icon: FolderKanban,    exact: false },
  { path: "/tasks",    label: "Tasks",         icon: CheckSquare,     exact: false },
  { path: "/clients",  label: "Clients",       icon: Users,           exact: false },
  { path: "/invoices", label: "Invoices",      icon: Receipt,         exact: false },
];

const ADMIN_NAV_ITEM = {
  path: "/team-members",
  label: "Team Members",
  icon: UserCog,
  exact: false,
};

const SETTINGS_ITEM = {
  path: "/settings",
  label: "Settings",
  icon: Settings,
  exact: false,
};

interface DashboardShellProps {
  children: React.ReactNode;
  isAdmin: boolean;
  currentMemberId?: string;
  orgName?: string;
  memberName?: string;
  slug: string;
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium",
        "transition-[background-color,color] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
        active
          ? "bg-violet-500/10 text-bright"
          : "text-faint-app hover:bg-surface-subtle hover:text-secondary-app",
      ].join(" ")}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
      )}
      <Icon
        className={`h-4 w-4 shrink-0 transition-colors ${
          active ? "text-violet-500 dark:text-violet-400" : "text-dim-app group-hover:text-muted-app"
        }`}
      />
      {label}
      {active && (
        <ChevronRight className="ml-auto h-3 w-3 text-violet-400/50" />
      )}
    </Link>
  );
}

function BrandMark({ orgName }: { orgName?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
        <span className="text-[12px] font-black text-white tracking-tight">N</span>
      </div>
      <div>
        <span className="block text-[15px] font-semibold tracking-[-0.03em] text-bright leading-none">Nexus</span>
        <span className="block text-[10px] text-dim-app mt-0.5 font-medium tracking-wide uppercase truncate max-w-[120px]">
          {orgName ?? 'Workspace'}
        </span>
      </div>
    </div>
  );
}

function BottomBar({ memberName }: { memberName?: string }) {
  const initials = memberName
    ? memberName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="px-3 pb-3 pt-2.5 border-t border-surface shrink-0">
      {/* Member card */}
      {memberName && (
        <div className="flex items-center gap-2.5 rounded-xl bg-surface-subtle/50 px-3 py-2.5 mb-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 shadow-[0_2px_8px_rgba(139,92,246,0.3)]">
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <span className="block text-[12px] font-semibold text-bright truncate">{memberName}</span>
            <span className="block text-[10px] text-dim-app">Online</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between rounded-lg px-3 py-1.5">
        <span className="text-[12px] font-medium text-faint-app">Theme</span>
        <ThemeToggle />
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-faint-app transition-[background-color,color] duration-150 hover:bg-rose-500/8 hover:text-rose-500 dark:hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 active:scale-[0.98]"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0 text-dim-app transition-colors group-hover:text-rose-500 dark:group-hover:text-rose-400" />
          Sign out
        </button>
      </form>
    </div>
  );
}

export default function DashboardShell({ children, isAdmin, currentMemberId, orgName, memberName, slug }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const base = `/${slug}`;

  const NAV_ITEMS = useMemo(() => {
    const items = isAdmin
      ? [...BASE_NAV, ADMIN_NAV_ITEM, SETTINGS_ITEM]
      : [...BASE_NAV, SETTINGS_ITEM];
    return items.map((item) => ({
      ...item,
      href: `${base}${item.path}`,
    }));
  }, [isAdmin, base]);

  /** Check active state: the browser URL is /{slug}/... */
  function isActive(item: { path: string; exact: boolean }) {
    const fullPath = `${base}${item.path}`;
    if (item.exact) return pathname === fullPath;
    return pathname === fullPath || pathname.startsWith(fullPath + '/');
  }

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [mobileMenuOpen]);

  const toggleMenu = useCallback(() => setMobileMenuOpen((v) => !v), []);

  return (
    <TaskFormProvider currentMemberId={currentMemberId} isAdmin={isAdmin}>
      <div className="flex h-screen overflow-hidden flex-col bg-surface-page lg:flex-row">

        {/* ── Mobile top bar ─────────────────────────────────────────────── */}
        <header className="relative flex shrink-0 items-center justify-between bg-surface-sidebar border-b border-surface px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={toggleMenu}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="flex items-center justify-center rounded-lg p-1.5 text-muted-app transition-[background-color,color] duration-150 hover:bg-surface-subtle hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 active:scale-95"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <BrandMark orgName={orgName} />
          <div className="w-9" />{/* spacer to keep brand centered */}
        </header>

        {/* ── Mobile backdrop ────────────────────────────────────────────── */}
        <div
          className={[
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden",
            "transition-opacity duration-200",
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          ].join(" ")}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* ── Mobile drawer ──────────────────────────────────────────────── */}
        <div
          className={[
            "fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-surface-sidebar border-r border-surface lg:hidden",
            "transition-transform duration-250 ease-out",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-5">
            <BrandMark orgName={orgName} />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="flex items-center justify-center rounded-lg p-1.5 text-muted-app transition-[background-color,color] duration-150 hover:bg-surface-subtle hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-0.5 px-3 flex-1 min-h-0 overflow-y-auto">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-dim-app">Menu</p>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item)} />
            ))}
          </nav>

          <BottomBar memberName={memberName} />
        </div>

        {/* ── Desktop sidebar ────────────────────────────────────────────── */}
        <aside className="hidden lg:flex w-[220px] shrink-0 flex-col bg-surface-sidebar border-r border-surface h-screen sticky top-0">
          <div className="px-5 pt-5 pb-5">
            <BrandMark orgName={orgName} />
          </div>

          <nav className="flex flex-col gap-0.5 px-3 mb-4">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-dim-app">Menu</p>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item)} />
            ))}
          </nav>

          <BottomBar memberName={memberName} />
        </aside>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </TaskFormProvider>
  );
}
