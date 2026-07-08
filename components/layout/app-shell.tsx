"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, ChevronsUpDown } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { UserAvatar } from "@/components/user-avatar";
import { LiveRefresh } from "@/components/live-refresh";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { StatusHydrator } from "@/components/status-hydrator";
import { NotificationBell, type NotificationItem } from "./notification-bell";
import { navForRole, isNavActive } from "./nav";
import { ROLE_LABELS, type Role, type StatusOverride } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ShellUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export function AppShell({
  user,
  notifications,
  statusSettings = [],
  children,
}: {
  user: ShellUser;
  notifications: NotificationItem[];
  statusSettings?: StatusOverride[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = navForRole(user.role);
  const active = nav.find((n) => isNavActive(pathname, n.href, user.role));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        {nav.map((item) => {
          const isActive = isNavActive(pathname, item.href, user.role);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px]",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4">
        <div className="rounded-xl border border-border bg-gradient-to-br from-primary-50 to-white p-4">
          <p className="text-xs font-bold tracking-wide text-primary-700">GROW WITH US</p>
          <p className="mt-1 text-xs text-muted-foreground">Mindcob Content Studio · v1.0</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <StatusHydrator settings={statusSettings} />
      <LiveRefresh />
      <ChatBubble me={{ id: user.id, name: user.name, role: user.role }} />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-white lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-white animate-slide-in">
            <button
              className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white/80 px-4 backdrop-blur sm:px-6">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">{active?.label ?? "Overview"}</h2>
          </div>
          <NotificationBell initial={notifications} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition hover:bg-muted">
                <UserAvatar name={user.name} className="h-8 w-8" />
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-medium leading-tight text-foreground">{user.name}</div>
                  <div className="text-[11px] leading-tight text-muted-foreground">
                    {ROLE_LABELS[user.role]}
                  </div>
                </div>
                <ChevronsUpDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
              <div className="px-2.5 pb-2">
                <div className="text-sm font-medium text-foreground">{user.name}</div>
                <div className="text-xs text-muted-foreground">
                  @{user.username} · {ROLE_LABELS[user.role]}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => logout()}>
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
