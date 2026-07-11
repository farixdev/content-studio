import Link from "next/link";
import { FolderKanban, Globe, FileText, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DeveloperProjectsPage() {
  const user = await requireRole("DEVELOPER");

  const taskProjects = await prisma.task.findMany({
    where: { developerId: user.id, projectId: { not: null } },
    select: { projectId: true },
    distinct: ["projectId"],
  });
  const ids = [...new Set(taskProjects.map((t) => t.projectId!))];

  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({ where: { id: { in: ids } }, orderBy: { name: "asc" } }),
    prisma.task.findMany({
      where: { developerId: user.id, projectId: { in: ids } },
      select: { projectId: true, status: true },
    }),
  ]);

  const statsFor = (projectId: string) => {
    const mine = tasks.filter((t) => t.projectId === projectId);
    return {
      pieces: mine.length,
      delivered: mine.filter((t) => ["DEVELOPED", "POST_NOW", "POSTED", "SEO_OPTIMIZED"].includes(t.status)).length,
    };
  };

  return (
    <div>
      <PageHeader title="My projects" description="The websites and brands you build for — open one for its monthly work." />
      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="When you're assigned build work on a project, it appears here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const s = statsFor(p.id);
            return (
              <Link
                key={p.id}
                href={`/developer/history?project=${p.id}`}
                className="group block rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary-100 hover:shadow-elevated"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl brand-gradient text-white">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold text-foreground transition group-hover:text-primary-700">{p.name}</h3>
                {p.website && (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {p.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {s.pieces} pieces
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {s.delivered} delivered
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
