import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, forbidden, ok, unauthorized } from "@/lib/api";
import { getConversation, markRead, getChatPolicy, canConverseWith, touchPresence } from "@/lib/chat";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { userId } = await params;

  const other = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, role: true, lastSeenAt: true },
  });
  if (!other) return badRequest("That person is unavailable.");
  const policy = await getChatPolicy();
  if (!canConverseWith(policy, user.role, other.role)) return forbidden();

  await touchPresence(user.id);
  const [messages] = await Promise.all([getConversation(user.id, other.id), markRead(user.id, other.id)]);

  const ONLINE_MS = 3 * 60 * 1000;
  return ok({
    messages,
    contact: {
      id: other.id,
      name: other.name,
      username: other.username,
      role: other.role,
      online: !!other.lastSeenAt && Date.now() - other.lastSeenAt.getTime() < ONLINE_MS,
    },
  });
}
