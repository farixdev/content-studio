import { z } from "zod";
import { Prisma } from "@prisma/client";
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

  // Retry on the rare refCode unique-collision from two concurrent creates.
  let created: { id: string; title: string; refCode: string } | null = null;
  for (let attempt = 0; ; attempt++) {
    try {
      created = await prisma.task.create({
        data: {
          refCode: await nextRefCode(),
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
      break;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 4) continue;
      throw e;
    }
  }
  const task = created!;

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

  return ok({ id: task.id, refCode: task.refCode });
}
