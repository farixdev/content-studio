import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, FileText, ClipboardCheck, Rocket, Hash } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toListItem } from "@/lib/tasks";
import { approvedWords } from "@/lib/workflow";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { WriterProjectWork } from "@/components/writer/project-work";

const REVIEW_STATUSES = ["WRITTEN", "ISSUE_RESOLVED", "REVIEWED_BY_UMAR", "REVIEWED_BY_WAQAR"];

export default async function WriterProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("WRITER");
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  // A writer can open a project only if they're a member or have content in it.
  const [membership, tasks] = await Promise.all([
    prisma.projectMember.findFirst({ where: { projectId: id, userId: user.id } }),
    prisma.task.findMany({
      where: { projectId: id, writerId: user.id },
      include: {
        writer: { select: { name: true } },
        designer: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  if (!membership && tasks.length === 0) notFound();

  const items = tasks.map(toListItem);
  const inReview = items.filter((t) => REVIEW_STATUSES.includes(t.status)).length;
  const published = items.filter((t) => t.status === "POSTED" || t.status === "SEO_OPTIMIZED").length;
  // Approved content only — a draft in review isn't counted yet.
  const words = approvedWords(items);

  return (
    <div>
      <Link
        href="/writer/projects"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my projects
      </Link>

      <Card className="mb-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
        {project.website && (
          <a
            href={project.website}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Globe className="h-3.5 w-3.5" />
            {project.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        )}
        {project.description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="My pieces" value={items.length} icon={FileText} tone="primary" />
          <StatCard label="In review" value={inReview} icon={ClipboardCheck} tone="violet" />
          <StatCard label="Published" value={published} icon={Rocket} tone="emerald" />
          <StatCard label="Approved words" value={words.toLocaleString()} icon={Hash} tone="amber" />
        </div>
      </Card>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">My content in this project</h2>
        <p className="text-sm text-muted-foreground">Filter by where each piece is in the pipeline.</p>
      </div>
      <WriterProjectWork items={items} />
    </div>
  );
}
