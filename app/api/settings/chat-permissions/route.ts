import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";
import { ROLES } from "@/lib/constants";

const schema = z.object({
  fromRole: z.string(),
  toRoles: z.array(z.string()),
});

export async function POST(req: Request) {
  const user = await apiUser("ADMIN");
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid data.");
  const roles = ROLES as unknown as string[];
  const from = parsed.data.fromRole;
  if (!roles.includes(from)) return badRequest("Invalid role.");
  // Keep only valid roles, and never a self-entry.
  const toRoles = [...new Set(parsed.data.toRoles.filter((r) => roles.includes(r) && r !== from))];

  await prisma.chatPermission.upsert({
    where: { fromRole: from },
    create: { fromRole: from, toRoles: JSON.stringify(toRoles) },
    update: { toRoles: JSON.stringify(toRoles) },
  });
  return ok({ ok: true });
}
