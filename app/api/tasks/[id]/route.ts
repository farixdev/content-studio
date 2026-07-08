import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, notFound, ok, unauthorized } from "@/lib/api";
import { notifyUser } from "@/lib/tasks";

const schema = z.object({
  title: z.string().min(1).optional(),
  contentType: z.string().min(1).optional(),
  writerId: z.string().nullable().optional(),
  guideText: z.string().nullable().optional(),
  guideFileId: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  websiteLink: z.string().nullable().optional(),
  designInstructions: z.string().nullable().optional(),
  projectId: z.string().min(1).optional(),
  date: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(["ADMIN", "REVIEWER"]);
  if (!user) return unauthorized();
  const { id } = await params;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return notFound("Task not found.");

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid data.");
  const d = parsed.data;

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title.trim() } : {}),
      ...(d.contentType !== undefined ? { contentType: d.contentType } : {}),
      ...(d.writerId !== undefined ? { writerId: d.writerId || null } : {}),
      ...(d.guideText !== undefined ? { guideText: d.guideText?.trim() || null } : {}),
      ...(d.guideFileId !== undefined ? { guideFileId: d.guideFileId || null } : {}),
      ...(d.remarks !== undefined ? { remarks: d.remarks?.trim() || null } : {}),
      ...(d.websiteLink !== undefined ? { websiteLink: d.websiteLink?.trim() || null } : {}),
      ...(d.designInstructions !== undefined
        ? { designInstructions: d.designInstructions?.trim() || null }
        : {}),
      ...(d.projectId !== undefined ? { projectId: d.projectId } : {}),
      ...(d.date !== undefined ? { date: new Date(d.date) } : {}),
    },
  });

  if (d.writerId !== undefined && d.writerId && d.writerId !== existing.writerId) {
    await notifyUser(d.writerId, "ASSIGNED", `You've been assigned: ${task.title}`, task.id);
  }

  return ok({ id: task.id });
}
