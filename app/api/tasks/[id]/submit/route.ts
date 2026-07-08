import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api";
import { recordStatus, notifyAdmins, notifyReviewers } from "@/lib/tasks";
import { canWriterEdit } from "@/lib/workflow";
import { countWords } from "@/lib/utils";
import { wordsFromGoogleDoc, wordsFromDocx } from "@/lib/wordcount";

const schema = z.object({
  contentText: z.string().optional().nullable(),
  contentLink: z.string().optional().nullable(),
  contentFileId: z.string().optional().nullable(),
  draft: z.boolean().optional(),
});

/** Best word count we can get: typed text wins; else a shared Google Doc link;
 * else an uploaded .docx. Returns 0 if none are readable. */
async function resolveWords(
  contentText: string | null,
  contentLink: string | null,
  contentFileId: string | null
): Promise<number> {
  const typed = countWords(contentText);
  if (typed > 0) return typed;
  if (contentLink) {
    const w = await wordsFromGoogleDoc(contentLink);
    if (w) return w;
  }
  if (contentFileId) {
    const up = await prisma.upload.findUnique({ where: { id: contentFileId } });
    if (up) {
      const w = await wordsFromDocx(up.data, up.originalName, up.mime);
      if (w) return w;
    }
  }
  return 0;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser("WRITER");
  if (!user) return unauthorized();
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound("Task not found.");
  if (task.writerId !== user.id) return forbidden();
  if (!canWriterEdit(task.status)) {
    return badRequest("This task is not open for editing right now.");
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid data.");
  const d = parsed.data;

  const contentText = d.contentText ?? task.contentText;
  const contentLink = d.contentLink !== undefined ? (d.contentLink?.trim() || null) : task.contentLink;
  const contentFileId = d.contentFileId !== undefined ? d.contentFileId : task.contentFileId;
  const words = await resolveWords(contentText, contentLink, contentFileId);

  if (d.draft) {
    const to = task.status === "ASSIGNED" ? "IN_PROGRESS" : task.status;
    await prisma.task.update({
      where: { id },
      data: { contentText, contentLink, contentFileId, words, status: to },
    });
    if (to !== task.status) await recordStatus(id, task.status, to, user.id, "Started writing");
    return ok({ id, status: to, words });
  }

  // Submitting for review.
  if (!contentText?.trim() && !contentFileId && !contentLink) {
    return badRequest("Add your content, paste a Google Doc link, or attach a file before submitting.");
  }

  const to = task.status === "IMPROVEMENT" ? "ISSUE_RESOLVED" : "WRITTEN";
  await prisma.task.update({
    where: { id },
    data: { contentText, contentLink, contentFileId, words, status: to },
  });
  await prisma.reviewIssue.updateMany({ where: { taskId: id, resolved: false }, data: { resolved: true } });
  await recordStatus(id, task.status, to, user.id, "Submitted for review");
  await notifyAdmins("SUBMITTED", `${user.name} submitted: ${task.title}`, id);
  await notifyReviewers("REVIEW", `Ready to review: ${task.title}`, id);

  return ok({ id, status: to, words });
}
