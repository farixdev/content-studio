import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api";
import { recordStatus, notifyAdmins } from "@/lib/tasks";

const schema = z.object({
  action: z.enum(["start", "submit"]),
  devLink: z.string().nullable().optional(),
  note: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser("DEVELOPER");
  if (!user) return unauthorized();
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound("Task not found.");
  if (task.developerId !== user.id) return forbidden();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid data.");
  const d = parsed.data;

  if (d.action === "start") {
    if (task.status !== "DEV_NOW") return badRequest("This task isn't ready to start.");
    await prisma.task.update({ where: { id }, data: { status: "DEVELOPING" } });
    await recordStatus(id, task.status, "DEVELOPING", user.id, "Started development");
    await notifyAdmins("DEVELOPING", `${user.name} started building: ${task.title}`, id);
    return ok({ id, status: "DEVELOPING" });
  }

  // submit — needs the built-page link.
  if (task.status !== "DEVELOPING" && task.status !== "DEV_NOW") {
    return badRequest("This task isn't in the development stage.");
  }
  const devLink = d.devLink?.trim() || task.devLink;
  if (!devLink) return badRequest("Add the link to the built page before submitting.");

  await prisma.task.update({ where: { id }, data: { status: "DEVELOPED", devLink } });
  await recordStatus(id, task.status, "DEVELOPED", user.id, "Development completed");
  await notifyAdmins("DEVELOPED", `Build ready: ${task.title}`, id);
  return ok({ id, status: "DEVELOPED" });
}
