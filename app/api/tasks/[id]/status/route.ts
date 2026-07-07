import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, notFound, ok, unauthorized } from "@/lib/api";
import { recordStatus, notifyUser } from "@/lib/tasks";
import { isStatus, statusMeta } from "@/lib/constants";

const schema = z.object({
  status: z.string(),
  note: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser("ADMIN");
  if (!user) return unauthorized();
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isStatus(parsed.data.status)) return badRequest("Invalid status.");

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound("Task not found.");

  const from = task.status;
  const to = parsed.data.status;
  if (from === to) return ok({ id, status: to });

  await prisma.task.update({ where: { id }, data: { status: to } });
  await recordStatus(id, from, to, user.id, parsed.data.note);

  // Notify the people who care about the new state.
  const label = statusMeta(to).label;
  if (to === "DESIGN_NOW" && task.designerId) {
    await notifyUser(task.designerId, "DESIGN", `Ready to design: ${task.title}`, id);
  } else if (task.writerId) {
    await notifyUser(task.writerId, "STATUS", `"${task.title}" is now ${label}.`, id);
  }

  return ok({ id, status: to });
}
