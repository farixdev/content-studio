import { prisma } from "@/lib/prisma";
import { apiUser, forbidden, notFound, ok, unauthorized } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const msg = await prisma.chatMessage.findUnique({ where: { id }, select: { authorId: true } });
  if (!msg) return notFound("Message not found.");

  // You can delete your own message; the Manager can delete anyone's.
  if (msg.authorId !== user.id && user.role !== "ADMIN") return forbidden();

  await prisma.chatMessage.delete({ where: { id } });
  return ok({ id });
}
