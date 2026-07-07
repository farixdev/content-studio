import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getTaskDetail } from "@/lib/detail";
import { TaskHeading } from "@/components/task/task-heading";
import { ContentCard } from "@/components/task/content-card";
import { DesignCard } from "@/components/task/design-card";
import { StatusTimeline } from "@/components/task/status-timeline";
import { Comments } from "@/components/task/comments";
import { DesignerActions } from "@/components/designer/designer-actions";
import { Card } from "@/components/ui/card";

export default async function DesignerTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("DESIGNER");
  const task = await getTaskDetail(id);
  if (!task || task.designer?.id !== user.id) notFound();

  const active = task.status === "DESIGN_NOW" || task.status === "DESIGNING";

  return (
    <div>
      <TaskHeading task={task} backHref="/designer" backLabel="Back to design board" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ContentCard contentText={task.contentText} contentFile={task.contentFile} words={task.words} />
          <DesignCard designInstructions={task.designInstructions} designAsset={task.designAsset} />
          <Comments taskId={task.id} initial={task.comments} />
        </div>
        <div className="space-y-6">
          {active ? (
            <DesignerActions taskId={task.id} status={task.status} />
          ) : (
            <Card className="p-5 text-sm text-muted-foreground">
              This design is delivered — nothing more to do here.
            </Card>
          )}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Timeline</h3>
            <StatusTimeline history={task.history} />
          </Card>
        </div>
      </div>
    </div>
  );
}
