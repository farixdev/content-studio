import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  website: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  memberIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const user = await apiUser("ADMIN");
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid data.");
  const d = parsed.data;

  const project = await prisma.project.create({
    data: {
      name: d.name.trim(),
      website: d.website?.trim() || null,
      description: d.description?.trim() || null,
      createdById: user.id,
      ...(d.memberIds && d.memberIds.length
        ? { members: { create: d.memberIds.map((userId) => ({ userId })) } }
        : {}),
    },
  });

  return ok({ id: project.id });
}
