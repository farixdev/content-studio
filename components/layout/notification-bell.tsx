"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, MessageSquare, CalendarClock, CheckCircle2, FileText } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { taskHrefForRole, openChatWith, NOTIFICATIONS_EVENT } from "@/lib/notify-link";
import { cn, timeAgo } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  taskId: string | null;
  actorId: string | null;
  read: boolean;
  createdAt: string;
}

export function iconForNotification(type: string) {
  if (type === "CHAT") return MessageSquare;
  if (type === "DEADLINE") return CalendarClock;
  if (type === "REVIEWED" || type === "DESIGN_APPROVED") return CheckCircle2;
  return FileText;
}

/** Where a notification points, if anywhere. */
export function notificationTarget(n: NotificationItem, role: string): { kind: "chat" | "task"; value: string } | null {
  if (n.type === "CHAT" && n.actorId) return { kind: "chat", value: n.actorId };
  if (n.taskId) return { kind: "task", value: taskHrefForRole(role, n.taskId) };
  return null;
}

export function NotificationBell({ initial, role = "ADMIN" }: { initial: NotificationItem[]; role?: string }) {
  const [items, setItems] = useState<NotificationItem[]>(initial);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const unread = items.filter((i) => !i.read).length;

  async function refresh() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications ?? []);
      }
    } catch {
      /* ignore */
    }
  }

  // Live updates: the popup poller broadcasts every fetch, so the bell stays in
  // sync without a second timer. Keep a slow poll as a fallback.
  useEffect(() => {
    const onFeed = (e: Event) => {
      const detail = (e as CustomEvent).detail as NotificationItem[] | undefined;
      if (Array.isArray(detail)) setItems(detail);
    };
    window.addEventListener(NOTIFICATIONS_EVENT, onFeed);
    const tick = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const id = setInterval(tick, 45000);
    window.addEventListener("focus", tick);
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, onFeed);
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markAll() {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    try {
      await fetch("/api/notifications", { method: "PATCH" });
    } catch {
      /* ignore */
    }
  }

  function activate(n: NotificationItem) {
    const target = notificationTarget(n, role);
    if (!target) return;
    setOpen(false);
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
    if (target.kind === "chat") openChatWith(target.value);
    else router.push(target.value);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) refresh();
      }}
    >
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-semibold">Notifications</div>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <div className="thin-scrollbar max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </div>
          ) : (
            items.map((n) => {
              const Icon = iconForNotification(n.type);
              const clickable = !!notificationTarget(n, role);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => activate(n)}
                  disabled={!clickable}
                  className={cn(
                    "flex w-full gap-3 border-b border-border px-4 py-3 text-left last:border-0",
                    !n.read && "bg-primary-50/40",
                    clickable ? "cursor-pointer transition hover:bg-muted/60" : "cursor-default"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      n.read ? "bg-muted text-muted-foreground" : "bg-primary-50 text-primary-700"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-foreground">{n.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {timeAgo(n.createdAt)}
                      {clickable && <span className="ml-1 font-medium text-primary">· Open</span>}
                    </p>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
