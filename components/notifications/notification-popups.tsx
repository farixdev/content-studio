"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  iconForNotification,
  notificationTarget,
  type NotificationItem,
} from "@/components/layout/notification-bell";
import { NOTIFICATIONS_EVENT, openChatWith } from "@/lib/notify-link";
import { cn, timeAgo } from "@/lib/utils";

const AUTO_DISMISS_MS = 7000;
const POLL_MS = 8000;
const MAX_ON_SCREEN = 4;

/**
 * Live toast stack that pops in the top-right (just under the header) whenever a
 * new notification arrives. Each toast is clickable and jumps straight to its
 * cause — a chat notification opens that conversation, a task notification opens
 * the piece of content. Also broadcasts every fetch so the bell stays live.
 */
export function NotificationPopups({ role, seenIds }: { role: string; seenIds: string[] }) {
  const [popups, setPopups] = useState<NotificationItem[]>([]);
  const seen = useRef<Set<string>>(new Set(seenIds));
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const router = useRouter();

  const dismiss = useCallback((id: string) => {
    setPopups((p) => p.filter((n) => n.id !== id));
    const t = timers.current[id];
    if (t) {
      clearTimeout(t);
      delete timers.current[id];
    }
  }, []);

  useEffect(() => {
    let live = true;
    const timerMap = timers.current;

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok || !live) return;
        const data = await res.json();
        const items: NotificationItem[] = data.notifications ?? [];
        // Keep the bell in sync from this same request.
        window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, { detail: items }));

        const fresh = items.filter((n) => !seen.current.has(n.id) && !n.read);
        items.forEach((n) => seen.current.add(n.id));
        if (!fresh.length || !live) return;

        const show = fresh.slice(0, 3);
        setPopups((p) => [...show, ...p].slice(0, MAX_ON_SCREEN));
        for (const n of show) {
          timerMap[n.id] = setTimeout(() => dismiss(n.id), AUTO_DISMISS_MS);
        }
      } catch {
        /* ignore */
      }
    }

    const id = setInterval(poll, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      live = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
      Object.values(timerMap).forEach(clearTimeout);
    };
  }, [dismiss]);

  function activate(n: NotificationItem) {
    const target = notificationTarget(n, role);
    dismiss(n.id);
    if (!target) return;
    if (target.kind === "chat") openChatWith(target.value);
    else router.push(target.value);
  }

  return (
    <div className="pointer-events-none fixed right-4 top-[72px] z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      <AnimatePresence initial={false}>
        {popups.map((n) => {
          const Icon = iconForNotification(n.type);
          const clickable = !!notificationTarget(n, role);
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, x: 56, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 56, scale: 0.95, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-auto overflow-hidden rounded-xl border border-border bg-white shadow-elevated"
            >
              <div className="flex items-start gap-3 p-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  <Icon className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  onClick={() => activate(n)}
                  disabled={!clickable}
                  className={cn("min-w-0 flex-1 text-left", clickable && "cursor-pointer")}
                >
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                    {n.message}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {timeAgo(n.createdAt)}
                    {clickable && <span className="ml-1 font-semibold text-primary">· Open</span>}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => dismiss(n.id)}
                  aria-label="Dismiss notification"
                  className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* auto-dismiss countdown */}
              <motion.div
                className="h-0.5 bg-primary/60"
                initial={{ width: "100%" }}
                animate={{ width: 0 }}
                transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
