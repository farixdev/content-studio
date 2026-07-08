import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { PhaseBoard } from "@/components/admin/phase-board";
import { StatCard } from "@/components/ui/stat-card";
import { Inbox, Code2, CheckCircle2 } from "lucide-react";
import { toListItem } from "@/lib/tasks";

const DEV_STATUSES = ["DEV_NOW", "DEVELOPING", "DEVELOPED"];

export default async function AdminDevelopmentPage() {
  const tasks = await prisma.task.findMany({
    where: { status: { in: DEV_STATUSES } },
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
      <PageHeader title="Development" description="Approved designs being built by developers." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Ready to build" value={count("DEV_NOW")} icon={Inbox} tone="primary" />
        <StatCard label="Developing" value={count("DEVELOPING")} icon={Code2} tone="violet" />
        <StatCard label="Built" value={count("DEVELOPED")} icon={CheckCircle2} tone="emerald" />
      </div>
      <PhaseBoard initial={items} kind="dev" statuses={DEV_STATUSES} />
    </div>
  );
}
