"use client";

import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCard } from "@/components/task/task-card";
import type { TaskListItem } from "@/lib/tasks";

const TABS: { key: string; label: string; statuses?: string[] }[] = [
  { key: "ALL", label: "All" },
  { key: "TODO", label: "To write", statuses: ["ASSIGNED", "IN_PROGRESS"] },
  { key: "FIX", label: "Needs fixes", statuses: ["IMPROVEMENT"] },
  {
    key: "REVIEW",
    label: "In review",
    statuses: ["WRITTEN", "ISSUE_RESOLVED", "REVIEWED_BY_UMAR", "REVIEWED_BY_WAQAR"],
  },
  {
    key: "DESIGN",
    label: "Design & publish",
    statuses: ["DESIGN_NOW", "DESIGNING", "DESIGNED", "POST_NOW", "POSTED", "SEO_OPTIMIZED"],
  },
  { key: "CANCELLED", label: "Cancelled", statuses: ["CANCELLED"] },
];

export function WriterProjectWork({ items }: { items: TaskListItem[] }) {
  const [tab, setTab] = useState("ALL");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of TABS) {
      map.set(
        t.key,
        t.statuses ? items.filter((i) => t.statuses!.includes(i.status)).length : items.length
      );
    }
    return map;
  }, [items]);

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const visible = active.statuses
    ? items.filter((i) => active.statuses!.includes(i.status))
    : items;

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
              <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
                {counts.get(t.key) ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-card">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Inbox className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">Nothing here right now.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <TaskCard key={t.id} task={t} href={`/writer/tasks/${t.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
