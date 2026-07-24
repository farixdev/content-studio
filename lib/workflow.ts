import type { Role, Status } from "./constants";

// Statuses where the writer is actively responsible and may edit/submit.
export const WRITER_EDITABLE: Status[] = ["ASSIGNED", "IN_PROGRESS", "IMPROVEMENT"];

// Statuses that sit in the content-review phase (a reviewer can act on them).
export const REVIEW_PHASE: Status[] = ["WRITTEN", "ISSUE_RESOLVED", "REVIEWED_BY_UMAR"];

// Statuses where the designer is actively responsible.
export const DESIGNER_EDITABLE: Status[] = ["DESIGN_NOW", "DESIGNING", "DESIGN_IMPROVEMENT"];

// Design submitted (with a Figma link) and awaiting admin/reviewer approval.
export const DESIGN_REVIEW: Status[] = ["DESIGNED"];

// Statuses where the developer is actively responsible.
export const DEVELOPER_EDITABLE: Status[] = ["DEV_NOW", "DEVELOPING"];

// Statuses considered "closed" for active work.
export const TERMINAL: Status[] = ["SEO_OPTIMIZED", "CANCELLED"];

export function canWriterEdit(status: string): boolean {
  return WRITER_EDITABLE.includes(status as Status);
}

export function isReviewPhase(status: string): boolean {
  return REVIEW_PHASE.includes(status as Status);
}

export function canDesignerEdit(status: string): boolean {
  return DESIGNER_EDITABLE.includes(status as Status);
}

export function isDesignReview(status: string): boolean {
  return DESIGN_REVIEW.includes(status as Status);
}

export function canDeveloperEdit(status: string): boolean {
  return DEVELOPER_EDITABLE.includes(status as Status);
}

// Given how many distinct reviewers have signed off, what status results.
export function statusAfterApproval(approvalCount: number): Status {
  if (approvalCount <= 1) return "REVIEWED_BY_UMAR";
  return "REVIEWED_BY_WAQAR";
}

// Statuses at or past the point where the two-gate content review is complete
// (i.e. design can begin).
const POST_REVIEW: Status[] = [
  "REVIEWED_BY_WAQAR",
  "DESIGN_NOW",
  "DESIGNING",
  "DESIGNED",
  "DESIGN_IMPROVEMENT",
  "DEV_NOW",
  "DEVELOPING",
  "DEVELOPED",
  "POST_NOW",
  "POSTED",
  "SEO_OPTIMIZED",
];

export function isFullyReviewed(status: string): boolean {
  return POST_REVIEW.includes(status as Status);
}

/**
 * Word totals only ever count APPROVED content. A draft sitting in writing or
 * review is not finished work, so it must never inflate anyone's total — use
 * this everywhere a word count is summed.
 */
export function approvedWords(items: { status: string; words?: number | null }[]): number {
  return items.reduce((sum, t) => sum + (isFullyReviewed(t.status) ? t.words || 0 : 0), 0);
}

// The number of reviewer sign-offs required before design can begin.
export const REQUIRED_APPROVALS = 2;

// Roles allowed to freely override the status (admin superpower).
export function canOverrideStatus(role: Role): boolean {
  return role === "ADMIN";
}

// ---------------------------------------------------------------------------
// Per-actor visibility ("chapter close")
// ---------------------------------------------------------------------------
// A worker's view closes at their own stage: once the piece moves downstream they
// see their own endpoint (e.g. "Approved" / "Designed"), not the live status of a
// stage that isn't theirs. Managers and reviewers always see the true status.
const WRITER_DONE: Status[] = [
  "DESIGN_NOW", "DESIGNING", "DESIGNED", "DESIGN_IMPROVEMENT",
  "DEV_NOW", "DEVELOPING", "DEVELOPED", "POST_NOW", "POSTED", "SEO_OPTIMIZED",
];
const DESIGNER_DONE: Status[] = ["DEV_NOW", "DEVELOPING", "DEVELOPED", "POST_NOW", "POSTED", "SEO_OPTIMIZED"];
const DEVELOPER_DONE: Status[] = ["POST_NOW", "POSTED", "SEO_OPTIMIZED"];

export function roleViewStatus(role: string | undefined, status: string): string {
  const s = status as Status;
  if (role === "WRITER" && WRITER_DONE.includes(s)) return "REVIEWED_BY_WAQAR"; // "Approved"
  if (role === "DESIGNER" && DESIGNER_DONE.includes(s)) return "DESIGNED";
  if (role === "DEVELOPER" && DEVELOPER_DONE.includes(s)) return "DEVELOPED";
  return status;
}

// Only managers and reviewers may see who wrote / designed / developed a piece.
export function canSeeAttribution(role: string | undefined): boolean {
  return role === "ADMIN" || role === "REVIEWER";
}
