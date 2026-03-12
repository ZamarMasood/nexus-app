"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Receipt,
} from "lucide-react";
import { TaskFormProvider } from "./task-form-context";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <TaskFormProvider>
      <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">

        {/* ── Mobile top bar (hidden on lg+) ─────────────────────────────── */}
        <header className="flex shrink-0 items-center gap-3 bg-[#0e0f14] px-4 py-3 lg:hidden">
          {/* Brand mark */}
          <div className="flex shrink-0 items-center gap-2 mr-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]">
              <span className="text-[10px] font-black text-white">N</span>
            </div>
            <span className="text-sm font-bold tracking-[-0.02em] text-white">Nexus</span>
          </div>

          {/* Nav links — horizontal scroll */}
          <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                    "transition-[background-color,color]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                    active
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                  ].join(" ")}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* ── Desktop sidebar (hidden below lg) ──────────────────────────── */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#0e0f14] px-3 py-5">
          {/* Brand */}
          <div className="mb-8 px-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]">
                <span className="text-[11px] font-black text-white tracking-tight">N</span>
              </div>
              <span className="text-base font-bold tracking-[-0.02em] text-white">Nexus</span>
            </div>
            <p className="mt-1 pl-[36px] text-[11px] text-slate-500">Team workspace</p>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                    "transition-[background-color,color]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                    active
                      ? "bg-violet-500/15 text-violet-300"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                  ].join(" ")}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  {label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="mt-auto border-t border-white/5 px-3 pt-4">
            <p className="text-[11px] text-slate-600">Phase 1 · Internal</p>
            <p className="mt-1 text-[10px] text-slate-700">Press C to add a task</p>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </TaskFormProvider>
  );
}
