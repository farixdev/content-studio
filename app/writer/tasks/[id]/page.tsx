import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getTaskDetail } from "@/lib/detail";
import { canWriterEdit } from "@/lib/workflow";
import { TaskHeading } from "@/components/task/task-heading";
import { GuideCard } from "@/components/task/guide-card";
import { ContentCard } from "@/components/task/content-card";
import { StatusTimeline } from "@/components/task/status-timeline";
import { ReviewSummary } from "@/components/task/review-summary";
import { Comments } from "@/components/task/comments";
import { WriterEditor } from "@/components/writer/writer-editor";
import { Card } from "@/components/ui/card";

export default async function WriterTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("WRITER");
  const task = await getTaskDetail(id);
  if (!task || task.writer?.id !== user.id) notFound();

  const editable = canWriterEdit(task.status);
  const openIssues = task.issues.filter((i) => !i.resolved);

  return (
    <div>
      <TaskHeading task={task} backHref="/writer" backLabel="Back to my work" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <GuideCard guideText={task.guideText} guideFile={task.guideFile} />

          {task.status === "IMPROVEMENT" && openIssues.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/60 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Feedback to address
              </div>
              <ReviewSummary approvals={[]} issues={openIssues} />
            </Card>
          )}

          {editable ? (
            <WriterEditor
              taskId={task.id}
              initialText={task.contentText}
              initialLink={task.contentLink}
              initialFile={task.contentFile}
            />
          ) : (
            <ContentCard
              contentText={task.contentText}
              contentLink={task.contentLink}
              contentFile={task.contentFile}
              words={task.words}
            />
          )}

          <Comments taskId={task.id} initial={task.comments} />
        </div>

        <div className="space-y-6">
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
