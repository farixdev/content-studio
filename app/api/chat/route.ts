import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, forbidden, ok, unauthorized } from "@/lib/api";
import { getContacts, getChatPolicy, canConverseWith, touchPresence } from "@/lib/chat";
import { notifyUser } from "@/lib/tasks";

export async function GET() {
  const user = await apiUser();
  if (!user) return unauthorized();

  // Any chat poll doubles as a presence heartbeat.
  await touchPresence(user.id);
  const contacts = await getContacts(user);
  return ok({ contacts });
}

const CHAT_FILE_MAX = 1024 * 1024; // 1 MB

const schema = z.object({
  recipientId: z.string().min(1),
  body: z.string().max(2000).optional(),
  fileId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Type a message.");
  const body = (parsed.data.body ?? "").trim();
  const fileId = parsed.data.fileId || null;
  if (!body && !fileId) return badRequest("Type a message or attach a file.");

  const recipient = await prisma.user.findFirst({
    where: { id: parsed.data.recipientId, active: true },
    select: { id: true, name: true, role: true },
  });
  if (!recipient) return badRequest("That person is unavailable.");
  if (recipient.id === user.id) return badRequest("You can't message yourself.");
  // Enforce the Manager-configured messaging policy.
  const policy = await getChatPolicy();
  if (!canConverseWith(policy, user.role, recipient.role)) return forbidden();

  // Only attach your own upload, and keep chat files small.
  if (fileId) {
    const up = await prisma.upload.findUnique({ where: { id: fileId }, select: { uploadedById: true, size: true } });
    if (!up || up.uploadedById !== user.id) return badRequest("That attachment is unavailable.");
    if (up.size > CHAT_FILE_MAX) return badRequest("Attachments must be under 1 MB.");
  }

  await touchPresence(user.id);

  const msg = await prisma.chatMessage.create({
    data: { authorId: user.id, recipientId: recipient.id, body, fileId },
    include: {
      author: { select: { name: true, role: true } },
      file: { select: { id: true, originalName: true } },
    },
  });

  await notifyUser(recipient.id, "CHAT", `${user.name} messaged you`, null);

  return ok({
    message: {
      id: msg.id,
      body: msg.body,
      authorId: user.id,
      authorName: msg.author.name,
      authorRole: msg.author.role,
      file: msg.file ? { id: msg.file.id, name: msg.file.originalName } : null,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
