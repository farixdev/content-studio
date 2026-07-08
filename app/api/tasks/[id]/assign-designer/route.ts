import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, notFound, ok, unauthorized } from "@/lib/api";
import { recordStatus, notifyUser } from "@/lib/tasks";

const schema = z.object({
  designerId: z.string().min(1, "Pick a designer"),
  designInstructions: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(["ADMIN", "REVIEWER"]);
  if (!user) return unauthorized();
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound("Task not found.");

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid data.");

  const designer = await prisma.user.findFirst({
    where: { id: parsed.data.designerId, role: "DESIGNER", active: true },
  });
  if (!designer) return badRequest("That designer is not available.");

  await prisma.task.update({
    where: { id },
    data: {
      designerId: designer.id,
      designInstructions: parsed.data.designInstructions?.trim() || null,
      status: "DESIGN_NOW",
    },
  });
  await recordStatus(id, task.status, "DESIGN_NOW", user.id, `Assigned to ${designer.name}`);
  await notifyUser(designer.id, "DESIGN", `New design task: ${task.title}`, id);

  return ok({ id, status: "DESIGN_NOW" });
}
