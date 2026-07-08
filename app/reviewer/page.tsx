import { ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toListItem } from "@/lib/tasks";
import { REVIEW_PHASE } from "@/lib/workflow";
import { PageHeader } from "@/components/layout/page-header";
import { TaskGroup } from "@/components/task/task-group";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ReviewerHome() {
  const user = await requireRole("REVIEWER");
  const [queue, designs, mine] = await Promise.all([
    prisma.task.findMany({
      where: { status: { in: REVIEW_PHASE } },
      include: { writer: { select: { name: true } }, designer: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.task.findMany({
      where: { status: "DESIGNED" },
      include: { writer: { select: { name: true } }, designer: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.task.findMany({
      where: { approvals: { some: { reviewerId: user.id } } },
      include: { writer: { select: { name: true } }, designer: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Review queue"
        description="Content waiting for your sign-off, or send-back."
      />
      {queue.length === 0 && designs.length === 0 && mine.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing to review"
          description="When writers submit content, it will appear here for review."
        />
      ) : (
        <>
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
