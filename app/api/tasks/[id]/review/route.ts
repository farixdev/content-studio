import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiUser, badRequest, notFound, ok, unauthorized } from "@/lib/api";
import { recordStatus, notifyAdmins, notifyUser } from "@/lib/tasks";
import { isReviewPhase, statusAfterApproval } from "@/lib/workflow";

const schema = z.object({
  action: z.enum(["approve", "issue"]),
  note: z.string().optional(),
  message: z.string().optional(),
  fileId: z.string().nullable().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser(["REVIEWER", "ADMIN"]);
  if (!user) return unauthorized();
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound("Task not found.");
  if (!isReviewPhase(task.status)) return badRequest("This task isn't awaiting review.");

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid data.");
  const d = parsed.data;

  if (d.action === "issue") {
    if (!d.message?.trim()) return badRequest("Describe the issue before sending it back.");
    await prisma.reviewIssue.create({
      data: { taskId: id, raisedById: user.id, message: d.message.trim(), fileId: d.fileId || null },
    });
    await prisma.task.update({ where: { id }, data: { status: "IMPROVEMENT" } });
    await recordStatus(id, task.status, "IMPROVEMENT", user.id, "Changes requested");
    if (task.writerId) {
      await notifyUser(task.writerId, "IMPROVEMENT", `Changes requested on: ${task.title}`, id);
    }
    return ok({ id, status: "IMPROVEMENT" });
  }

  // Approve — one sign-off per reviewer.
  try {
    await prisma.reviewApproval.create({
      data: { taskId: id, reviewerId: user.id, note: d.note?.trim() || null },
    });
  } catch {
    // Duplicate approval by the same reviewer — ignore.
  }
  const count = await prisma.reviewApproval.count({ where: { taskId: id } });
  const to = statusAfterApproval(count);
  if (to !== task.status) {
    await prisma.task.update({ where: { id }, data: { status: to } });
    await recordStatus(id, task.status, to, user.id, `Approved by ${user.name}`);
  }
  await notifyAdmins("REVIEWED", `${user.name} approved: ${task.title}`, id);
  return ok({ id, status: to, approvals: count });
}
