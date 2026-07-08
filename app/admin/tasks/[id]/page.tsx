import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTaskDetail } from "@/lib/detail";
import { getCurrentUser } from "@/lib/session";
import { TaskHeading } from "@/components/task/task-heading";
import { GuideCard } from "@/components/task/guide-card";
import { ContentCard } from "@/components/task/content-card";
import { AiAudit } from "@/components/task/ai-audit";
import { DesignCard } from "@/components/task/design-card";
import { DevCard } from "@/components/task/dev-card";
import { StatusTimeline } from "@/components/task/status-timeline";
import { ReviewSummary } from "@/components/task/review-summary";
import { Comments } from "@/components/task/comments";
import { AdminActions } from "@/components/admin/admin-actions";
import { Card } from "@/components/ui/card";

export default async function AdminTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, writers, designers, developers, me] = await Promise.all([
    getTaskDetail(id),
    prisma.user.findMany({
      where: { role: "WRITER", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: "DESIGNER", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: "DEVELOPER", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getCurrentUser(),
  ]);
  if (!task) notFound();

  return (
    <div>
      <TaskHeading task={task} backHref="/admin/tasks" backLabel="Back to content" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <GuideCard guideText={task.guideText} guideFile={task.guideFile} />
          <ContentCard contentText={task.contentText} contentFile={task.contentFile} words={task.words} />
          <AiAudit
            taskId={task.id}
            content={task.contentText}
            guideText={task.guideText}
            contentType={task.contentType}
          />
          <DesignCard
            designInstructions={task.designInstructions}
            designAsset={task.designAsset}
            figmaLink={task.figmaLink}
          />
          <DevCard
            devInstructions={task.devInstructions}
            devLink={task.devLink}
            developerName={task.developer?.name}
          />
          {task.remarks && (
            <Card className="p-5">
              <div className="mb-1 text-sm font-semibold text-foreground">Remarks</div>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">{task.remarks}</p>
            </Card>
          )}
          <Comments taskId={task.id} initial={task.comments} />
        </div>
        <div className="space-y-6">
          <AdminActions
            task={task}
            writers={writers}
            designers={designers}
            developers={developers}
            canDelete={me?.role === "ADMIN"}
          />
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Review</h3>
            <ReviewSummary approvals={task.approvals} issues={task.issues} />
          </Card>
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Timeline</h3>
            <StatusTimeline history={task.history} />
          </Card>
        </div>
      </div>
    </div>
  );
}
