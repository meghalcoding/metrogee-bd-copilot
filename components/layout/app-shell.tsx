"use client";

import {
  BarChart3,
  Building2,
  CheckSquare,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Radar,
  Command,
  KanbanSquare,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ScanSearch,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const primaryNavigation: NavItem[] = [
  { label: "Command Center", href: "/", icon: LayoutDashboard },
  { label: "Action Center", href: "/actions", icon: Zap },
  { label: "Business Radar", href: "/radar", icon: Radar },
  { label: "Prospecting", href: "/prospecting", icon: ScanSearch },
  { label: "Businesses", href: "/businesses", icon: Building2 },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Meetings", href: "/meetings", icon: CalendarDays },
];

const secondaryNavigation: NavItem[] = [
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

const utilityNavigation: NavItem[] = [
  { label: "Integrations", href: "/integrations", icon: Command },
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavigationItem({ item, collapsed }: { item: NavItem; collapsed?: boolean }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  return (
    <a
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`group flex min-h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary-soft text-primary"
          : "text-text-secondary hover:bg-surface-muted hover:text-foreground"
      } ${collapsed ? "justify-center px-2" : ""}`}
    >
      <Icon className="size-[17px] shrink-0" strokeWidth={1.8} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </a>
  );
}

function Sidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: () => void }) {
  return (
    <aside
      className={`hidden shrink-0 border-r border-border bg-surface transition-[width] duration-200 lg:flex lg:flex-col ${
        collapsed ? "w-[60px]" : "w-[232px]"
      }`}
    >
      {/* Logo */}
      <div className={`flex h-14 items-center border-b border-border ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-white shadow-sm">
            <ScanSearch className="size-3.5" strokeWidth={2.2} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight text-foreground">BD Copilot</div>
              <div className="text-[10px] text-text-muted">Sales workspace</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-0.5">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              Workspace
            </div>
          )}
          {primaryNavigation.map((item) => (
            <NavigationItem key={item.label} item={item} collapsed={collapsed} />
          ))}
        </div>

        <div className="my-4 border-t border-border" />

        <div className="space-y-0.5">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              Insights
            </div>
          )}
          {secondaryNavigation.map((item) => (
            <NavigationItem key={item.label} item={item} collapsed={collapsed} />
          ))}
        </div>

        <div className="my-4 border-t border-border" />

        <div className="space-y-0.5">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              System
            </div>
          )}
          {utilityNavigation.map((item) => (
            <NavigationItem key={item.label} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={onCollapse}
          className={`flex min-h-9 w-full items-center gap-2 rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground ${
            collapsed ? "justify-center" : "px-3"
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <>
              <ChevronLeft className="size-4" />
              <span className="text-xs font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={onClose} aria-label="Close navigation" />
      <aside className="relative flex h-full w-[268px] flex-col border-r border-border bg-surface shadow-xl">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-lg bg-primary text-white">
              <ScanSearch className="size-3.5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-foreground">BD Copilot</div>
              <div className="text-[10px] text-text-muted">Sales workspace</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-text-muted hover:bg-surface-muted hover:text-foreground"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          {primaryNavigation.map((item) => <NavigationItem key={item.label} item={item} />)}
          <div className="my-4 border-t border-border" />
          {secondaryNavigation.map((item) => <NavigationItem key={item.label} item={item} />)}
          <div className="my-4 border-t border-border" />
          {utilityNavigation.map((item) => <NavigationItem key={item.label} item={item} />)}
        </nav>
      </aside>
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-sm sm:px-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-md p-2 text-text-secondary hover:bg-surface-muted hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>
        <button
          type="button"
          className="hidden h-9 min-w-[220px] items-center gap-2 rounded-md border border-border bg-surface-muted/60 px-3 text-left text-sm text-text-muted transition-colors hover:border-border-strong hover:bg-surface md:flex"
          aria-label="Open global search"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-sm">Search...</span>
          <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          className="grid size-9 place-items-center rounded-md text-text-secondary hover:bg-surface-muted hover:text-foreground md:hidden"
          aria-label="Open search"
        >
          <Search className="size-[18px]" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <a
          href="https://docs.anthropic.com"
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-md px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-foreground sm:block"
        >
          Help
        </a>
        <div className="mx-1 hidden h-4 w-px bg-border sm:block" />
        <button
          type="button"
          className="flex items-center gap-2 rounded-md p-1.5 pr-2.5 transition-colors hover:bg-surface-muted"
          aria-label="Open account menu"
        >
          <span className="grid size-7 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
            BD
          </span>
          <span className="hidden text-sm font-medium text-foreground md:block">Account</span>
          <ChevronRight className="hidden size-3 rotate-90 text-text-muted md:block" />
        </button>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed((v) => !v)} />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
