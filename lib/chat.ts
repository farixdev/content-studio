import { prisma } from "./prisma";

export interface ChatMsg {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

type Row = {
  id: string;
  body: string;
  authorId: string;
  createdAt: Date;
  author: { name: string; role: string };
};

function serialize(m: Row): ChatMsg {
  return {
    id: m.id,
    body: m.body,
    authorId: m.authorId,
    authorName: m.author.name,
    authorRole: m.author.role,
    createdAt: m.createdAt.toISOString(),
  };
}

const AUTHOR = { author: { select: { name: true, role: true } } } as const;

export async function getRecentMessages(limit = 100): Promise<ChatMsg[]> {
  const rows = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: AUTHOR,
  });
  return rows.reverse().map(serialize);
}

export async function getMessagesAfter(afterISO: string): Promise<ChatMsg[]> {
  const after = new Date(afterISO);
  if (isNaN(after.getTime())) return [];
  const rows = await prisma.chatMessage.findMany({
    where: { createdAt: { gt: after } },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: AUTHOR,
  });
  return rows.map(serialize);
}

export interface RosterMember {
  id: string;
  name: string;
  username: string;
  role: string;
  online: boolean;
}

// Considered "online" if seen within this window.
const ONLINE_MS = 3 * 60 * 1000;

export async function getRoster(): Promise<RosterMember[]> {
  const rows = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, username: true, role: true, lastSeenAt: true },
  });
  const now = Date.now();
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    online: !!u.lastSeenAt && now - u.lastSeenAt.getTime() < ONLINE_MS,
  }));
}

/** Mark a user active now (best-effort heartbeat). */
export async function touchPresence(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } }).catch(() => {});
}
