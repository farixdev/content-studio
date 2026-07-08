import { prisma } from "@/lib/prisma";
import { apiUser, notFound, ok, unauthorized } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser("ADMIN");
  if (!user) return unauthorized();
  const { id } = await params;

  const existing = await prisma.customStatus.findUnique({ where: { id } });
  if (!existing) return notFound("Status not found.");

  // Removing the definition doesn't touch tasks already set to it; they simply
  // render with the neutral fallback label.
  await prisma.customStatus.delete({ where: { id } });
  return ok({ id });
}
