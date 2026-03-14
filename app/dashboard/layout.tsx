"use client";

import { useState, useCallback, useEffect } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const toggleMenu = useCallback(() => setMobileMenuOpen((v) => !v), []);

  return (
    <TaskFormProvider>
      <div className="flex h-screen overflow-hidden flex-col bg-surface-page lg:flex-row">

        {/* ── Mobile top bar ─────────────────────────────────────────────── */}
        <header className="relative flex shrink-0 items-center bg-surface-sidebar border-b border-surface px-4 py-3 lg:hidden">
          {/* Left: Hamburger */}
          <button
            type="button"
            onClick={toggleMenu}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="flex items-center justify-center rounded-lg p-1.5 text-muted-app transition-[background-color,color] duration-150 hover:bg-surface-subtle hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 active:scale-95"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

        </header>

        {/* ── Mobile slide-out menu ──────────────────────────────────────── */}
        {/* Backdrop */}
        <div
          className={[
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden",
            "transition-opacity duration-200",
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          ].join(" ")}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={[
            "fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-surface-sidebar border-r border-surface lg:hidden",
            "transition-transform duration-250 ease-out",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-6">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                <span className="text-[12px] font-black text-white tracking-tight">N</span>
              </div>
              <div>
                <span className="block text-[15px] font-semibold tracking-[-0.03em] text-bright leading-none">Nexus</span>
                <span className="block text-[10px] text-dim-app mt-0.5 font-medium tracking-wide uppercase">Workspace</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="flex items-center justify-center rounded-lg p-1.5 text-muted-app transition-[background-color,color] duration-150 hover:bg-surface-subtle hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer nav */}
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

          {/* Drawer bottom */}
          <div className="px-3 pb-5 pt-4 border-t border-surface mt-4 space-y-1">
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
        </div>

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
