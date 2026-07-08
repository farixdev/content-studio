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
