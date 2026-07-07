import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { CreateTaskForm } from "@/components/admin/create-task-form";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const sp = await searchParams;
  const [writers, projects] = await Promise.all([
    prisma.user.findMany({
      where: { role: "WRITER", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.project.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

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
      <CreateTaskForm writers={writers} projects={projects} defaultProjectId={sp.project} />
    </div>
  );
}
