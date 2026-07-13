import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";

const schema = z.object({
  action: z.enum(["add", "remove"]),
  // Longer than one name so "add" can take a comma-separated list.
  name: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  const user = await apiUser("ADMIN");
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Give the content type a name.");

  if (parsed.data.action === "remove") {
    const name = parsed.data.name.trim();
    if (!name) return badRequest("Give the content type a name.");
    await prisma.contentType.deleteMany({ where: { name } });
    return ok({ ok: true });
  }

  // Add one OR MANY at once — split the input on commas, trim, drop blanks/dupes,
  // cap each name's length, and insert (skipping any that already exist).
  const names = [
    ...new Set(
      parsed.data.name
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.slice(0, 60))
    ),
  ];
  if (!names.length) return badRequest("Give the content type a name.");

  const count = await prisma.contentType.count();
  await prisma.contentType.createMany({
    data: names.map((name, i) => ({ name, order: count + i })),
    skipDuplicates: true,
  });
  return ok({ ok: true, added: names.length });
}
