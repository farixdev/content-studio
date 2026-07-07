import type { Role, Status } from "./constants";

// Statuses where the writer is actively responsible and may edit/submit.
export const WRITER_EDITABLE: Status[] = ["ASSIGNED", "IN_PROGRESS", "IMPROVEMENT"];

// Statuses that sit in the review phase (a reviewer can act on them).
export const REVIEW_PHASE: Status[] = ["WRITTEN", "ISSUE_RESOLVED", "REVIEWED_BY_UMAR"];

// Statuses where a task is considered "closed" for active work.
export const TERMINAL: Status[] = ["SEO_OPTIMIZED", "CANCELLED"];

export function canWriterEdit(status: string): boolean {
  return WRITER_EDITABLE.includes(status as Status);
}

export function isReviewPhase(status: string): boolean {
  return REVIEW_PHASE.includes(status as Status);
}

// Given how many distinct reviewers have signed off, what status results.
export function statusAfterApproval(approvalCount: number): Status {
  if (approvalCount <= 1) return "REVIEWED_BY_UMAR";
  return "REVIEWED_BY_WAQAR";
}

// Whether the two-gate review is fully complete.
export function isFullyReviewed(status: string): boolean {
  return (
    status === "REVIEWED_BY_WAQAR" ||
    status === "DESIGN_NOW" ||
    status === "DESIGNING" ||
    status === "DESIGNED" ||
    status === "POST_NOW" ||
    status === "POSTED" ||
    status === "SEO_OPTIMIZED"
  );
}

// The number of reviewer sign-offs required before design can begin.
export const REQUIRED_APPROVALS = 2;

// Roles allowed to freely override the status (admin superpower).
export function canOverrideStatus(role: Role): boolean {
  return role === "ADMIN";
}
