import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { TeamView } from "@/components/admin/team-view";
import type { Role } from "@/lib/constants";

export default async function TeamPage() {
  const rows = await prisma.user.findMany({
    where: { role: { in: ["WRITER", "REVIEWER", "DESIGNER", "DEVELOPER"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, username: true, role: true, active: true },
  });
  const users = rows.map((u) => ({ ...u, role: u.role as Role }));

  return (
    <div>
      <PageHeader title="Team" description="Manage writers, reviewers, designers and developers, and their logins." />
      <TeamView users={users} />
    </div>
  );
}
