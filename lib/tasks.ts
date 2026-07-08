import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function notifyUser(userId: string, type: string, message: string, taskId: string | null = null) {
  await prisma.notification.create({ data: { userId, type, message, taskId } });
}

export async function notifyAdmins(type: string, message: string, taskId: string | null = null) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", active: true }, select: { id: true } });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, type, message, taskId })),
  });
}

export async function notifyReviewers(type: string, message: string, taskId: string | null = null) {
  const reviewers = await prisma.user.findMany({ where: { role: "REVIEWER", active: true }, select: { id: true } });
  if (reviewers.length === 0) return;
  await prisma.notification.createMany({
    data: reviewers.map((r) => ({ userId: r.id, type, message, taskId })),
  });
}

export async function shellNotifications(userId: string) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    taskId: n.taskId,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Status history
// ---------------------------------------------------------------------------

export async function recordStatus(
  taskId: string,
  fromStatus: string | null,
  toStatus: string,
  byId: string,
  note?: string
) {
  await prisma.statusHistory.create({
    data: { taskId, fromStatus, toStatus, byId, note: note ?? null },
  });
}

// ---------------------------------------------------------------------------
// Reference codes
// ---------------------------------------------------------------------------

export async function nextRefCode(): Promise<string> {
  // Codes are zero-padded (MC-0001), so lexical desc == numeric desc — fetch only
  // the current highest instead of scanning the whole table.
  const last = await prisma.task.findFirst({
    orderBy: { refCode: "desc" },
    select: { refCode: true },
  });
  const n = last ? parseInt(/MC-(\d+)/.exec(last.refCode)?.[1] ?? "0", 10) : 0;
  return `MC-${String(n + 1).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Serialization for client components
// ---------------------------------------------------------------------------

export interface TaskListItem {
  id: string;
  refCode: string;
  title: string;
  contentType: string;
  status: string;
  date: string;
  words: number;
  websiteLink: string | null;
  remarks: string | null;
  writerName: string | null;
  designerName: string | null;
  projectId: string | null;
  projectName: string | null;
  guidePreview: string | null;
  hasContent: boolean;
  updatedAt: string;
}

type TaskWithPeople = {
  id: string;
  refCode: string;
  title: string;
  contentType: string;
  status: string;
  date: Date;
  words: number;
  websiteLink: string | null;
  remarks: string | null;
  guideText: string | null;
  contentText: string | null;
  updatedAt: Date;
  projectId: string | null;
  writer: { name: string } | null;
  designer: { name: string } | null;
  project?: { name: string } | null;
};

export function canAccessTask(
  role: string,
  userId: string,
  task: { writerId: string | null; designerId: string | null; developerId?: string | null }
): boolean {
  if (role === "ADMIN" || role === "REVIEWER") return true;
  if (role === "WRITER") return task.writerId === userId;
  if (role === "DESIGNER") return task.designerId === userId;
  if (role === "DEVELOPER") return task.developerId === userId;
  return false;
}

export function toListItem(t: TaskWithPeople): TaskListItem {
  return {
    id: t.id,
    refCode: t.refCode,
    title: t.title,
    contentType: t.contentType,
    status: t.status,
    date: t.date.toISOString(),
    words: t.words,
    websiteLink: t.websiteLink,
    remarks: t.remarks,
    writerName: t.writer?.name ?? null,
    designerName: t.designer?.name ?? null,
    projectId: t.projectId,
    projectName: t.project?.name ?? null,
    guidePreview: t.guideText ? t.guideText.slice(0, 140) : null,
    hasContent: !!t.contentText,
    updatedAt: t.updatedAt.toISOString(),
  };
}
