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
  // Only the Manager may create projects (reviewers can work inside existing ones).
  const user = await apiUser("ADMIN");
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid data.");
  const d = parsed.data;

  // Only add members who exist, are active, and are a manageable role. Dedupe.
  let validMemberIds: string[] = [];
  if (d.memberIds && d.memberIds.length) {
    const valid = await prisma.user.findMany({
      where: { id: { in: d.memberIds }, active: true, role: { in: ["WRITER", "REVIEWER", "DESIGNER", "DEVELOPER"] } },
      select: { id: true },
    });
    validMemberIds = [...new Set(valid.map((u) => u.id))];
  }

  const project = await prisma.project.create({
    data: {
      name: d.name.trim(),
      website: d.website?.trim() || null,
      description: d.description?.trim() || null,
      createdById: user.id,
      ...(validMemberIds.length
        ? { members: { create: validMemberIds.map((userId) => ({ userId })) } }
        : {}),
    },
  });

  return ok({ id: project.id });
}
