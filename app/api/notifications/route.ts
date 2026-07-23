import { prisma } from "@/lib/prisma";
import { apiUser, ok, unauthorized } from "@/lib/api";

export async function GET() {
  const user = await apiUser();
  if (!user) return unauthorized();
  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  return ok({
    notifications: rows.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      taskId: n.taskId,
      actorId: n.actorId,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

export async function PATCH() {
  const user = await apiUser();
  if (!user) return unauthorized();
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  return ok();
}
