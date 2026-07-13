import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api";
import { canAccessTask, notifyAdmins, notifyUser } from "@/lib/tasks";
import { canReviewerAccessProject } from "@/lib/projects";

const schema = z.object({ body: z.string().min(1, "Write a comment") });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    select: { writerId: true, designerId: true, developerId: true, projectId: true },
  });
  if (!task) return notFound("Task not found.");
  if (!canAccessTask(user.role, user.id, task)) return forbidden();
  if (user.role === "REVIEWER" && !(await canReviewerAccessProject(user.id, task.projectId))) {
    return forbidden();
  }

  const rows = await prisma.comment.findMany({
    where: { taskId: id },
    include: { author: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
  return ok({
    comments: rows.map((c) => ({
      id: c.id,
      body: c.body,
      authorName: c.author.name,
      authorRole: c.author.role,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound("Task not found.");
  if (!canAccessTask(user.role, user.id, task)) return forbidden();
  if (user.role === "REVIEWER" && !(await canReviewerAccessProject(user.id, task.projectId))) {
    return forbidden();
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Write a comment first.");

  const comment = await prisma.comment.create({
    data: { taskId: id, authorId: user.id, body: parsed.data.body.trim() },
  });

  const message = `${user.name} commented on "${task.title}"`;
  if (user.role !== "ADMIN") await notifyAdmins("COMMENT", message, id);
  if (task.writerId && task.writerId !== user.id) await notifyUser(task.writerId, "COMMENT", message, id);
  if (task.designerId && task.designerId !== user.id) await notifyUser(task.designerId, "COMMENT", message, id);

  return ok({
    id: comment.id,
    body: comment.body,
    authorName: user.name,
    createdAt: comment.createdAt.toISOString(),
  });
}
