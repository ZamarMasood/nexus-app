"use client";

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
} from "lucide-react";
import { TaskFormProvider } from "./task-form-context";
import { signOutAction } from "@/app/(auth)/login/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <TaskFormProvider>
      <div className="flex h-screen overflow-hidden flex-col bg-surface-page lg:flex-row">

        {/* ── Mobile top bar ─────────────────────────────────────────────── */}
        <header className="flex shrink-0 items-center gap-2 bg-surface-sidebar border-b border-surface px-4 py-3 lg:hidden">
          {/* Brand */}
          <div className="flex shrink-0 items-center gap-2 mr-3">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 shadow-[0_0_16px_rgba(139,92,246,0.45)]">
              <span className="text-[11px] font-black text-white tracking-tight">N</span>
            </div>
            <span className="text-sm font-semibold tracking-[-0.03em] text-bright">Nexus</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                    "transition-[background-color,color] duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
                    active
                      ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
                      : "text-muted-app hover:bg-surface-subtle hover:text-secondary-app",
                  ].join(" ")}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle + Mobile logout */}
          <div className="flex shrink-0 items-center gap-1 ml-1">
            <ThemeToggle />
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                className="flex items-center justify-center rounded-lg p-1.5 text-faint-app transition-[background-color,color] duration-150 hover:bg-surface-subtle hover:text-muted-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 active:scale-95"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
        <aside className="hidden lg:flex w-[220px] shrink-0 flex-col bg-surface-sidebar border-r border-surface">
          {/* Brand */}
          <div className="px-5 pt-6 pb-7">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                <span className="text-[12px] font-black text-white tracking-tight">N</span>
              </div>
              <div>
                <span className="block text-[15px] font-semibold tracking-[-0.03em] text-bright leading-none">Nexus</span>
                <span className="block text-[10px] text-dim-app mt-0.5 font-medium tracking-wide uppercase">Workspace</span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 px-3 flex-1">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-dim-app">Menu</p>
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium",
                    "transition-[background-color,color] duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
                    active
                      ? "bg-violet-500/10 text-bright"
                      : "text-faint-app hover:bg-surface-subtle hover:text-secondary-app",
                  ].join(" ")}
                >
                  {/* Active left accent */}
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
            })}
          </nav>

          {/* Bottom — theme toggle + sign out */}
          <div className="px-3 pb-5 pt-4 border-t border-surface mt-4 space-y-1">
            {/* Theme toggle row */}
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <span className="text-[13px] font-medium text-faint-app flex-1">Theme</span>
              <ThemeToggle />
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-faint-app transition-[background-color,color] duration-150 hover:bg-rose-500/8 hover:text-rose-500 dark:hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4 shrink-0 text-dim-app transition-colors group-hover:text-rose-500 dark:group-hover:text-rose-400" />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </TaskFormProvider>
  );
}
