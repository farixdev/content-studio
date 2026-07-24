import Link from "next/link";
import { FileText, Rocket, Loader, Hash, FolderKanban, X } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { MemberHistory } from "@/components/admin/member-history";
import { toListItem } from "@/lib/tasks";
import { buildMonthGroups } from "@/lib/history";
import { approvedWords } from "@/lib/workflow";

export default async function WriterHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const user = await requireRole("WRITER");
  const sp = await searchParams;

  const where: Prisma.TaskWhereInput = {
    writerId: user.id,
    ...(sp.project ? { projectId: sp.project } : {}),
  };
  const [tasks, project] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        writer: { select: { name: true } },
        designer: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    }),
    sp.project
      ? prisma.project.findUnique({ where: { id: sp.project }, select: { name: true } })
      : Promise.resolve(null),
  ]);
  const items = tasks.map(toListItem);

  const total = items.length;
  const published = items.filter((t) => t.status === "POSTED" || t.status === "SEO_OPTIMIZED").length;
  const inPipeline = items.filter((t) => t.status !== "CANCELLED" && !["POSTED", "SEO_OPTIMIZED"].includes(t.status)).length;
  // Approved content only — the final word count.
  const words = approvedWords(items);
  const since = items.length
    ? new Date(Math.min(...items.map((t) => new Date(t.date).getTime())))
    : new Date();
  const monthGroups = buildMonthGroups(items, since);

  return (
    <div>
      <PageHeader
        title="My monthly work"
        description="Your content grouped month by month — words counted are approved (final) content."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total content" value={total} icon={FileText} tone="primary" />
        <StatCard label="Published" value={published} icon={Rocket} tone="emerald" />
        <StatCard label="In pipeline" value={inPipeline} icon={Loader} tone="violet" />
        <StatCard label="Approved words" value={words.toLocaleString()} icon={Hash} tone="amber" />
      </div>

      {project && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
            <FolderKanban className="h-3.5 w-3.5" />
            {project.name}
            <Link href="/writer/history" className="ml-0.5 rounded-full p-0.5 transition hover:bg-primary-100" aria-label="Clear project filter">
              <X className="h-3 w-3" />
            </Link>
          </span>
        </div>
      )}

      {total === 0 ? (
        <EmptyState icon={FileText} title="No content yet" description="Your assigned content will show up here, grouped by month." />
      ) : (
        <MemberHistory months={monthGroups} hrefBase="/writer/tasks" />
      )}
    </div>
  );
}
