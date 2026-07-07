"use client";

import { useState } from "react";
import { ChevronDown, Hash } from "lucide-react";
import { TaskCard } from "@/components/task/task-card";
import { statusMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MonthGroup } from "@/lib/history";

export function MemberHistory({
  months,
  hrefBase,
}: {
  months: MonthGroup[];
  hrefBase: string;
}) {
  // Expand the most recent month that has content by default.
  const firstWithContent = months.find((m) => m.items.length > 0)?.key ?? null;
  const [open, setOpen] = useState<Record<string, boolean>>(
    firstWithContent ? { [firstWithContent]: true } : {}
  );
  const toggle = (key: string) => setOpen((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div>
      {months.map((mo) => {
        const has = mo.items.length > 0;
        const isOpen = !!open[mo.key];
        return (
          <div key={mo.key} className="grid grid-cols-1 gap-x-6 sm:grid-cols-[110px_1fr]">
            {/* Month label */}
            <div className="pb-2 sm:pb-6 sm:pt-4 sm:text-right">
              <div className={cn("text-sm font-semibold", has ? "text-foreground" : "text-muted-foreground")}>
                {mo.label}
              </div>
              <div className="text-xs text-muted-foreground">{mo.year}</div>
            </div>

            {/* Timeline spine + content */}
            <div className="relative border-l-2 border-border pb-6 pl-6">
              <span
                className={cn(
                  "absolute -left-[7px] top-5 h-3 w-3 rounded-full ring-4 ring-white",
                  has ? "bg-primary" : "bg-slate-300"
                )}
              />
              {has ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                  {/* Clickable month summary */}
                  <button
                    onClick={() => toggle(mo.key)}
                    className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-muted/40"
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="font-semibold text-foreground">
                          {mo.items.length} {mo.items.length === 1 ? "piece" : "pieces"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Hash className="h-3.5 w-3.5" />
                          {mo.words.toLocaleString()} words
                        </span>
                      </div>
                      {/* Status distribution bar */}
                      <div className="flex h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted">
                        {mo.statuses.map((s) => (
                          <div
                            key={s.status}
                            className={cn("h-full", statusMeta(s.status).dot)}
                            style={{ width: `${(s.count / mo.items.length) * 100}%` }}
                            title={`${statusMeta(s.status).label}: ${s.count}`}
                          />
                        ))}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="border-t border-border p-4">
                      <div className="mb-4 flex flex-wrap gap-2">
                        {mo.statuses.map((s) => (
                          <span
                            key={s.status}
                            className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
                          >
                            <span className={cn("h-2 w-2 rounded-full", statusMeta(s.status).dot)} />
                            {statusMeta(s.status).label}
                            <span className="rounded-full bg-white px-1.5 text-[11px] text-muted-foreground">
                              {s.count}
                            </span>
                          </span>
                        ))}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {mo.items.map((t) => (
                          <TaskCard key={t.id} task={t} href={`${hrefBase}/${t.id}`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="pt-4 text-sm text-muted-foreground/70">No content this month</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
