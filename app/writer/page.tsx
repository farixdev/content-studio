import { PenLine } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toListItem } from "@/lib/tasks";
import { PageHeader } from "@/components/layout/page-header";
import { TaskGroup } from "@/components/task/task-group";
import { EmptyState } from "@/components/ui/empty-state";

export default async function WriterHome() {
  const user = await requireRole("WRITER");
  const tasks = await prisma.task.findMany({
    where: { writerId: user.id },
    include: { writer: { select: { name: true } }, designer: { select: { name: true } }, project: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const items = tasks.map(toListItem);
  const pick = (statuses: string[]) => items.filter((i) => statuses.includes(i.status));

  const groups = [
    { title: "Needs improvement", tasks: pick(["IMPROVEMENT"]) },
    { title: "To write", tasks: pick(["ASSIGNED", "IN_PROGRESS"]) },
    {
      title: "In review",
      tasks: pick(["WRITTEN", "ISSUE_RESOLVED", "REVIEWED_BY_UMAR", "REVIEWED_BY_WAQAR"]),
    },
    {
      title: "In design & published",
      tasks: pick(["DESIGN_NOW", "DESIGNING", "DESIGNED", "POST_NOW", "POSTED", "SEO_OPTIMIZED"]),
    },
    { title: "Cancelled", tasks: pick(["CANCELLED"]) },
  ];

  return (
    <div>
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]} 👋`}
        description="Here's everything assigned to you."
      />
      {items.length === 0 ? (
        <EmptyState
          icon={PenLine}
          title="No assignments yet"
          description="When your manager assigns you content, it will show up here."
        />
      ) : (
        groups.map((g) => (
          <TaskGroup key={g.title} title={g.title} tasks={g.tasks} hrefBase="/writer/tasks" />
        ))
      )}
    </div>
  );
}
