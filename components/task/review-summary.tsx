import { CheckCircle2, AlertTriangle } from "lucide-react";
import { FileLink } from "./file-link";
import { timeAgo } from "@/lib/utils";
import type { TaskDetail } from "@/lib/detail";

export function ReviewSummary({
  approvals,
  issues,
}: {
  approvals: TaskDetail["approvals"];
  issues: TaskDetail["issues"];
}) {
  if (approvals.length === 0 && issues.length === 0) {
    return <p className="text-sm text-muted-foreground">No review activity yet.</p>;
  }
  return (
    <div className="space-y-3">
      {approvals.map((a, i) => (
        <div key={`a${i}`} className="flex items-start gap-2.5 rounded-lg bg-emerald-50 p-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-900">Approved by {a.reviewerName}</p>
            {a.note && <p className="text-sm text-emerald-800/80">{a.note}</p>}
            <p className="text-xs text-emerald-700/70">{timeAgo(a.createdAt)}</p>
          </div>
        </div>
      ))}
      {issues.map((it) => (
        <div key={it.id} className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-900">
              Issue from {it.raisedByName}
              {it.resolved && <span className="ml-1 text-xs font-normal text-amber-700/70">· resolved</span>}
            </p>
            <p className="whitespace-pre-wrap text-sm text-amber-800/90">{it.message}</p>
            {it.file && (
              <div className="mt-2">
                <FileLink file={it.file} />
              </div>
            )}
            <p className="mt-0.5 text-xs text-amber-700/70">{timeAgo(it.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
