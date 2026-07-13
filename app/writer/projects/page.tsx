import { FolderKanban } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchableProjectGrid } from "@/components/admin/searchable-project-grid";

export default async function WriterProjectsPage() {
  const user = await requireRole("WRITER");

  const [memberships, taskProjects] = await Promise.all([
    prisma.projectMember.findMany({ where: { userId: user.id }, select: { projectId: true } }),
    prisma.task.findMany({
      where: { writerId: user.id, projectId: { not: null } },
      select: { projectId: true },
      distinct: ["projectId"],
    }),
  ]);
  const ids = [
    ...new Set([...memberships.map((m) => m.projectId), ...taskProjects.map((t) => t.projectId!)]),
  ];

  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({ where: { id: { in: ids } }, orderBy: { name: "asc" } }),
    prisma.task.findMany({
      where: { writerId: user.id, projectId: { in: ids } },
      select: { projectId: true, status: true, words: true },
    }),
  ]);

  const grid = projects.map((p) => {
    const mine = tasks.filter((t) => t.projectId === p.id);
    return {
      id: p.id,
      name: p.name,
      website: p.website,
      href: `/writer/projects/${p.id}`,
      stats: [
        { label: "pieces", value: mine.length },
        { label: "words", value: mine.reduce((s, t) => s + (t.words || 0), 0).toLocaleString() },
        { label: "live", value: mine.filter((t) => t.status === "POSTED" || t.status === "SEO_OPTIMIZED").length },
      ],
    };
  });

  return (
    <div>
      <PageHeader title="My projects" description="The websites and brands you write for." />
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="When your manager assigns you to a project, it will appear here."
        />
      ) : (
        <SearchableProjectGrid projects={grid} />
      )}
    </div>
  );
}
