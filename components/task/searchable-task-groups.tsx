"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskGroup } from "./task-group";
import type { TaskListItem } from "@/lib/tasks";

/** Renders status-grouped task cards with a search box that filters across all
 * groups by title, ref code, or project. Empty groups hide themselves. */
export function SearchableTaskGroups({
  groups,
  hrefBase,
  placeholder = "Search my content by title, ref or project…",
}: {
  groups: { title: string; tasks: TaskListItem[] }[];
  hrefBase: string;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return groups;
    return groups.map((g) => ({
      ...g,
      tasks: g.tasks.filter((t) =>
        `${t.title} ${t.refCode} ${t.projectName ?? ""}`.toLowerCase().includes(query)
      ),
    }));
  }, [groups, query]);
  const total = filtered.reduce((n, g) => n + g.tasks.length, 0);

  return (
    <div>
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="pl-9" aria-label="Search content" />
      </div>
      {total === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search term." />
      ) : (
        filtered.map((g) => <TaskGroup key={g.title} title={g.title} tasks={g.tasks} hrefBase={hrefBase} />)
      )}
    </div>
  );
}
