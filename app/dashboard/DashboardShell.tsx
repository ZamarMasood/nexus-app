"use client";

import { useState, useCallback, useEffect, useMemo, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Inbox,
  Layers,
  CheckSquare,
  Users,
  FileText,
  Settings,
  UserPlus,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  UserCog,
} from "lucide-react";
import { TaskFormProvider } from "./task-form-context";
import { signOutAction } from "@/app/(auth)/login/actions";
import SearchCommandPalette from "@/components/layout/SearchCommandPalette";

// ── Sidebar collapsed context ─────────────────────────────────────────────
const SidebarCollapsedContext = createContext(false);
export function useSidebarCollapsed() { return useContext(SidebarCollapsedContext); }

interface DashboardShellProps {
  children: React.ReactNode;
  isAdmin: boolean;
  currentMemberId?: string;
  orgName?: string;
  memberName?: string;
  slug: string;
}

/** Nav item paths are relative to the workspace root */
const BASE_NAV = [
  { path: "",          label: "Overview",  icon: Inbox,       exact: true  },
  { path: "/projects", label: "Projects",  icon: Layers,      exact: false },
  { path: "/tasks",    label: "Tasks",     icon: CheckSquare, exact: false },
  { path: "/clients",  label: "Clients",   icon: Users,       exact: false },
  { path: "/invoices", label: "Invoices",  icon: FileText,    exact: false },
];

const ADMIN_NAV_ITEM = {
  path: "/team-members",
  label: "Team Members",
  icon: UserCog,
  exact: false,
};

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      data-active={active}
      className="nav-item group flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md
        text-[13px] font-medium text-[#8a8a8a]
        hover:bg-white/5 hover:text-[#f0f0f0]
        data-[active=true]:bg-white/[0.08] data-[active=true]:text-[#f0f0f0]
        transition-colors duration-150"
    >
      <Icon
        size={15}
        className="flex-shrink-0 text-[#555]
          group-hover:text-[#8a8a8a] group-data-[active=true]:text-[#8a8a8a]"
      />
      {label}
    </Link>
  );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pt-4">
      <div className="px-3 pb-1">
        <span className="text-[11px] font-medium text-[#555] uppercase tracking-[0.06em]">
          {label}
        </span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export default function DashboardShell({ children, isAdmin, currentMemberId, orgName, memberName, slug }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const base = `/${slug}`;

  const NAV_ITEMS = useMemo(() => {
    const items = isAdmin
      ? [...BASE_NAV, ADMIN_NAV_ITEM]
      : [...BASE_NAV];
    return items.map((item) => ({
      ...item,
      href: `${base}${item.path}`,
    }));
  }, [isAdmin, base]);

  function isActive(item: { path: string; exact: boolean }) {
    const fullPath = `${base}${item.path}`;
    if (item.exact) return pathname === fullPath;
    return pathname === fullPath || pathname.startsWith(fullPath + '/');
  }

  const isTasksPage = pathname === `${base}/tasks` || pathname.startsWith(`${base}/tasks/`);

  // Reset sidebar when navigating away from tasks
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    if (!isTasksPage) setSidebarCollapsed(false);
  }, [pathname, isTasksPage]);

  // Ctrl+K / Cmd+K to open search
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const sidebarContent = (
    <>
      {/* Workspace header */}
      <div className="flex items-center gap-2 px-4 py-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="w-5 h-5 rounded-sm bg-[#5e6ad2] flex items-center justify-center">
          <span className="text-white text-[10px] font-medium">
            {orgName ? orgName[0].toUpperCase() : 'N'}
          </span>
        </div>
        <span className="text-[13px] font-medium text-[#f0f0f0] flex-1 truncate">
          {orgName ?? 'Workspace'}
        </span>
        <ChevronDown size={14} className="text-[#555]" />
      </div>

      {/* Search button */}
      <div className="px-2 py-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md
          text-[13px] text-[#8a8a8a] hover:bg-white/5 hover:text-[#f0f0f0]
          transition-colors duration-150">
          <Search size={15} />
          Search...
          <kbd className="ml-auto text-[11px] text-[#555] font-mono">Ctrl+K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto space-y-0.5">
        {/* Top-level nav */}
        <NavItem href={`${base}`} icon={Inbox} label="Overview" active={isActive({ path: "", exact: true })} />

        {/* Workspace section */}
        <SidebarSection label="Workspace">
          {NAV_ITEMS.filter(item => item.path !== "").map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item)}
            />
          ))}
        </SidebarSection>
      </nav>

      {/* Bottom links */}
      <div className="px-2 py-5 border-t border-[rgba(255,255,255,0.06)] space-y-0.5">
        <NavItem href={`${base}/settings`} icon={Settings} label="Settings" active={pathname.startsWith(`${base}/settings`)} />
        {memberName && (
          <div className="flex items-center gap-2 px-3 py-1.5 mt-1">
            <div className="w-5 h-5 rounded-full bg-[#5e6ad2] flex items-center justify-center">
              <span className="text-white text-[9px] font-medium">
                {memberName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <span className="text-[12px] text-[#8a8a8a] truncate flex-1">{memberName}</span>
          </div>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            className="group flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md
              text-[13px] font-medium text-[#8a8a8a]
              hover:bg-white/5 hover:text-[#f0f0f0]
              transition-colors duration-150"
          >
            <LogOut size={15} className="text-[#555] group-hover:text-[#8a8a8a]" />
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <TaskFormProvider currentMemberId={currentMemberId} isAdmin={isAdmin}>
      <SidebarCollapsedContext.Provider value={sidebarCollapsed}>
      <div className="flex h-screen bg-[#0d0d0d] overflow-hidden">

        {/* ── Mobile top bar ─────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between
          bg-[#111111] border-b border-[rgba(255,255,255,0.06)] px-4 h-12 lg:hidden">
          <button
            type="button"
            onClick={toggleMenu}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="p-1.5 rounded-md text-[#555] hover:text-[#8a8a8a] hover:bg-white/5
              transition-colors duration-150"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-[13px] font-medium text-[#f0f0f0]">{orgName ?? 'Nexus'}</span>
          <div className="w-9" />
        </header>

        {/* ── Mobile backdrop ────────────────────────────────────────── */}
        <div
          className={[
            "fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden",
            "transition-opacity duration-200",
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          ].join(" ")}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* ── Mobile drawer ──────────────────────────────────────────── */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col h-full",
            "bg-[#111111] border-r border-[rgba(255,255,255,0.06)] lg:hidden",
            "transition-transform duration-200 ease-out",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          {sidebarContent}
        </aside>

        {/* ── Desktop sidebar ────────────────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-shrink-0 flex-col h-full
            bg-[#111111] border-r border-[rgba(255,255,255,0.06)]
            transition-[width] duration-200 ease-out overflow-hidden relative"
          style={{ width: sidebarCollapsed ? 0 : 240 }}
        >
          <div className="w-[240px] flex flex-col h-full">
            {sidebarContent}
          </div>
        </aside>

        {/* ── Main content ───────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden pt-12 lg:pt-0 relative">
          {/* Sidebar collapse toggle — stuck to left edge of content, tasks page only */}
          {isTasksPage && (
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="group hidden lg:flex items-center justify-center
                absolute left-0 z-20 w-[14px] h-[56px]
                transition-all duration-200 ease-out"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
              <svg
                width="6" height="48" viewBox="0 0 6 48" fill="none"
                className="transition-all duration-200 ease-out"
              >
                <rect
                  x="1" y="2" width="4" height="44" rx="2"
                  className="fill-[rgba(255,255,255,0.18)] group-hover:fill-transparent
                    transition-colors duration-200"
                />
                <path
                  d={sidebarCollapsed
                    ? "M1 4 C1 4, 5 14, 5 24 C5 34, 1 44, 1 44"
                    : "M5 4 C5 4, 1 14, 1 24 C1 34, 5 44, 5 44"
                  }
                  stroke="rgba(255,255,255,0.40)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  className="opacity-0 group-hover:opacity-100
                    transition-opacity duration-200"
                />
              </svg>
            </button>
          )}
          {children}
        </main>


        {/* ── Search command palette ────────────────────────────────── */}
        {searchOpen && (
          <SearchCommandPalette
            slug={slug}
            isAdmin={isAdmin}
            memberId={currentMemberId}
            onClose={() => setSearchOpen(false)}
          />
        )}
      </div>
      </SidebarCollapsedContext.Provider>
    </TaskFormProvider>
  );
}
