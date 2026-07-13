import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectsView } from "@/components/admin/projects-view";
import { getProjectsList, reviewerProjectIds } from "@/lib/projects";
import { getCurrentUser } from "@/lib/session";

export default async function ProjectsPage() {
  const me = await getCurrentUser();
  const isAdmin = me?.role === "ADMIN";
  // Reviewers only see the projects they're assigned to.
  const scope = me?.role === "REVIEWER" ? await reviewerProjectIds(me.id) : undefined;
  const [projects, reviewers] = await Promise.all([
    getProjectsList(scope),
    isAdmin
      ? prisma.user.findMany({
          where: { role: "REVIEWER", active: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);
  return (
    <div>
      <PageHeader title="Projects" description="Every website or brand you produce content for." />
      <ProjectsView initial={projects} reviewers={reviewers} canCreate={isAdmin} canDelete={isAdmin} />
    </div>
  );
}
