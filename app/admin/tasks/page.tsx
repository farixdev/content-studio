import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { taskWhereForViewer } from "@/lib/projects";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TasksView } from "@/components/admin/tasks-view";
import { toListItem } from "@/lib/tasks";

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const me = await getCurrentUser();
  // Reviewers only see content in the projects they're assigned to.
  const where = me ? await taskWhereForViewer(me) : {};
  const tasks = await prisma.task.findMany({
    where,
    include: { writer: { select: { name: true } }, designer: { select: { name: true } }, project: { select: { name: true } } },
    orderBy: { date: "desc" },
  });
  const items = tasks.map(toListItem);

  return (
    <div>
      <PageHeader title="Content" description="Every piece across the pipeline.">
        <Button asChild>
          <Link href="/admin/tasks/new">
            <Plus className="h-4 w-4" /> Create content
          </Link>
        </Button>
      </PageHeader>
      <TasksView initial={items} initialStatus={sp.status} />
    </div>
  );
}
