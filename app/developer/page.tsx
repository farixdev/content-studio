import { Code2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toListItem } from "@/lib/tasks";
import { PageHeader } from "@/components/layout/page-header";
import { TaskGroup } from "@/components/task/task-group";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DeveloperHome() {
  const user = await requireRole("DEVELOPER");
  const tasks = await prisma.task.findMany({
    where: { developerId: user.id },
    include: {
      writer: { select: { name: true } },
      designer: { select: { name: true } },
      project: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const items = tasks.map(toListItem);
  const pick = (statuses: string[]) => items.filter((i) => statuses.includes(i.status));

  const groups = [
    { title: "Ready to build", tasks: pick(["DEV_NOW"]) },
    { title: "In progress", tasks: pick(["DEVELOPING"]) },
    { title: "Delivered", tasks: pick(["DEVELOPED", "POST_NOW", "POSTED", "SEO_OPTIMIZED"]) },
  ];

  return (
    <div>
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]} 👋`}
        description="Approved designs waiting to be built."
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Code2}
          title="No build work yet"
          description="When a design is approved and handed off, it will show up here."
        />
      ) : (
        groups.map((g) => (
          <TaskGroup key={g.title} title={g.title} tasks={g.tasks} hrefBase="/developer/tasks" />
        ))
      )}
    </div>
  );
}
