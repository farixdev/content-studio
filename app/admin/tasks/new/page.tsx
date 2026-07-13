import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { reviewerProjectIds } from "@/lib/projects";
import { PageHeader } from "@/components/layout/page-header";
import { CreateTaskForm } from "@/components/admin/create-task-form";
import { getContentTypes } from "@/lib/settings";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const sp = await searchParams;
  const me = await getCurrentUser();
  // Reviewers can only create content in the projects they're assigned to.
  const projectWhere =
    me?.role === "REVIEWER"
      ? { status: "ACTIVE", id: { in: await reviewerProjectIds(me.id) } }
      : { status: "ACTIVE" };
  const [writers, projects, contentTypes] = await Promise.all([
    prisma.user.findMany({
      where: { role: "WRITER", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.project.findMany({
      where: projectWhere,
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getContentTypes(),
  ]);

  // Only prefill a project the picker actually offers (ignore archived/unknown ids).
  const defaultProjectId =
    sp.project && projects.some((p) => p.id === sp.project) ? sp.project : undefined;

  return (
    <div>
      <Link
        href="/admin/tasks"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to content
      </Link>
      <PageHeader title="Create content" description="Set up a new piece and assign it to a writer." />
      <CreateTaskForm
        writers={writers}
        projects={projects}
        contentTypes={contentTypes}
        defaultProjectId={defaultProjectId}
      />
    </div>
  );
}
