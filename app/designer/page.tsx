import { Palette, Inbox, Loader, Rocket } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toListItem } from "@/lib/tasks";
import { PageHeader } from "@/components/layout/page-header";
import { TaskGroup } from "@/components/task/task-group";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";

export default async function DesignerHome() {
  const user = await requireRole("DESIGNER");
  const tasks = await prisma.task.findMany({
    where: { designerId: user.id },
    include: {
      writer: { select: { name: true } },
      designer: { select: { name: true } },
      project: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const items = tasks.map(toListItem);
  const pick = (statuses: string[]) => items.filter((i) => statuses.includes(i.status));

  const delivered = ["DESIGNED", "DEV_NOW", "DEVELOPING", "DEVELOPED", "POST_NOW", "POSTED", "SEO_OPTIMIZED"];
  const groups = [
    { title: "Changes requested", tasks: pick(["DESIGN_IMPROVEMENT"]) },
    { title: "Ready to design", tasks: pick(["DESIGN_NOW"]) },
    { title: "In progress", tasks: pick(["DESIGNING"]) },
    { title: "Submitted & beyond", tasks: pick(delivered) },
  ];

  return (
    <div>
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]} 👋`}
        description="Approved content waiting for your design — submit a Figma link when it's ready for approval."
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="No design work yet"
          description="When content is approved and handed to you, it shows up here."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Ready to design" value={pick(["DESIGN_NOW"]).length} icon={Inbox} tone="primary" />
            <StatCard label="Changes requested" value={pick(["DESIGN_IMPROVEMENT"]).length} icon={Loader} tone="amber" />
            <StatCard label="Designing" value={pick(["DESIGNING"]).length} icon={Palette} tone="violet" />
            <StatCard label="Delivered" value={pick(delivered).length} icon={Rocket} tone="emerald" />
          </div>
          {groups
            .filter((g) => g.tasks.length > 0)
            .map((g) => (
              <TaskGroup key={g.title} title={g.title} tasks={g.tasks} hrefBase="/designer/tasks" />
            ))}
        </>
      )}
    </div>
  );
}
