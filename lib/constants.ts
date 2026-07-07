// Central place for roles, statuses, and content types.
// Everything the workflow keys off lives here so it is easy to tweak.

export type Role = "ADMIN" | "WRITER" | "REVIEWER" | "DESIGNER";

export const ROLES: Role[] = ["ADMIN", "WRITER", "REVIEWER", "DESIGNER"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin / Manager",
  WRITER: "Content Writer",
  REVIEWER: "Reviewer",
  DESIGNER: "Designer",
};

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  WRITER: "/writer",
  REVIEWER: "/reviewer",
  DESIGNER: "/designer",
};

export const MANAGEABLE_ROLES: Role[] = ["WRITER", "REVIEWER", "DESIGNER"];

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
  | "POST_NOW"
  | "POSTED"
  | "SEO_OPTIMIZED"
  | "CANCELLED";

export type Phase = "Writing" | "Review" | "Design" | "Publish" | "Closed";

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
  REVIEWED_BY_UMAR: { label: "Reviewed by Umar", phase: "Review", badge: "bg-violet-100 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  REVIEWED_BY_WAQAR: { label: "Reviewed by Waqar", phase: "Review", badge: "bg-indigo-100 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  DESIGN_NOW: { label: "Design Now", phase: "Design", badge: "bg-purple-100 text-purple-700 ring-purple-200", dot: "bg-purple-500" },
  DESIGNING: { label: "Designing", phase: "Design", badge: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200", dot: "bg-fuchsia-500" },
  DESIGNED: { label: "Designed", phase: "Design", badge: "bg-teal-100 text-teal-700 ring-teal-200", dot: "bg-teal-500" },
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
  "DESIGNED",
  "POST_NOW",
  "POSTED",
  "SEO_OPTIMIZED",
  "CANCELLED",
];

export const PHASES: Phase[] = ["Writing", "Review", "Design", "Publish", "Closed"];

export const PHASE_ACCENT: Record<Phase, string> = {
  Writing: "text-sky-600",
  Review: "text-violet-600",
  Design: "text-fuchsia-600",
  Publish: "text-emerald-600",
  Closed: "text-rose-600",
};

export function statusMeta(status: string): StatusMeta {
  return STATUS_META[status as Status] ?? { label: status, phase: "Writing", badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" };
}

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
