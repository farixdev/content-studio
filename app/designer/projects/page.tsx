import { FolderKanban } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchableProjectGrid } from "@/components/admin/searchable-project-grid";

export default async function DesignerProjectsPage() {
  const user = await requireRole("DESIGNER");

  const taskProjects = await prisma.task.findMany({
    where: { designerId: user.id, projectId: { not: null } },
    select: { projectId: true },
    distinct: ["projectId"],
  });
  const ids = [...new Set(taskProjects.map((t) => t.projectId!))];

  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({ where: { id: { in: ids } }, orderBy: { name: "asc" } }),
    prisma.task.findMany({
      where: { designerId: user.id, projectId: { in: ids } },
      select: { projectId: true, status: true },
    }),
  ]);

  const grid = projects.map((p) => {
    const mine = tasks.filter((t) => t.projectId === p.id);
    return {
      id: p.id,
      name: p.name,
      website: p.website,
      href: `/designer/history?project=${p.id}`,
      stats: [
        { label: "pieces", value: mine.length },
        {
          label: "delivered",
          value: mine.filter((t) =>
            ["DESIGNED", "DEV_NOW", "DEVELOPING", "DEVELOPED", "POST_NOW", "POSTED", "SEO_OPTIMIZED"].includes(t.status)
          ).length,
        },
      ],
    };
  });

  return (
    <div>
      <PageHeader title="My projects" description="The websites and brands you design for — open one for its monthly work." />
      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="When you're assigned design work on a project, it appears here." />
      ) : (
        <SearchableProjectGrid projects={grid} />
      )}
    </div>
  );
}
