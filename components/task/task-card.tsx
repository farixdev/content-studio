import Link from "next/link";
import { Hash, FolderKanban } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { timeAgo } from "@/lib/utils";
import type { TaskListItem } from "@/lib/tasks";

export function TaskCard({ task, href }: { task: TaskListItem; href: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-border bg-card p-4 shadow-card transition hover:border-primary-100 hover:shadow-elevated"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">{task.refCode}</span>
        <StatusBadge status={task.status} />
      </div>
      <p className="mt-2 line-clamp-2 font-medium text-foreground transition group-hover:text-primary-700">
        {task.title}
      </p>
      {task.guidePreview && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.guidePreview}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {task.projectName && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 font-medium text-primary-700">
            <FolderKanban className="h-3 w-3" />
            {task.projectName}
          </span>
        )}
        <span>{task.contentType}</span>
        {task.words > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <Hash className="h-3 w-3" />
            {task.words}
          </span>
        )}
        <span className="ml-auto">{timeAgo(task.updatedAt)}</span>
      </div>
    </Link>
  );
}
