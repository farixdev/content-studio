import { TaskCard } from "./task-card";
import type { TaskListItem } from "@/lib/tasks";

export function TaskGroup({
  title,
  tasks,
  hrefBase,
}: {
  title: string;
  tasks: TaskListItem[];
  hrefBase: string;
}) {
  if (tasks.length === 0) return null;
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} href={`${hrefBase}/${t.id}`} />
        ))}
      </div>
    </section>
  );
}
