import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";

const schema = z.object({
  action: z.enum(["add", "remove"]),
  name: z.string().min(1).max(60),
});

export async function POST(req: Request) {
  const user = await apiUser("ADMIN");
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Give the content type a name.");
  const name = parsed.data.name.trim();
  if (!name) return badRequest("Give the content type a name.");

  if (parsed.data.action === "remove") {
    await prisma.contentType.deleteMany({ where: { name } });
    return ok({ ok: true });
  }

  const count = await prisma.contentType.count();
  try {
    await prisma.contentType.create({ data: { name, order: count } });
    return ok({ ok: true });
  } catch {
    return badRequest("That content type already exists.");
  }
}
