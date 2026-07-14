import Link from "next/link";
import { ArrowLeft, CalendarDays, CalendarClock, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { LateBadge } from "./late-badge";
import { UserAvatar } from "@/components/user-avatar";
import { formatDate } from "@/lib/utils";
import { roleViewStatus, canSeeAttribution } from "@/lib/workflow";
import type { TaskDetail } from "@/lib/detail";

export function TaskHeading({
  task,
  backHref,
  backLabel = "Back",
  viewerRole,
}: {
  task: TaskDetail;
  backHref: string;
  backLabel?: string;
  viewerRole?: string;
}) {
  const shownStatus = roleViewStatus(viewerRole, task.status);
  const showPeople = canSeeAttribution(viewerRole);
  return (
    <div className="mb-6">
      <Link
        href={backHref}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
              {task.refCode}
            </span>
            <span className="text-xs font-medium text-muted-foreground">{task.contentType}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{task.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatDate(task.date)}
            </span>
            {task.deadline && (
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium " +
                  (new Date(task.deadline).getTime() < Date.now()
                    ? "bg-rose-50 text-rose-700"
                    : "bg-amber-50 text-amber-700")
                }
              >
                {new Date(task.deadline).getTime() < Date.now() ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CalendarClock className="h-4 w-4" />
                )}
                Due {formatDate(task.deadline)}
              </span>
            )}
            <LateBadge count={task.deadlineRollovers} className="px-2 py-0.5 text-xs" />
            {task.deadline &&
              task.submittedAt &&
              new Date(task.submittedAt).getTime() > new Date(task.deadline).getTime() && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700">
                  <AlertTriangle className="h-4 w-4" />
                  Submitted late · {formatDate(task.submittedAt, "MMM d, h:mm a")}
                </span>
              )}
            {showPeople && task.writer && (
              <span className="inline-flex items-center gap-1.5">
                <UserAvatar name={task.writer.name} className="h-5 w-5" />
                {task.writer.name}
              </span>
            )}
            {showPeople && task.designer && (
              <span className="inline-flex items-center gap-1.5">
                <UserAvatar name={task.designer.name} className="h-5 w-5" />
                {task.designer.name}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={shownStatus} className="shrink-0 px-3 py-1 text-sm" />
      </div>
    </div>
  );
}
