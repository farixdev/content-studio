import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Rocket, Loader, Hash, CalendarDays, Inbox, FolderKanban, X } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { UserAvatar } from "@/components/user-avatar";
import { MemberHistory } from "@/components/admin/member-history";
import { toListItem } from "@/lib/tasks";
import { buildMonthGroups } from "@/lib/history";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

// Role → which tasks belong to this member, and the label to use.
const ROLE_CONFIG: Record<Role, { verb: string; where: (id: string) => Prisma.TaskWhereInput }> = {
  ADMIN: { verb: "created", where: (id) => ({ createdById: id }) },
  WRITER: { verb: "assigned", where: (id) => ({ writerId: id }) },
  DESIGNER: { verb: "designed", where: (id) => ({ designerId: id }) },
  REVIEWER: { verb: "reviewed", where: (id) => ({ approvals: { some: { reviewerId: id } } }) },
};

export default async function MemberHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const member = await prisma.user.findUnique({ where: { id } });
  if (!member) notFound();

  const role = member.role as Role;
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.WRITER;

  const where: Prisma.TaskWhereInput = {
    ...cfg.where(id),
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
  const cancelled = items.filter((t) => t.status === "CANCELLED").length;
  const inProgress = total - published - cancelled;
  const words = items.reduce((sum, t) => sum + (t.words || 0), 0);

  const monthGroups = buildMonthGroups(items, member.createdAt);

  return (
    <div>
      <Link
        href={sp.project ? `/admin/projects/${sp.project}` : "/admin/team"}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {sp.project ? "Back to project" : "Back to team"}
      </Link>

      {/* Profile header */}
      <Card className="mb-6 p-6">
        <div className="flex items-center gap-4">
          <UserAvatar name={member.name} className="h-16 w-16 text-xl" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{member.name}</h1>
              {member.active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>@{member.username}</span>
              <span className="text-border">•</span>
              <span>{ROLE_LABELS[role]}</span>
              <span className="text-border">•</span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Joined {formatDate(member.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={`Content ${cfg.verb}`} value={total} icon={FileText} tone="primary" />
          <StatCard label="Published" value={published} icon={Rocket} tone="emerald" />
          <StatCard label="In pipeline" value={inProgress} icon={Loader} tone="violet" />
          <StatCard label="Total words" value={words.toLocaleString()} icon={Hash} tone="amber" />
        </div>
      </Card>

      {/* History */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">History</h2>
        <span className="text-sm text-muted-foreground">— month by month</span>
        {project && (
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
            <FolderKanban className="h-3.5 w-3.5" />
            {project.name}
            <Link
              href={`/admin/team/${id}`}
              className="ml-0.5 rounded-full p-0.5 transition hover:bg-primary-100"
              aria-label="Clear project filter"
            >
              <X className="h-3 w-3" />
            </Link>
          </span>
        )}
      </div>

      {total === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">No content yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {sp.project
              ? `${member.name.split(" ")[0]} has no content on this project yet.`
              : `Content ${cfg.verb} to ${member.name.split(" ")[0]} will appear here, grouped by month.`}
          </p>
        </Card>
      ) : (
        <MemberHistory months={monthGroups} hrefBase="/admin/tasks" />
      )}
    </div>
  );
}
