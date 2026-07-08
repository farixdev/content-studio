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
  // `gte` (not `gt`): DateTime is millisecond precision, so messages sharing the
  // boundary millisecond must be re-fetched. The client de-dupes by id.
  const rows = await prisma.chatMessage.findMany({
    where: { createdAt: { gte: after } },
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

/** Mark a user active now (best-effort). Throttled so a 10s poll doesn't write
 * on every request — only refresh once per minute. */
export async function touchPresence(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - 60_000);
  await prisma.user
    .updateMany({
      where: { id: userId, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }] },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});
}
