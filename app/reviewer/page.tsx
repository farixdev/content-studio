import { ClipboardCheck, Inbox, Palette, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toListItem } from "@/lib/tasks";
import { reviewerProjectIds } from "@/lib/projects";
import { REVIEW_PHASE } from "@/lib/workflow";
import { PageHeader } from "@/components/layout/page-header";
import { TaskGroup } from "@/components/task/task-group";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";

export default async function ReviewerHome() {
  const user = await requireRole("REVIEWER");
  // Reviewers only see work in the projects they're assigned to.
  const ids = await reviewerProjectIds(user.id);
  const [queue, designs, mine] = await Promise.all([
    prisma.task.findMany({
      where: { status: { in: REVIEW_PHASE }, projectId: { in: ids } },
      include: { writer: { select: { name: true } }, designer: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.task.findMany({
      where: { status: "DESIGNED", projectId: { in: ids } },
      include: { writer: { select: { name: true } }, designer: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.task.findMany({
      where: { approvals: { some: { reviewerId: user.id } }, projectId: { in: ids } },
      include: { writer: { select: { name: true } }, designer: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Review queue"
        description="Approve content and designs, send work back, or hand it to a designer/developer."
      />
      {queue.length === 0 && designs.length === 0 && mine.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing to review"
          description="When writers submit content, it will appear here for review."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Awaiting review" value={queue.length} icon={Inbox} tone="primary" />
            <StatCard label="Designs to approve" value={designs.length} icon={Palette} tone="violet" />
            <StatCard label="Reviewed by you" value={mine.length} icon={CheckCircle2} tone="emerald" />
          </div>
          <TaskGroup title="Awaiting review" tasks={queue.map(toListItem)} hrefBase="/reviewer/tasks" />
          {designs.length > 0 && (
            <TaskGroup title="Designs to approve" tasks={designs.map(toListItem)} hrefBase="/admin/tasks" />
          )}
          <TaskGroup title="Recently reviewed by you" tasks={mine.map(toListItem)} hrefBase="/reviewer/tasks" />
        </>
      )}
    </div>
  );
}
