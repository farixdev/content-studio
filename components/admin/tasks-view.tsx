"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid, Table2, ExternalLink, ArrowUpRight } from "lucide-react";
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
import { TaskKanban } from "./task-kanban";
import { STATUS_ORDER, statusMeta } from "@/lib/constants";
import type { TaskListItem } from "@/lib/tasks";
import { cn, formatDate, truncate } from "@/lib/utils";
import { toast } from "sonner";

export function TasksView({
  initial,
  initialStatus,
  hideProject,
}: {
  initial: TaskListItem[];
  initialStatus?: string;
  hideProject?: boolean;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initial);
  const [view, setView] = useState<"table" | "board">("table");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus ?? "ALL");
  const [type, setType] = useState("ALL");
  const [writer, setWriter] = useState("ALL");
  const [project, setProject] = useState("ALL");

  const types = useMemo(
    () => Array.from(new Set(initial.map((t) => t.contentType))).sort(),
    [initial]
  );
  const writers = useMemo(
    () => Array.from(new Set(initial.map((t) => t.writerName).filter(Boolean))).sort() as string[],
    [initial]
  );
  const projects = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of initial) if (t.projectId && t.projectName) map.set(t.projectId, t.projectName);
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [initial]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (status !== "ALL" && t.status !== status) return false;
      if (project !== "ALL" && t.projectId !== project) return false;
      if (type !== "ALL" && t.contentType !== type) return false;
      if (writer !== "ALL") {
        if (writer === "__UNASSIGNED__" ? t.writerName : t.writerName !== writer) return false;
      }
      if (q && !(`${t.title} ${t.refCode}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [tasks, search, status, type, writer, project]);

  async function onMove(id: string, newStatus: string) {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    try {
      const res = await fetch(`/api/tasks/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Moved to ${statusMeta(newStatus).label}`);
    } catch {
      setTasks(prev);
      toast.error("Could not update status.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or ref…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusMeta(s).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!hideProject && (
            <Select value={project} onValueChange={setProject}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={writer} onValueChange={setWriter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Writer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All writers</SelectItem>
              <SelectItem value="__UNASSIGNED__">Unassigned</SelectItem>
              {writers.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-lg border border-border bg-white p-0.5">
            <button
              onClick={() => setView("table")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition",
                view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
              aria-label="Table view"
            >
              <Table2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("board")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition",
                view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
              aria-label="Board view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No content matches"
          description="Try changing your filters or search."
        />
      ) : view === "board" ? (
        <TaskKanban tasks={filtered} onMove={onMove} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto thin-scrollbar">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Date</th>
                  {!hideProject && <th className="px-4 py-3">Project</th>}
                  <th className="px-4 py-3">Content</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Writer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Words</th>
                  <th className="px-4 py-3">Link</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/admin/tasks/${t.id}`)}
                    className="cursor-pointer transition hover:bg-muted/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(t.date, "MMM d")}
                    </td>
                    {!hideProject && (
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {t.projectName ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">{t.refCode}</span>
                      </div>
                      <div className="max-w-[280px] truncate font-medium text-foreground">{t.title}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{t.contentType}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground">
                      {t.writerName ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {t.words > 0 ? t.words.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {t.websiteLink ? (
                        <a
                          href={t.websiteLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Visit
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-muted-foreground">
                      {t.remarks ? truncate(t.remarks, 60) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
