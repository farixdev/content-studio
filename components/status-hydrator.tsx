"use client";

import { applyStatusSettings, type StatusOverride } from "@/lib/constants";

/**
 * Applies the Manager's status overrides (label + colour) to the client-side
 * registry so every <StatusBadge> / statusMeta() call reflects them. Rendered
 * high in the tree (in AppShell, before page content) so the registry is
 * populated before any badge renders. Applying during render is idempotent for
 * this global singleton and keeps SSR and client output in sync.
 */
export function StatusHydrator({ settings }: { settings: StatusOverride[] }) {
  applyStatusSettings(settings);
  return null;
}
