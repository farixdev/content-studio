import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, forbidden, ok, unauthorized } from "@/lib/api";
import { getContacts, canConverse, touchPresence } from "@/lib/chat";
import { notifyUser } from "@/lib/tasks";

export async function GET() {
  const user = await apiUser();
  if (!user) return unauthorized();

  // Any chat poll doubles as a presence heartbeat.
  await touchPresence(user.id);
  const contacts = await getContacts(user);
  return ok({ contacts });
}

const schema = z.object({
  recipientId: z.string().min(1),
  body: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Type a message.");
  const body = parsed.data.body.trim();
  if (!body) return badRequest("Type a message.");

  const recipient = await prisma.user.findFirst({
    where: { id: parsed.data.recipientId, active: true },
    select: { id: true, name: true, role: true },
  });
  if (!recipient) return badRequest("That person is unavailable.");
  if (recipient.id === user.id) return badRequest("You can't message yourself.");
  // Enforce the messaging policy: workers may only talk to Manager/Reviewer.
  if (!canConverse(user.role, recipient.role)) return forbidden();

  await touchPresence(user.id);

  const msg = await prisma.chatMessage.create({
    data: { authorId: user.id, recipientId: recipient.id, body },
    include: { author: { select: { name: true, role: true } } },
  });

  await notifyUser(recipient.id, "CHAT", `${user.name} messaged you`, null);

  return ok({
    message: {
      id: msg.id,
      body: msg.body,
      authorId: user.id,
      authorName: msg.author.name,
      authorRole: msg.author.role,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
