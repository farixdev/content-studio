import { Code2, Inbox, Loader, Rocket } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toListItem } from "@/lib/tasks";
import { PageHeader } from "@/components/layout/page-header";
import { SearchableTaskGroups } from "@/components/task/searchable-task-groups";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";

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

  const delivered = ["DEVELOPED", "POST_NOW", "POSTED", "SEO_OPTIMIZED"];
  const groups = [
    { title: "Ready to build", tasks: pick(["DEV_NOW"]) },
    { title: "Building", tasks: pick(["DEVELOPING"]) },
    { title: "Delivered", tasks: pick(delivered) },
  ];

  return (
    <div>
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]} 👋`}
        description="Approved designs to build — open one for the content, the Figma link, and your instructions."
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Code2}
          title="No build work yet"
          description="When a design is approved and handed to you, it shows up here."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Ready to build" value={pick(["DEV_NOW"]).length} icon={Inbox} tone="primary" />
            <StatCard label="Building" value={pick(["DEVELOPING"]).length} icon={Loader} tone="violet" />
            <StatCard label="Delivered" value={pick(delivered).length} icon={Rocket} tone="emerald" />
          </div>
          <SearchableTaskGroups groups={groups} hrefBase="/developer/tasks" />
        </>
      )}
    </div>
  );
}
