import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getTaskDetail } from "@/lib/detail";
import { TaskHeading } from "@/components/task/task-heading";
import { ContentCard } from "@/components/task/content-card";
import { DesignCard } from "@/components/task/design-card";
import { DevCard } from "@/components/task/dev-card";
import { StatusTimeline } from "@/components/task/status-timeline";
import { Comments } from "@/components/task/comments";
import { DeveloperActions } from "@/components/developer/developer-actions";
import { Card } from "@/components/ui/card";

export default async function DeveloperTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("DEVELOPER");
  const task = await getTaskDetail(id);
  if (!task || task.developer?.id !== user.id) notFound();

  const active = task.status === "DEV_NOW" || task.status === "DEVELOPING";

  return (
    <div>
      <TaskHeading task={task} backHref="/developer" backLabel="Back to dev board" viewerRole="DEVELOPER" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ContentCard contentText={task.contentText} contentLink={task.contentLink} contentFile={task.contentFile} words={task.words} />
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
          <Comments taskId={task.id} initial={task.comments} />
        </div>
        <div className="space-y-6">
          {active ? (
            <DeveloperActions taskId={task.id} status={task.status} devLink={task.devLink} />
          ) : (
            <Card className="p-5 text-sm text-muted-foreground">
              This build is delivered — nothing more to do here.
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
