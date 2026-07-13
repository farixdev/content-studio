import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api";
import { recordStatus, notifyAdmins, notifyUser } from "@/lib/tasks";
import { canReviewerAccessProject } from "@/lib/projects";
import { isDesignReview } from "@/lib/workflow";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  developerId: z.string().optional(),
  devInstructions: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(["ADMIN", "REVIEWER"]);
  if (!user) return unauthorized();
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound("Task not found.");
  if (user.role === "REVIEWER" && !(await canReviewerAccessProject(user.id, task.projectId))) {
    return forbidden();
  }
  if (!isDesignReview(task.status)) return badRequest("This design isn't awaiting approval.");

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid data.");
  const d = parsed.data;

  if (d.action === "reject") {
    await prisma.task.update({ where: { id }, data: { status: "DESIGN_IMPROVEMENT" } });
    await recordStatus(
      id,
      task.status,
      "DESIGN_IMPROVEMENT",
      user.id,
      d.reason?.trim() || "Design changes requested"
    );
    if (task.designerId) {
      await notifyUser(task.designerId, "DESIGN_IMPROVEMENT", `Design changes requested: ${task.title}`, id);
    }
    return ok({ id, status: "DESIGN_IMPROVEMENT" });
  }

  // Approve the design and hand the build to a developer.
  if (!d.developerId) return badRequest("Pick a developer to hand the build to.");
  const developer = await prisma.user.findFirst({
    where: { id: d.developerId, role: "DEVELOPER", active: true },
  });
  if (!developer) return badRequest("That developer is not available.");

  await prisma.task.update({
    where: { id },
    data: {
      developerId: developer.id,
      devInstructions: d.devInstructions?.trim() || null,
      status: "DEV_NOW",
    },
  });
  // Keep the developer in the project team.
  if (task.projectId) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: task.projectId, userId: developer.id } },
      update: {},
      create: { projectId: task.projectId, userId: developer.id },
    });
  }
  await recordStatus(id, task.status, "DEV_NOW", user.id, `Design approved → ${developer.name}`);
  await notifyUser(developer.id, "DEV", `New build task: ${task.title}`, id);
  await notifyAdmins("DESIGN_APPROVED", `${user.name} approved the design: ${task.title}`, id);
  return ok({ id, status: "DEV_NOW" });
}
