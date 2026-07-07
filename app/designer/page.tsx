import { Palette } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toListItem } from "@/lib/tasks";
import { PageHeader } from "@/components/layout/page-header";
import { TaskGroup } from "@/components/task/task-group";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DesignerHome() {
  const user = await requireRole("DESIGNER");
  const tasks = await prisma.task.findMany({
    where: { designerId: user.id },
    include: { writer: { select: { name: true } }, designer: { select: { name: true } }, project: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const items = tasks.map(toListItem);
  const pick = (statuses: string[]) => items.filter((i) => statuses.includes(i.status));

  const groups = [
    { title: "Ready to design", tasks: pick(["DESIGN_NOW"]) },
    { title: "In progress", tasks: pick(["DESIGNING"]) },
    { title: "Delivered", tasks: pick(["DESIGNED", "POST_NOW", "POSTED", "SEO_OPTIMIZED"]) },
  ];

  return (
    <div>
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]} 👋`}
        description="Approved content waiting for your design."
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="No design work yet"
          description="When content is approved and handed off, it will show up here."
        />
      ) : (
        groups.map((g) => (
          <TaskGroup key={g.title} title={g.title} tasks={g.tasks} hrefBase="/designer/tasks" />
        ))
      )}
    </div>
  );
}
