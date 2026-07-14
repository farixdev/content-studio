import { AlertTriangle } from "lucide-react";

/** "Late" tag shown when a piece's due date has rolled over to a new month
 * because the writer missed it. `count` is how many times it rolled. */
export function LateBadge({ count, className = "" }: { count: number; className?: string }) {
  if (!count || count <= 0) return null;
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 " +
        className
      }
      title={`Missed the due date ${count} time${count > 1 ? "s" : ""} — reassigned to a new month`}
    >
      <AlertTriangle className="h-3 w-3" />
      Late{count > 1 ? ` ×${count}` : ""}
    </span>
  );
}
