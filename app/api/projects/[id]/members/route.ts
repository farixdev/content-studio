import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api";
import { notifyUser } from "@/lib/tasks";
import { canReviewerAccessProject } from "@/lib/projects";

const schema = z.object({ userId: z.string().min(1) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await apiUser(["ADMIN", "REVIEWER"]);
  if (!admin) return unauthorized();
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return notFound("Project not found.");
  // A reviewer may only manage members of projects they're assigned to (this also
  // prevents a reviewer from self-adding to a project to escalate their access).
  if (admin.role === "REVIEWER" && !(await canReviewerAccessProject(admin.id, id))) return forbidden();
  if (project.status === "ARCHIVED") return badRequest("That project is archived — reactivate it first.");

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Pick a member to add.");

  const member = await prisma.user.findFirst({
    where: { id: parsed.data.userId, active: true, role: { in: ["WRITER", "REVIEWER", "DESIGNER", "DEVELOPER"] } },
  });
  if (!member) return badRequest("That person is not available.");

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: id, userId: member.id } },
    update: {},
    create: { projectId: id, userId: member.id },
  });
  await notifyUser(member.id, "PROJECT", `You've been added to the project: ${project.name}`, null);

  return ok({
    member: {
      id: member.id,
      name: member.name,
      username: member.username,
      role: member.role,
      active: member.active,
    },
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await apiUser(["ADMIN", "REVIEWER"]);
  if (!admin) return unauthorized();
  const { id } = await params;

  if (admin.role === "REVIEWER" && !(await canReviewerAccessProject(admin.id, id))) return forbidden();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("No member specified.");

  await prisma.projectMember.deleteMany({ where: { projectId: id, userId: parsed.data.userId } });
  return ok({ userId: parsed.data.userId });
}
