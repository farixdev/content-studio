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
  // Free-form status override is a Manager-only power (reviewers act through the
  // dedicated review / assign / design-review routes).
  const user = await apiUser("ADMIN");
  if (!user) return unauthorized();
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid status.");
  const to = parsed.data.status;
  // Accept a built-in status or a Manager-defined custom one.
  if (!isStatus(to) && !(await prisma.customStatus.findUnique({ where: { key: to } }))) {
    return badRequest("Invalid status.");
  }

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound("Task not found.");

  const from = task.status;
  if (from === to) return ok({ id, status: to });

  // Don't strand a task in a role phase with nobody assigned to act on it.
  if (to === "DEV_NOW" && !task.developerId) {
    return badRequest("Assign a developer before moving this to Develop.");
  }
  if (to === "DESIGN_NOW" && !task.designerId) {
    return badRequest("Assign a designer before moving this to Design.");
  }

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
