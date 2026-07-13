import { PageHeader } from "@/components/layout/page-header";
import { ProjectsView } from "@/components/admin/projects-view";
import { getProjectsList } from "@/lib/projects";
import { getCurrentUser } from "@/lib/session";

export default async function ProjectsPage() {
  const [projects, me] = await Promise.all([getProjectsList(), getCurrentUser()]);
  return (
    <div>
      <PageHeader title="Projects" description="Every website or brand you produce content for." />
      <ProjectsView
        initial={projects}
        canCreate={me?.role === "ADMIN"}
        canDelete={me?.role === "ADMIN"}
      />
    </div>
  );
}
