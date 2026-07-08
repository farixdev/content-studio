import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, notFound, ok, unauthorized } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { generatePassword } from "@/lib/credentials";

const schema = z.object({
  active: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters.").max(72).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await apiUser("ADMIN");
  if (!admin) return unauthorized();
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return notFound("User not found.");
  if (target.role === "ADMIN") return badRequest("The admin account can't be modified here.");

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid data.");
  }

  const data: { active?: boolean; passwordHash?: string; plainPassword?: string } = {};
  let newPassword: string | undefined;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.resetPassword || parsed.data.newPassword) {
    // Either the manager chose a password, or we generate a strong one. The old
    // password stops working the moment this update lands.
    newPassword = parsed.data.newPassword?.trim() || generatePassword(10);
    if (newPassword.length < 6) return badRequest("Password must be at least 6 characters.");
    data.passwordHash = await hashPassword(newPassword);
    data.plainPassword = newPassword;
  }

  await prisma.user.update({ where: { id }, data });

  return ok({
    id,
    ...(newPassword ? { credentials: { username: target.username, password: newPassword } } : {}),
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await apiUser("ADMIN");
  if (!admin) return unauthorized();
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return notFound("User not found.");
  if (target.role === "ADMIN") return badRequest("The admin account can't be deleted.");

  // Hand off records the workflow still needs to the acting manager, then remove
  // the member's personal activity, then delete them. Assigned content
  // (writer/designer/developer) auto-nulls; notifications, project memberships and
  // chat messages cascade away.
  await prisma.$transaction([
    // Required FKs (onDelete: Restrict) — reassign so the user can be deleted.
    prisma.task.updateMany({ where: { createdById: id }, data: { createdById: admin.id } }),
    prisma.project.updateMany({ where: { createdById: id }, data: { createdById: admin.id } }),
    // Keep their uploaded files (still attached to live/published tasks) — reassign
    // ownership instead of destroying the file bytes.
    prisma.upload.updateMany({ where: { uploadedById: id }, data: { uploadedById: admin.id } }),
    // Personal activity goes with them.
    prisma.comment.deleteMany({ where: { authorId: id } }),
    prisma.reviewApproval.deleteMany({ where: { reviewerId: id } }),
    prisma.reviewIssue.deleteMany({ where: { raisedById: id } }),
    prisma.statusHistory.deleteMany({ where: { byId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  return ok({ id });
}
