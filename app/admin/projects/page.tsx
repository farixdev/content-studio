import { PageHeader } from "@/components/layout/page-header";
import { ProjectsView } from "@/components/admin/projects-view";
import { getProjectsList } from "@/lib/projects";

export default async function ProjectsPage() {
  const projects = await getProjectsList();
  return (
    <div>
      <PageHeader title="Projects" description="Every website or brand you produce content for." />
      <ProjectsView initial={projects} />
    </div>
  );
}
