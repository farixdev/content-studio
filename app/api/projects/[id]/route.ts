import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api";
import { canReviewerAccessProject } from "@/lib/projects";

const schema = z.object({
  name: z.string().min(1).optional(),
  website: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(["ADMIN", "REVIEWER"]);
  if (!user) return unauthorized();
  const { id } = await params;

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return notFound("Project not found.");
  // Reviewers may only edit/archive projects they're assigned to.
  if (user.role === "REVIEWER" && !(await canReviewerAccessProject(user.id, id))) return forbidden();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid data.");
  const d = parsed.data;

  await prisma.project.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name.trim() } : {}),
      ...(d.website !== undefined ? { website: d.website?.trim() || null } : {}),
      ...(d.description !== undefined ? { description: d.description?.trim() || null } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
    },
  });

  return ok({ id });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser("ADMIN");
  if (!user) return unauthorized();
  const { id } = await params;

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return notFound("Project not found.");

  // Delete the project and everything in it. Its content (tasks) must go first
  // because Task→Project is Restrict; task children (issues, approvals, history,
  // comments, notifications) and project members cascade at the DB level.
  await prisma.$transaction([
    prisma.task.deleteMany({ where: { projectId: id } }),
    prisma.project.delete({ where: { id } }),
  ]);

  return ok({ id });
}
