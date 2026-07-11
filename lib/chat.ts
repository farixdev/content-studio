import { prisma } from "./prisma";

export interface ChatMsg {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  file: { id: string; name: string } | null;
  createdAt: string;
}

type Row = {
  id: string;
  body: string;
  authorId: string;
  createdAt: Date;
  author: { name: string; role: string };
  file: { id: string; originalName: string } | null;
};

function serialize(m: Row): ChatMsg {
  return {
    id: m.id,
    body: m.body,
    authorId: m.authorId,
    authorName: m.author.name,
    authorRole: m.author.role,
    file: m.file ? { id: m.file.id, name: m.file.originalName } : null,
    createdAt: m.createdAt.toISOString(),
  };
}

const INCLUDE = {
  author: { select: { name: true, role: true } },
  file: { select: { id: true, originalName: true } },
} as const;

// ---------------------------------------------------------------------------
// Who may message whom — Manager-configurable policy
// ---------------------------------------------------------------------------
export type ChatPolicy = Record<string, string[]>;

// Default: Writers/Designers/Developers can only reach Manager/Reviewer; staff
// can reach everyone. Managers change this in Settings.
export const DEFAULT_CHAT_POLICY: ChatPolicy = {
  ADMIN: ["WRITER", "REVIEWER", "DESIGNER", "DEVELOPER"],
  REVIEWER: ["WRITER", "DESIGNER", "DEVELOPER", "ADMIN"],
  WRITER: ["ADMIN", "REVIEWER"],
  DESIGNER: ["ADMIN", "REVIEWER"],
  DEVELOPER: ["ADMIN", "REVIEWER"],
};

/** The current chat policy, merging any Manager overrides over the defaults. */
export async function getChatPolicy(): Promise<ChatPolicy> {
  try {
    const rows = await prisma.chatPermission.findMany();
    if (!rows.length) return DEFAULT_CHAT_POLICY;
    const p: ChatPolicy = { ...DEFAULT_CHAT_POLICY };
    for (const r of rows) {
      try {
        const list = JSON.parse(r.toRoles);
        if (Array.isArray(list)) p[r.fromRole] = list.map(String);
      } catch {
        /* keep default for this role */
      }
    }
    return p;
  } catch {
    return DEFAULT_CHAT_POLICY;
  }
}

/** A conversation is allowed if either side is permitted to message the other,
 * so a reply is always possible once someone may reach out. */
export function canConverseWith(policy: ChatPolicy, a: string, b: string): boolean {
  return (policy[a] ?? []).includes(b) || (policy[b] ?? []).includes(a);
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
  const [policy, users, unreadRows] = await Promise.all([
    getChatPolicy(),
    prisma.user.findMany({
      where: { active: true, id: { not: me.id } },
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
  return users
    .filter((u) => canConverseWith(policy, me.role, u.role))
    .map((u) => ({
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
    include: INCLUDE,
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
