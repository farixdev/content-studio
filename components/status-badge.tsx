import { statusMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
  withDot = true,
}: {
  status: string;
  className?: string;
  withDot?: boolean;
}) {
  const meta = statusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        meta.badge,
        className
      )}
    >
      {withDot && <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />}
      {meta.label}
    </span>
  );
}
