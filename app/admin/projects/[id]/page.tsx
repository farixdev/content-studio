import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProjectDetail } from "@/lib/projects";
import { ProjectDetailView } from "@/components/admin/project-detail-view";
import type { Role } from "@/lib/constants";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectDetail(id);
  if (!project) notFound();

  const users = await prisma.user.findMany({
    where: { role: { in: ["WRITER", "REVIEWER", "DESIGNER"] }, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, username: true, role: true },
  });
  const candidates = users.map((u) => ({ ...u, role: u.role as Role }));

  return <ProjectDetailView project={project} candidates={candidates} />;
}
