import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProjectDetail, canReviewerAccessProject } from "@/lib/projects";
import { getCurrentUser } from "@/lib/session";
import { ProjectDetailView } from "@/components/admin/project-detail-view";
import type { Role } from "@/lib/constants";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectDetail(id);
  if (!project) notFound();

  const users = await prisma.user.findMany({
    where: { role: { in: ["WRITER", "REVIEWER", "DESIGNER", "DEVELOPER"] }, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, username: true, role: true },
  });
  const candidates = users.map((u) => ({ ...u, role: u.role as Role }));
  const me = await getCurrentUser();
  // Reviewers can only open projects they're assigned to.
  if (me?.role === "REVIEWER" && !(await canReviewerAccessProject(me.id, id))) notFound();

  return (
    <ProjectDetailView
      project={project}
      candidates={candidates}
      canDelete={me?.role === "ADMIN"}
    />
  );
}
