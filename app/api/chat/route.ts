import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, ok, unauthorized } from "@/lib/api";
import { getRecentMessages, getMessagesAfter, getRoster, touchPresence } from "@/lib/chat";
import { notifyUser } from "@/lib/tasks";

export async function GET(req: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();

  // Any chat poll doubles as a presence heartbeat.
  await touchPresence(user.id);

  const after = new URL(req.url).searchParams.get("after");
  const messages = after ? await getMessagesAfter(after) : await getRecentMessages(100);
  const roster = await getRoster();
  return ok({ messages, roster });
}

const schema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Type a message.");
  const body = parsed.data.body.trim();
  if (!body) return badRequest("Type a message.");

  await touchPresence(user.id);

  const msg = await prisma.chatMessage.create({
    data: { authorId: user.id, body },
    include: { author: { select: { name: true, role: true } } },
  });

  // @mentions → notify the tagged members (match @username).
  const tokens = [...body.matchAll(/@([a-zA-Z0-9_]+)/g)].map((m) => m[1].toLowerCase());
  if (tokens.length) {
    const mentioned = await prisma.user.findMany({
      where: { username: { in: tokens }, active: true, id: { not: user.id } },
      select: { id: true },
    });
    for (const u of mentioned) {
      await notifyUser(u.id, "CHAT", `${user.name} tagged you in team chat`, null);
    }
  }

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
