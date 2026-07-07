import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { baseUsername, generatePassword } from "@/lib/credentials";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.enum(["WRITER", "REVIEWER", "DESIGNER"]),
});

export async function POST(req: Request) {
  const admin = await apiUser("ADMIN");
  if (!admin) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid data.");
  const { name, role } = parsed.data;

  // Ensure a unique username.
  const base = baseUsername(name);
  let username = base;
  let i = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${i}`;
    i += 1;
  }

  const password = generatePassword(10);
  const created = await prisma.user.create({
    data: { name: name.trim(), username, role, passwordHash: await hashPassword(password) },
  });

  return ok({
    user: {
      id: created.id,
      name: created.name,
      username: created.username,
      role: created.role,
      active: created.active,
    },
    credentials: { username, password },
  });
}
