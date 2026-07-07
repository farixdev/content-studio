import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, notFound, ok, unauthorized } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { generatePassword } from "@/lib/credentials";

const schema = z.object({
  active: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await apiUser("ADMIN");
  if (!admin) return unauthorized();
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return notFound("User not found.");
  if (target.role === "ADMIN") return badRequest("The admin account can't be modified here.");

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid data.");

  const data: { active?: boolean; passwordHash?: string } = {};
  let newPassword: string | undefined;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.resetPassword) {
    newPassword = generatePassword(10);
    data.passwordHash = await hashPassword(newPassword);
  }

  await prisma.user.update({ where: { id }, data });

  return ok({
    id,
    ...(newPassword ? { credentials: { username: target.username, password: newPassword } } : {}),
  });
}
