import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api";
import { canAccessTask, notifyAdmins, notifyUser } from "@/lib/tasks";

const schema = z.object({ body: z.string().min(1, "Write a comment") });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound("Task not found.");
  if (!canAccessTask(user.role, user.id, task)) return forbidden();

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
