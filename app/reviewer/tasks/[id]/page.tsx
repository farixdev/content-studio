import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getTaskDetail } from "@/lib/detail";
import { isReviewPhase } from "@/lib/workflow";
import { TaskHeading } from "@/components/task/task-heading";
import { GuideCard } from "@/components/task/guide-card";
import { ContentCard } from "@/components/task/content-card";
import { AiAudit } from "@/components/task/ai-audit";
import { StatusTimeline } from "@/components/task/status-timeline";
import { ReviewSummary } from "@/components/task/review-summary";
import { Comments } from "@/components/task/comments";
import { ReviewerActions } from "@/components/reviewer/reviewer-actions";
import { Card } from "@/components/ui/card";

export default async function ReviewerTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("REVIEWER");
  const task = await getTaskDetail(id);
  if (!task) notFound();

  const inReview = isReviewPhase(task.status);

  return (
    <div>
      <TaskHeading task={task} backHref="/reviewer" backLabel="Back to queue" />
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
          <Comments taskId={task.id} initial={task.comments} />
        </div>
        <div className="space-y-6">
          {inReview ? (
            <ReviewerActions taskId={task.id} />
          ) : (
            <Card className="p-5 text-sm text-muted-foreground">
              This piece isn&apos;t awaiting review right now.
            </Card>
          )}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Review history</h3>
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
