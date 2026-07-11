import Link from "next/link";
import { FileText, Palette, CheckCircle2, Hash, FolderKanban, X } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { MemberHistory } from "@/components/admin/member-history";
import { toListItem } from "@/lib/tasks";
import { buildMonthGroups } from "@/lib/history";

export default async function DesignerHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const user = await requireRole("DESIGNER");
  const sp = await searchParams;

  const where: Prisma.TaskWhereInput = {
    designerId: user.id,
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
    sp.project ? prisma.project.findUnique({ where: { id: sp.project }, select: { name: true } }) : Promise.resolve(null),
  ]);
  const items = tasks.map(toListItem);

  const total = items.length;
  const delivered = items.filter((t) =>
    ["DESIGNED", "DEV_NOW", "DEVELOPING", "DEVELOPED", "POST_NOW", "POSTED", "SEO_OPTIMIZED"].includes(t.status)
  ).length;
  const active = items.filter((t) => ["DESIGN_NOW", "DESIGNING", "DESIGN_IMPROVEMENT"].includes(t.status)).length;
  const since = items.length ? new Date(Math.min(...items.map((t) => new Date(t.date).getTime()))) : new Date();
  const monthGroups = buildMonthGroups(items, since);

  return (
    <div>
      <PageHeader title="My monthly work" description="The pieces you've designed, grouped month by month." />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Total designed" value={total} icon={FileText} tone="primary" />
        <StatCard label="In progress" value={active} icon={Palette} tone="violet" />
        <StatCard label="Delivered" value={delivered} icon={CheckCircle2} tone="emerald" />
      </div>
      {project && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
            <FolderKanban className="h-3.5 w-3.5" />
            {project.name}
            <Link href="/designer/history" className="ml-0.5 rounded-full p-0.5 transition hover:bg-primary-100" aria-label="Clear project filter">
              <X className="h-3 w-3" />
            </Link>
          </span>
        </div>
      )}
      {total === 0 ? (
        <EmptyState icon={Hash} title="No design work yet" description="Pieces assigned to you will show up here, grouped by month." />
      ) : (
        <MemberHistory months={monthGroups} hrefBase="/designer/tasks" />
      )}
    </div>
  );
}
