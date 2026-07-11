import { PenLine, FileText, ClipboardCheck, Rocket, Hash } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toListItem } from "@/lib/tasks";
import { isFullyReviewed } from "@/lib/workflow";
import { PageHeader } from "@/components/layout/page-header";
import { TaskGroup } from "@/components/task/task-group";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";

export default async function WriterHome() {
  const user = await requireRole("WRITER");
  const tasks = await prisma.task.findMany({
    where: { writerId: user.id },
    include: { writer: { select: { name: true } }, designer: { select: { name: true } }, project: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const items = tasks.map(toListItem);
  const pick = (statuses: string[]) => items.filter((i) => statuses.includes(i.status));

  const groups = [
    { title: "Needs improvement", tasks: pick(["IMPROVEMENT"]) },
    { title: "To write", tasks: pick(["ASSIGNED", "IN_PROGRESS"]) },
    {
      title: "In review",
      tasks: pick(["WRITTEN", "ISSUE_RESOLVED", "REVIEWED_BY_UMAR", "REVIEWED_BY_WAQAR"]),
    },
    {
      title: "In design & published",
      tasks: pick(["DESIGN_NOW", "DESIGNING", "DESIGNED", "POST_NOW", "POSTED", "SEO_OPTIMIZED"]),
    },
    { title: "Cancelled", tasks: pick(["CANCELLED"]) },
  ];

  const inReview = pick(["WRITTEN", "ISSUE_RESOLVED", "REVIEWED_BY_UMAR", "REVIEWED_BY_WAQAR"]).length;
  const published = pick(["POSTED", "SEO_OPTIMIZED"]).length;
  // Only approved content counts toward the final word total.
  const words = items.reduce((s, t) => s + (isFullyReviewed(t.status) ? t.words || 0 : 0), 0);

  return (
    <div>
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]} 👋`}
        description="Here's everything assigned to you."
      />
      {items.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="My content" value={items.length} icon={FileText} tone="primary" />
          <StatCard label="In review" value={inReview} icon={ClipboardCheck} tone="violet" />
          <StatCard label="Published" value={published} icon={Rocket} tone="emerald" />
          <StatCard label="Words written" value={words.toLocaleString()} icon={Hash} tone="amber" />
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState
          icon={PenLine}
          title="No assignments yet"
          description="When your manager assigns you content, it will show up here."
        />
      ) : (
        groups.map((g) => (
          <TaskGroup key={g.title} title={g.title} tasks={g.tasks} hrefBase="/writer/tasks" />
        ))
      )}
    </div>
  );
}
