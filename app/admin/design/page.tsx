import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { taskWhereForViewer } from "@/lib/projects";
import { PageHeader } from "@/components/layout/page-header";
import { PhaseBoard } from "@/components/admin/phase-board";
import { StatCard } from "@/components/ui/stat-card";
import { Inbox, Palette, RotateCcw, CheckCircle2 } from "lucide-react";
import { toListItem } from "@/lib/tasks";

const DESIGN_STATUSES = ["REVIEWED_BY_WAQAR", "DESIGN_NOW", "DESIGNING", "DESIGN_IMPROVEMENT", "DESIGNED"];

export default async function AdminDesignPage() {
  const me = await getCurrentUser();
  const scope = me ? await taskWhereForViewer(me) : {};
  const tasks = await prisma.task.findMany({
    where: { status: { in: DESIGN_STATUSES }, ...scope },
    include: {
      writer: { select: { name: true } },
      designer: { select: { name: true } },
      developer: { select: { name: true } },
      project: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const items = tasks.map(toListItem);
  const count = (s: string) => items.filter((i) => i.status === s).length;

  return (
    <div>
      <PageHeader title="Design" description="Approved content moving through the design stage." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Needs a designer" value={count("REVIEWED_BY_WAQAR")} icon={Inbox} tone="primary" />
        <StatCard label="Designing" value={count("DESIGN_NOW") + count("DESIGNING")} icon={Palette} tone="violet" />
        <StatCard label="Changes requested" value={count("DESIGN_IMPROVEMENT")} icon={RotateCcw} tone="amber" />
        <StatCard label="Awaiting approval" value={count("DESIGNED")} icon={CheckCircle2} tone="emerald" />
      </div>
      <PhaseBoard initial={items} kind="design" statuses={DESIGN_STATUSES} />
    </div>
  );
}
