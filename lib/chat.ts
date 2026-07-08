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

// ---------------------------------------------------------------------------
// Who may message whom
// ---------------------------------------------------------------------------
// Managers (ADMIN) and Reviewers are "staff": they can message anyone. Writers,
// Designers and Developers can ONLY message staff — never each other.
const STAFF_ROLES = ["ADMIN", "REVIEWER"];

export function isStaffRole(role: string): boolean {
  return STAFF_ROLES.includes(role);
}

/** A conversation between two roles is allowed iff at least one side is staff. */
export function canConverse(roleA: string, roleB: string): boolean {
  return isStaffRole(roleA) || isStaffRole(roleB);
}

// ---------------------------------------------------------------------------
// Contacts (the people the current user is allowed to message)
// ---------------------------------------------------------------------------
export interface Contact {
  id: string;
  name: string;
  username: string;
  role: string;
  online: boolean;
  unread: number;
}

// Considered "online" if seen within this window.
const ONLINE_MS = 3 * 60 * 1000;

export async function getContacts(me: { id: string; role: string }): Promise<Contact[]> {
  const where = isStaffRole(me.role)
    ? { active: true, id: { not: me.id } } // staff can reach everyone
    : { active: true, role: { in: STAFF_ROLES } }; // workers can only reach staff

  const [users, unreadRows] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, username: true, role: true, lastSeenAt: true },
    }),
    prisma.chatMessage.groupBy({
      by: ["authorId"],
      where: { recipientId: me.id, readAt: null },
      _count: { _all: true },
    }),
  ]);

  const unread = new Map(unreadRows.map((r) => [r.authorId, r._count._all]));
  const now = Date.now();
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    online: !!u.lastSeenAt && now - u.lastSeenAt.getTime() < ONLINE_MS,
    unread: unread.get(u.id) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// A single conversation
// ---------------------------------------------------------------------------
export async function getConversation(
  meId: string,
  otherId: string,
  limit = 100
): Promise<ChatMsg[]> {
  const rows = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { authorId: meId, recipientId: otherId },
        { authorId: otherId, recipientId: meId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: AUTHOR,
  });
  return rows.reverse().map(serialize);
}

/** Mark the messages the other person sent me as read. */
export async function markRead(meId: string, otherId: string): Promise<void> {
  await prisma.chatMessage
    .updateMany({
      where: { recipientId: meId, authorId: otherId, readAt: null },
      data: { readAt: new Date() },
    })
    .catch(() => {});
}

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------
/** Mark a user active now (best-effort). Throttled so a poll doesn't write on
 * every request — only refresh once per minute. */
export async function touchPresence(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - 60_000);
  await prisma.user
    .updateMany({
      where: { id: userId, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }] },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});
}
