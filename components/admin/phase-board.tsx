"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ExternalLink, Palette, Code2, CalendarClock, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { statusMeta } from "@/lib/constants";
import type { TaskListItem } from "@/lib/tasks";
import { formatDate, externalHref } from "@/lib/utils";

/** Small due-date pill that turns rose when a deadline has passed (for tasks
 * still in flight). */
function Deadline({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-muted-foreground">—</span>;
  const due = new Date(iso);
  const overdue = due.getTime() < Date.now();
  return (
    <span
      className={
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium " +
        (overdue ? "bg-rose-50 text-rose-700" : "bg-muted text-muted-foreground")
      }
    >
      {overdue ? <AlertTriangle className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
      {formatDate(iso, "MMM d")}
    </span>
  );
}

export function PhaseBoard({
  initial,
  kind,
  statuses,
}: {
  initial: TaskListItem[];
  kind: "design" | "dev";
  statuses: string[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [person, setPerson] = useState("ALL");
  useEffect(() => setItems(initial), [initial]);

  const isDesign = kind === "design";
  const personLabel = isDesign ? "Designer" : "Developer";
  const personOf = (t: TaskListItem) => (isDesign ? t.designerName : t.developerName);

  const people = useMemo(() => {
    const names = new Set<string>();
    for (const t of initial) {
      const n = isDesign ? t.designerName : t.developerName;
      if (n) names.add(n);
    }
    return [...names].sort();
  }, [initial, isDesign]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((t) => {
      if (status !== "ALL" && t.status !== status) return false;
      if (person !== "ALL") {
        const n = personOf(t);
        if (person === "__UNASSIGNED__" ? n : n !== person) return false;
      }
      if (q && !`${t.title} ${t.refCode}`.toLowerCase().includes(q)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, status, person, isDesign]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or ref…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All stages</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {statusMeta(s).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={person} onValueChange={setPerson}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder={personLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All {personLabel.toLowerCase()}s</SelectItem>
            <SelectItem value="__UNASSIGNED__">Unassigned</SelectItem>
            {people.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={isDesign ? Palette : Code2}
          title={isDesign ? "Nothing in design" : "Nothing in development"}
          description={
            isDesign
              ? "Approved content assigned to a designer shows up here."
              : "Approved designs handed to a developer show up here."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Content</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">{personLabel}</th>
                  <th className="px-4 py-3">{isDesign ? "Figma" : "Built page"}</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => {
                  const person = isDesign ? t.designerName : t.developerName;
                  const link = isDesign ? t.figmaLink : t.devLink;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/admin/tasks/${t.id}`)}
                      className="cursor-pointer transition hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] text-muted-foreground">{t.refCode}</div>
                        <div className="max-w-[260px] truncate font-medium text-foreground">{t.title}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {t.projectName ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {person ?? (
                          <span className="text-amber-600">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {link ? (
                          <a
                            href={externalHref(link)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Deadline iso={t.deadline} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
