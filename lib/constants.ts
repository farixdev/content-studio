// Central place for roles, statuses, and content types.
// Everything the workflow keys off lives here so it is easy to tweak.

import { cache } from "react";

export type Role = "ADMIN" | "WRITER" | "REVIEWER" | "DESIGNER" | "DEVELOPER";

export const ROLES: Role[] = ["ADMIN", "WRITER", "REVIEWER", "DESIGNER", "DEVELOPER"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Manager",
  WRITER: "Content Writer",
  REVIEWER: "Reviewer",
  DESIGNER: "Designer",
  DEVELOPER: "Developer",
};

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  WRITER: "/writer",
  REVIEWER: "/reviewer",
  DESIGNER: "/designer",
  DEVELOPER: "/developer",
};

export const MANAGEABLE_ROLES: Role[] = ["WRITER", "REVIEWER", "DESIGNER", "DEVELOPER"];

// ---------------------------------------------------------------------------
// Statuses (the pipeline). Order here defines pipeline / kanban order.
// ---------------------------------------------------------------------------

export type Status =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WRITTEN"
  | "IMPROVEMENT"
  | "ISSUE_RESOLVED"
  | "REVIEWED_BY_UMAR"
  | "REVIEWED_BY_WAQAR"
  | "DESIGN_NOW"
  | "DESIGNING"
  | "DESIGNED"
  | "DESIGN_IMPROVEMENT"
  | "DEV_NOW"
  | "DEVELOPING"
  | "DEVELOPED"
  | "POST_NOW"
  | "POSTED"
  | "SEO_OPTIMIZED"
  | "CANCELLED";

export type Phase = "Writing" | "Review" | "Design" | "Development" | "Publish" | "Closed";

export interface StatusMeta {
  label: string;
  phase: Phase;
  badge: string; // tailwind classes for a pill
  dot: string; // tailwind bg for a status dot
}

export const STATUS_META: Record<Status, StatusMeta> = {
  ASSIGNED: { label: "Assigned", phase: "Writing", badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  IN_PROGRESS: { label: "In Progress", phase: "Writing", badge: "bg-sky-100 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  WRITTEN: { label: "Written", phase: "Review", badge: "bg-blue-100 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  IMPROVEMENT: { label: "Needs Improvement", phase: "Review", badge: "bg-amber-100 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  ISSUE_RESOLVED: { label: "Issue Resolved", phase: "Review", badge: "bg-lime-100 text-lime-800 ring-lime-200", dot: "bg-lime-500" },
  REVIEWED_BY_UMAR: { label: "1st Approval", phase: "Review", badge: "bg-violet-100 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  REVIEWED_BY_WAQAR: { label: "Approved", phase: "Review", badge: "bg-indigo-100 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  DESIGN_NOW: { label: "Design Now", phase: "Design", badge: "bg-purple-100 text-purple-700 ring-purple-200", dot: "bg-purple-500" },
  DESIGNING: { label: "Designing", phase: "Design", badge: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200", dot: "bg-fuchsia-500" },
  DESIGNED: { label: "Designed", phase: "Design", badge: "bg-teal-100 text-teal-700 ring-teal-200", dot: "bg-teal-500" },
  DESIGN_IMPROVEMENT: { label: "Design Changes", phase: "Design", badge: "bg-orange-100 text-orange-700 ring-orange-200", dot: "bg-orange-500" },
  DEV_NOW: { label: "Develop Now", phase: "Development", badge: "bg-sky-100 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  DEVELOPING: { label: "Developing", phase: "Development", badge: "bg-blue-100 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  DEVELOPED: { label: "Developed", phase: "Development", badge: "bg-indigo-100 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  POST_NOW: { label: "Post Now", phase: "Publish", badge: "bg-cyan-100 text-cyan-700 ring-cyan-200", dot: "bg-cyan-500" },
  POSTED: { label: "Posted", phase: "Publish", badge: "bg-green-100 text-green-700 ring-green-200", dot: "bg-green-500" },
  SEO_OPTIMIZED: { label: "SEO Optimized", phase: "Publish", badge: "bg-emerald-100 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  CANCELLED: { label: "Cancelled", phase: "Closed", badge: "bg-rose-100 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
};

export const STATUS_ORDER: Status[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "WRITTEN",
  "IMPROVEMENT",
  "ISSUE_RESOLVED",
  "REVIEWED_BY_UMAR",
  "REVIEWED_BY_WAQAR",
  "DESIGN_NOW",
  "DESIGNING",
  "DESIGN_IMPROVEMENT",
  "DESIGNED",
  "DEV_NOW",
  "DEVELOPING",
  "DEVELOPED",
  "POST_NOW",
  "POSTED",
  "SEO_OPTIMIZED",
  "CANCELLED",
];

export const PHASES: Phase[] = ["Writing", "Review", "Design", "Development", "Publish", "Closed"];

export const PHASE_ACCENT: Record<Phase, string> = {
  Writing: "text-sky-600",
  Review: "text-violet-600",
  Design: "text-fuchsia-600",
  Development: "text-blue-600",
  Publish: "text-emerald-600",
  Closed: "text-rose-600",
};

// Named colour palette the Manager can choose from when editing/adding a status.
export const STATUS_COLORS: Record<string, { badge: string; dot: string }> = {
  slate: { badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  blue: { badge: "bg-blue-100 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  sky: { badge: "bg-sky-100 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  violet: { badge: "bg-violet-100 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  indigo: { badge: "bg-indigo-100 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  fuchsia: { badge: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200", dot: "bg-fuchsia-500" },
  amber: { badge: "bg-amber-100 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  orange: { badge: "bg-orange-100 text-orange-700 ring-orange-200", dot: "bg-orange-500" },
  emerald: { badge: "bg-emerald-100 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  teal: { badge: "bg-teal-100 text-teal-700 ring-teal-200", dot: "bg-teal-500" },
  cyan: { badge: "bg-cyan-100 text-cyan-700 ring-cyan-200", dot: "bg-cyan-500" },
  rose: { badge: "bg-rose-100 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
};
export const STATUS_COLOR_NAMES = Object.keys(STATUS_COLORS);

// Runtime registry of Manager overrides (label + optional colour) keyed by
// status key. Populated on the server per-request (root layout) and hydrated on
// the client via <StatusHydrator> so every badge reflects the Manager's edits.
export interface StatusOverride {
  key: string;
  label: string;
  color: string | null;
}
type OverrideMap = Record<string, { label: string; color: string | null }>;

// The registry must be REQUEST-SCOPED on the server (many requests share one
// Node worker; a module-level global would let concurrent requests clobber each
// other's overrides and cause hydration mismatches). React's cache() gives a
// fresh holder per server request. On the client there's a single session, so a
// module-level map is correct. currentOverrides() picks the right one and is only
// ever invoked in its matching environment.
const serverOverrides = cache((): { map: OverrideMap } => ({ map: {} }));
let clientOverrides: OverrideMap = {};

function currentOverrides(): OverrideMap {
  return typeof window === "undefined" ? serverOverrides().map : clientOverrides;
}

export function applyStatusSettings(list: StatusOverride[]) {
  const map: OverrideMap = Object.fromEntries(
    list.map((s) => [s.key, { label: s.label, color: s.color }])
  );
  if (typeof window === "undefined") serverOverrides().map = map;
  else clientOverrides = map;
}

// Resolve a status's display without touching the override registry — used for
// live previews in Settings as the Manager edits.
export function previewStatus(
  key: string,
  label: string,
  color: string | null
): { label: string; badge: string; dot: string } {
  if (color) {
    const c = STATUS_COLORS[color] ?? STATUS_COLORS.slate;
    return { label, badge: c.badge, dot: c.dot };
  }
  const base = STATUS_META[key as Status];
  if (base) return { label, badge: base.badge, dot: base.dot };
  const c = STATUS_COLORS.slate;
  return { label, badge: c.badge, dot: c.dot };
}

export function statusMeta(status: string): StatusMeta {
  const o = currentOverrides()[status];
  const base = STATUS_META[status as Status];
  if (o) {
    if (o.color) {
      const c = STATUS_COLORS[o.color] ?? STATUS_COLORS.slate;
      return { label: o.label, phase: base?.phase ?? "Writing", badge: c.badge, dot: c.dot };
    }
    if (base) return { ...base, label: o.label };
    const c = STATUS_COLORS.slate;
    return { label: o.label, phase: "Writing", badge: c.badge, dot: c.dot };
  }
  if (base) return base;
  return { label: status, phase: "Writing", badge: STATUS_COLORS.slate.badge, dot: STATUS_COLORS.slate.dot };
}

// A built-in pipeline status (drives the automated role gates).
export function isStatus(value: string): value is Status {
  return value in STATUS_META;
}

// ---------------------------------------------------------------------------
// Content types — placeholders until the real list is provided.
// Swap this array to change the options everywhere.
// ---------------------------------------------------------------------------

export const CONTENT_TYPES: string[] = [
  "Blog Post",
  "Service Page",
  "Landing Page",
  "Product Description",
  "Social Post",
  "Email",
  "Case Study",
  "Press Release",
];
