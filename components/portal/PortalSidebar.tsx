"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  Receipt,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface PortalSidebarProps {
  clientName: string;
}

const NAV = [
  { href: "/portal/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/portal/invoices", label: "Invoices", icon: Receipt },
  { href: "/portal/files", label: "Files", icon: FolderOpen },
];

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

export function PortalSidebar({ clientName }: PortalSidebarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebarContent = (
    <>
      {/* Workspace header */}
      <div className="flex items-center gap-2 px-4 py-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="w-5 h-5 rounded-sm bg-[#5e6ad2] flex items-center justify-center">
          <span className="text-white text-[10px] font-medium">C</span>
        </div>
        <span className="text-[13px] font-medium text-[#f0f0f0] flex-1 truncate">
          Client Portal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto space-y-0.5">
        <SidebarSection label="Portal">
          {NAV.map(({ href, label, icon }) => (
            <NavItem
              key={href}
              href={href}
              icon={icon}
              label={label}
              active={isActive(href)}
            />
          ))}
        </SidebarSection>
      </nav>

      {/* Bottom links */}
      <div className="px-2 py-5 border-t border-[rgba(255,255,255,0.06)] space-y-0.5">
        <NavItem
          href="/portal/settings"
          icon={Settings}
          label="Settings"
          active={pathname.startsWith("/portal/settings")}
        />
        {clientName && (
          <div className="flex items-center gap-2 px-3 py-1.5 mt-1">
            <div className="w-5 h-5 rounded-full bg-[#5e6ad2] flex items-center justify-center">
              <span className="text-white text-[9px] font-medium">
                {clientName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
            <span className="text-[12px] text-[#8a8a8a] truncate flex-1">{clientName}</span>
          </div>
        )}
        <form action="/portal/logout" method="POST">
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
    <>
      {/* Mobile top bar */}
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
        <span className="text-[13px] font-medium text-[#f0f0f0]">Client Portal</span>
        <div className="w-9" />
      </header>

      {/* Mobile backdrop */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden",
          "transition-opacity duration-200",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile drawer */}
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

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[240px] flex-shrink-0 flex-col h-full
        bg-[#111111] border-r border-[rgba(255,255,255,0.06)]">
        {sidebarContent}
      </aside>
    </>
  );
}

export default PortalSidebar;
