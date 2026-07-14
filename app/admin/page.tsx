import Link from "next/link";
import { FileText, ClipboardCheck, Palette, Rocket, Plus, AlertTriangle, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { statusMeta, PHASES, type Phase } from "@/lib/constants";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { maybeRolloverDeadlines } from "@/lib/deadlines";

const PHASE_BAR: Record<Phase, string> = {
  Writing: "bg-sky-400",
  Review: "bg-violet-400",
  Design: "bg-fuchsia-400",
  Development: "bg-blue-400",
  Publish: "bg-emerald-400",
  Closed: "bg-rose-300",
};

export default async function AdminDashboard() {
  // Roll any overdue writer deadlines to next month (throttled ~12h; a safety net
  // in case the scheduled cron isn't running).
  await maybeRolloverDeadlines();
  const [tasks, activity] = await Promise.all([
    prisma.task.findMany({ include: { writer: { select: { name: true } }, designer: { select: { name: true } }, project: { select: { name: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.statusHistory.findMany({
      include: { by: true, task: true },
      orderBy: { createdAt: "desc" },
      take: 7,
    }),
  ]);

  const phaseCount: Record<Phase, number> = { Writing: 0, Review: 0, Design: 0, Development: 0, Publish: 0, Closed: 0 };
  for (const t of tasks) phaseCount[statusMeta(t.status).phase] += 1;

  const total = tasks.length;
  const inReview = phaseCount.Review;
  const inDesign = phaseCount.Design;
  const published = tasks.filter((t) => t.status === "POSTED" || t.status === "SEO_OPTIMIZED").length;
  const needsAttention = tasks.filter((t) => t.status === "IMPROVEMENT").length;

  const recent = tasks.slice(0, 6);
  const maxPhase = Math.max(1, ...PHASES.map((p) => phaseCount[p]));

  return (
    <div>
      <PageHeader title="Dashboard" description="Everything moving through your content pipeline.">
        <Button asChild>
          <Link href="/admin/tasks/new">
            <Plus className="h-4 w-4" /> Create content
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total content" value={total} icon={FileText} tone="primary" />
        <StatCard label="In review" value={inReview} icon={ClipboardCheck} tone="violet" />
        <StatCard label="In design" value={inDesign} icon={Palette} tone="amber" />
        <StatCard label="Published" value={published} icon={Rocket} tone="emerald" />
      </div>

      {needsAttention > 0 && (
        <Link href="/admin/tasks?status=IMPROVEMENT">
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100/70">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-900">
              {needsAttention} {needsAttention === 1 ? "piece needs" : "pieces need"} improvement — sent back to writers.
            </p>
            <ArrowUpRight className="ml-auto h-4 w-4 text-amber-600" />
          </div>
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent content */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h3 className="text-sm font-semibold text-foreground">Recent content</h3>
            <Link href="/admin/tasks" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recent.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No content yet. Create your first piece.
              </p>
            ) : (
              recent.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/tasks/${t.id}`}
                  className="flex items-center gap-4 p-4 transition hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{t.refCode}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{t.contentType}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium text-foreground">{t.title}</p>
                  </div>
                  {t.writer && <UserAvatar name={t.writer.name} className="hidden h-7 w-7 sm:flex" />}
                  <StatusBadge status={t.status} />
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Pipeline + activity */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Pipeline</h3>
            <div className="space-y-3">
              {PHASES.map((p) => (
                <div key={p}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{p}</span>
                    <span className="text-muted-foreground">{phaseCount[p]}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", PHASE_BAR[p])}
                      style={{ width: `${(phaseCount[p] / maxPhase) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Latest activity</h3>
            <ol className="space-y-3">
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                activity.map((a) => (
                  <li key={a.id} className="flex gap-2.5">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", statusMeta(a.toStatus).dot)} />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        <span className="font-medium">{a.task.title}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {statusMeta(a.toStatus).label} · {a.by.name} · {timeAgo(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
