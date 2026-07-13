import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(40)
    .regex(/^[a-zA-Z0-9_.]+$/, "Username can only use letters, numbers, . and _")
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "New password must be at least 6 characters.").max(100).optional(),
});

/** Change YOUR OWN name / username / password. Changing the username or password
 * requires confirming the current password. */
export async function PATCH(req: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid data.");
  const d = parsed.data;

  const me = await prisma.user.findUnique({ where: { id: user.id } });
  if (!me) return unauthorized();

  const newUsername = d.username !== undefined ? d.username.trim().toLowerCase() : undefined;
  const wantsUsername = newUsername !== undefined && newUsername !== me.username;
  const wantsPassword = !!d.newPassword;

  // Sensitive changes must be confirmed with the current password.
  if (wantsUsername || wantsPassword) {
    if (!d.currentPassword) return badRequest("Enter your current password to confirm the change.");
    const okPw = await bcrypt.compare(d.currentPassword, me.passwordHash);
    if (!okPw) return badRequest("Your current password is incorrect.");
  }

  const data: Prisma.UserUpdateInput = {};
  if (d.name !== undefined && d.name.trim()) data.name = d.name.trim();
  if (wantsUsername) {
    const taken = await prisma.user.findFirst({
      where: { username: newUsername, id: { not: me.id } },
      select: { id: true },
    });
    if (taken) return badRequest("That username is already taken.");
    data.username = newUsername;
  }
  if (wantsPassword) {
    data.passwordHash = await bcrypt.hash(d.newPassword!, 10);
    // The app keeps the plaintext so the Manager can view/re-share credentials.
    data.plainPassword = d.newPassword!;
  }

  if (Object.keys(data).length === 0) return badRequest("Nothing to change.");

  try {
    await prisma.user.update({ where: { id: me.id }, data });
  } catch (e) {
    // Unique-constraint race on username.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return badRequest("That username is already taken.");
    }
    throw e;
  }
  return ok({ ok: true });
}
