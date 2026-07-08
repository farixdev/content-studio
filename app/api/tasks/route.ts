import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";
import { nextRefCode, notifyUser, notifyAdmins } from "@/lib/tasks";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  projectId: z.string().min(1, "Pick a project"),
  contentType: z.string().min(1, "Content type is required"),
  writerId: z.string().nullable().optional(),
  guideText: z.string().nullable().optional(),
  guideFileId: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  date: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await apiUser(["ADMIN", "REVIEWER"]);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid data.");
  }
  const d = parsed.data;

  const project = await prisma.project.findUnique({ where: { id: d.projectId } });
  if (!project) return badRequest("That project no longer exists.");
  if (project.status === "ARCHIVED") return badRequest("That project is archived — reactivate it first.");

  const refCode = await nextRefCode();

  const task = await prisma.task.create({
    data: {
      refCode,
      title: d.title.trim(),
      projectId: d.projectId,
      contentType: d.contentType,
      status: "ASSIGNED",
      writerId: d.writerId || null,
      guideText: d.guideText?.trim() || null,
      guideFileId: d.guideFileId || null,
      remarks: d.remarks?.trim() || null,
      date: d.date ? new Date(d.date) : new Date(),
      createdById: user.id,
      statusHistory: { create: { toStatus: "ASSIGNED", byId: user.id, note: "Created" } },
    },
  });

  if (d.writerId) {
    // Assigning a writer to content in a project makes them a project member.
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: d.projectId, userId: d.writerId } },
      update: {},
      create: { projectId: d.projectId, userId: d.writerId },
    });
    await notifyUser(d.writerId, "ASSIGNED", `You've been assigned: ${task.title}`, task.id);
  }

  // Keep the admin in the loop when a reviewer creates content.
  if (user.role === "REVIEWER") {
    await notifyAdmins("CREATED", `${user.name} created: ${task.title}`, task.id);
  }

  return ok({ id: task.id, refCode });
}
