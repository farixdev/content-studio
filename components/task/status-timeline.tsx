import { statusMeta } from "@/lib/constants";
import { cn, timeAgo, formatDate } from "@/lib/utils";
import type { TaskDetail } from "@/lib/detail";

export function StatusTimeline({ history }: { history: TaskDetail["history"] }) {
  const items = [...history].reverse();
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ol className="space-y-4">
      {items.map((h, i) => {
        const meta = statusMeta(h.toStatus);
        return (
          <li key={i} className="relative flex gap-3">
            {i < items.length - 1 && (
              <span className="absolute left-[5px] top-4 h-full w-px bg-border" aria-hidden />
            )}
            <span className={cn("z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white", meta.dot)} />
            <div className="min-w-0 pb-1">
              <p className="text-sm font-medium text-foreground">{meta.label}</p>
              <p className="text-xs text-muted-foreground">
                {h.byName}
                {h.note ? ` · ${h.note}` : ""}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                {formatDate(h.createdAt, "MMM d, yyyy · h:mm a")} · {timeAgo(h.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
