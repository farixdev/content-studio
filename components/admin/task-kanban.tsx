"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCorners,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Hash, LinkIcon } from "lucide-react";
import { STATUS_ORDER, statusMeta } from "@/lib/constants";
import type { TaskListItem } from "@/lib/tasks";
import { cn } from "@/lib/utils";

function KanbanCard({ task }: { task: TaskListItem }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => router.push(`/admin/tasks/${task.id}`)}
      className={cn(
        "cursor-grab touch-none rounded-xl border border-border bg-white p-3 shadow-soft transition active:cursor-grabbing hover:border-primary-100 hover:shadow-card",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[11px] text-muted-foreground">{task.refCode}</span>
        <span className="text-[11px] text-muted-foreground">· {task.contentType}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">{task.title}</p>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        {task.writerName && <span className="truncate">{task.writerName}</span>}
        {task.words > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <Hash className="h-3 w-3" />
            {task.words}
          </span>
        )}
        {task.websiteLink && <LinkIcon className="h-3 w-3 text-primary" />}
      </div>
    </div>
  );
}

function Column({ status, tasks }: { status: string; tasks: TaskListItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = statusMeta(status);
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-2xl border border-border bg-muted/40 transition",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
          <span className="text-xs font-semibold text-foreground">{meta.label}</span>
        </div>
        <span className="rounded-full bg-white px-1.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="flex max-h-[calc(100vh-260px)] flex-col gap-2 overflow-y-auto px-2 pb-2 thin-scrollbar">
        {tasks.map((t) => (
          <KanbanCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}

export function TaskKanban({
  tasks,
  onMove,
}: {
  tasks: TaskListItem[];
  onMove: (id: string, status: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    const newStatus = String(over.id);
    if (task && task.status !== newStatus) onMove(String(active.id), newStatus);
  }

  const byStatus = (status: string) => tasks.filter((t) => t.status === status);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 thin-scrollbar">
        {STATUS_ORDER.map((status) => (
          <Column key={status} status={status} tasks={byStatus(status)} />
        ))}
      </div>
    </DndContext>
  );
}
