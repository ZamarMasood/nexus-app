"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Receipt, FolderOpen, LogOut } from "lucide-react";

interface PortalSidebarProps {
  clientName: string;
}

const NAV = [
  { href: "/portal/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/portal/invoices", label: "Invoices", icon: Receipt },
  { href: "/portal/files", label: "Files", icon: FolderOpen },
];

export function PortalSidebar({ clientName }: PortalSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Mobile top bar (hidden on lg+) ─────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-[#d4ede9] bg-white px-4 py-3 lg:hidden">
        {/* Brand */}
        <div className="flex shrink-0 items-center gap-2 mr-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-[#00b8a0] to-[#0087a0] shadow-[0_0_12px_rgba(0,184,160,0.4)]">
            <span className="text-xs font-black tracking-tight text-white">N</span>
          </div>
          <span className="text-sm font-bold tracking-[-0.02em] text-[#0d3330]">Nexus</span>
        </div>

        {/* Nav links — horizontal scroll */}
        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                  "transition-[background-color,color]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b8a0]",
                  active
                    ? "bg-[#e6f7f5] text-[#00866b]"
                    : "text-[#5f8a86] hover:bg-[#f0faf8] hover:text-[#0d3330]",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <form action="/portal/logout" method="POST" className="ml-auto shrink-0">
          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[#5f8a86] transition-[background-color,color] hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </form>
      </header>

      {/* ── Desktop sidebar (hidden below lg) ──────────────────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[#d4ede9] bg-white px-4 py-6">
        {/* Brand */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#00b8a0] to-[#0087a0] shadow-[0_0_14px_rgba(0,184,160,0.35)]">
              <span className="text-xs font-black tracking-tight text-white">N</span>
            </div>
            <div>
              <p className="text-[13px] font-bold tracking-[-0.02em] text-[#0d3330]">
                Nexus
              </p>
              <p className="text-[10px] font-medium text-[#7ab5af]">Client Portal</p>
            </div>
          </div>
        </div>

        {/* Client badge */}
        <div className="mb-6 rounded-xl border border-[#d4ede9] bg-[#f0faf8] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7ab5af]">
            Logged in as
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-[#0d3330]">
            {clientName}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  "transition-[background-color,color]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b8a0] focus-visible:ring-offset-2",
                  active
                    ? "bg-[#e6f7f5] text-[#00866b]"
                    : "text-[#5f8a86] hover:bg-[#f0faf8] hover:text-[#0d3330]",
                ].join(" ")}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    active ? "text-[#00b8a0]" : "text-[#7ab5af] group-hover:text-[#00b8a0]"
                  }`}
                />
                {label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00b8a0]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / sign out */}
        <div className="mt-auto border-t border-[#d4ede9] pt-4">
          <form action="/portal/logout" method="POST">
            <button
              type="submit"
              className={[
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                "text-[#5f8a86] transition-[background-color,color]",
                "hover:bg-rose-50 hover:text-rose-600",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400",
                "active:scale-[0.99]",
              ].join(" ")}
            >
              <LogOut className="h-4 w-4 text-[#7ab5af]" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

export default PortalSidebar;
