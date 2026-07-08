"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps server-rendered data fresh without manual reloads: silently re-fetches
 * the current route every `intervalMs` while the tab is visible, and
 * immediately when the window regains focus. (Serverless-friendly polling —
 * no websockets needed.)
 */
export function LiveRefresh({ intervalMs = 25000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, intervalMs);
    const onFocus = () => router.refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, intervalMs]);

  return null;
}
